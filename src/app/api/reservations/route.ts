import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createReservation } from "@/lib/services/reservation";
import { sendTemplateEmail } from "@/lib/services/email";
import { onReservationCreated } from "@/lib/services/notifications";
import { notifyOwner } from "@/lib/services/owner-alerts";
import { audit } from "@/lib/services/audit";
import { reservationInputSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { fmtDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let sessionUser: Awaited<ReturnType<typeof requireAuth>> | null = null;
  try {
    sessionUser = await requireAuth();
  } catch {
    return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit(`reserve:${sessionUser.session.sub}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const parsed = reservationInputSchema.pick({
    hostelId: true,
    roomId: true,
    checkIn: true,
    checkOut: true,
    guests: true,
    rooms: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    country: true,
    specialRequests: true,
    promoCode: true,
    guestNames: true,
  }).safeParse(body);
  if (!parsed.success) {
    const field = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: field ?? "errors.generic" }, { status: 400 });
  }
  const data = parsed.data;

  // This platform takes no card payments — reservations are always pay-at-hostel.
  try {
    const reservation = await createReservation({
      customerId: sessionUser.session.sub,
      hostelId: data.hostelId,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      rooms: data.rooms ?? 1,
      specialRequests: data.specialRequests,
      paymentMethod: "PAY_AT_HOSTEL",
      promoCode: data.promoCode || undefined,
      bookingSource: "WEB",
      guestNames: data.guestNames?.length ? data.guestNames : undefined,
    });

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      select: { name: true, hostel: { select: { name: true } } },
    });

    await Promise.allSettled([
      sendTemplateEmail(
        "reservation_confirmed",
        data.email,
        {
          firstName: data.firstName,
          reservationNumber: reservation.number,
          hostelName: room?.hostel.name ?? "",
          roomName: room?.name ?? "",
          checkIn: fmtDate(reservation.checkIn, sessionUser.user.locale ?? "en"),
          checkOut: fmtDate(reservation.checkOut, sessionUser.user.locale ?? "en"),
          guests: String(data.guests),
          total: `${reservation.currency} ${reservation.total}`,
          detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account/reservations/${reservation.id}`,
        },
        sessionUser.user.locale ?? "en"
      ),
      onReservationCreated(reservation.id),
      notifyOwner({
        template: "reservation_new_owner",
        reservationId: reservation.id,
        guest: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || "—",
          specialRequests: data.specialRequests || "None",
        },
      }),
      audit({
        userId: sessionUser.session.sub,
        action: "RESERVATION_CREATED",
        objectType: "reservation",
        objectId: reservation.id,
        detail: `Customer booked ${data.checkIn} → ${data.checkOut} · ${reservation.number}`,
        ip: ipFromRequest(req),
      }),
    ]);

    return NextResponse.json(
      { ok: true, reservation: { id: reservation.id, number: reservation.number, status: reservation.status } },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("already booked") || message.includes("unavailable")) {
      return NextResponse.json({ error: "booking.roomUnavailable" }, { status: 409 });
    }
    if (message.includes("Minimum stay")) {
      return NextResponse.json({ error: "errors.checkoutAfterCheckin" }, { status: 422 });
    }
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }
}