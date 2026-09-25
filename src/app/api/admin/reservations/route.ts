import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { createReservation } from "@/lib/services/reservation";
import { sendTemplateEmail } from "@/lib/services/email";
import { onReservationCreated } from "@/lib/services/notifications";
import { notifyOwner } from "@/lib/services/owner-alerts";
import { auditAdmin } from "@/lib/services/audit";
import { reservationAdminSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { fmtDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
  if (!can(admin.roleName as never, "reservations.create")) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const limited = await rateLimit(`admin-create:${admin.userId}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = reservationAdminSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  const data = parsed.data;

  try {
    // No card payments on this platform — admin bookings are pay-at-hostel too.
    const reservation = await createReservation({
      customerId: data.customerId,
      hostelId: data.hostelId,
      roomId: data.roomId,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      rooms: data.rooms ?? 1,
      specialRequests: data.specialRequests || undefined,
      paymentMethod: "PAY_AT_HOSTEL",
      bookingSource: "ADMIN",
    });

    const customer = await prisma.user.findUnique({
      where: { id: data.customerId },
      select: { email: true, firstName: true, locale: true },
    });
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      select: { name: true, hostel: { select: { name: true } } },
    });

    await Promise.allSettled([
      customer?.email
        ? sendTemplateEmail(
            "reservation_confirmed",
            customer.email,
            {
              firstName: customer.firstName,
              reservationNumber: reservation.number,
              hostelName: room?.hostel.name ?? "",
              roomName: room?.name ?? "",
              checkIn: fmtDate(reservation.checkIn, customer.locale ?? "en"),
              checkOut: fmtDate(reservation.checkOut, customer.locale ?? "en"),
              guests: String(data.guests),
              total: `${reservation.currency} ${reservation.total}`,
              detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account/reservations/${reservation.id}`,
            },
            customer.locale ?? "en"
          )
        : null,
      onReservationCreated(reservation.id),
      notifyOwner({
        template: "reservation_new_owner",
        reservationId: reservation.id,
        guest: {
          firstName: customer?.firstName ?? "Guest",
          lastName: "",
          phone: "—",
          specialRequests: data.specialRequests || "None",
        },
      }),
      auditAdmin(admin.userId, "RESERVATION_CREATED", "reservation", reservation.id, `Admin booking ${reservation.number}`, ipFromRequest(req)),
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
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
  if (!can(admin.roleName as never, "reservations.delete")) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const limited = await rateLimit(`admin-res-clear:${admin.userId}`, 5, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  try {
    const { count } = await prisma.reservation.deleteMany({});

    await auditAdmin(
      admin.userId,
      "RESERVATIONS_CLEARED_ALL",
      "reservation",
      "ALL",
      `Deleted all ${count} reservations`,
      ipFromRequest(req)
    );

    return NextResponse.json({ ok: true, deleted: count });
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }
}