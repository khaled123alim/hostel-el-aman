import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRoomAvailability, calculatePrice, type PriceBreakdown } from "@/lib/services/reservation";
import { parseDay } from "@/lib/utils";
import { convertAmount } from "@/lib/currency";
import { getSettings } from "@/lib/settings";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const limited = await rateLimit(`quote:${ipFromRequest(req)}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: {
    hostelId?: string;
    roomId?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    rooms?: number;
    promoCode?: string;
    currency?: string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const { hostelId, roomId, checkIn, checkOut, promoCode } = body;
  if (
    !hostelId ||
    !roomId ||
    !checkIn ||
    !checkOut ||
    !DATE_RE.test(checkIn) ||
    !DATE_RE.test(checkOut) ||
    checkIn >= checkOut
  ) {
    return NextResponse.json({ error: "errors.checkoutAfterCheckin" }, { status: 400 });
  }

  const [room, settings] = await Promise.all([
    prisma.room.findFirst({
      where: { id: roomId, hostelId, status: "ACTIVE" },
    }),
    getSettings(),
  ]);
  if (!room) {
    return NextResponse.json({ error: "booking.roomUnavailable" }, { status: 404 });
  }

  const base = settings.general?.defaultCurrency ?? "EUR";
  const target = String(body.currency ?? base);

  const checkInDate = parseDay(checkIn);
  const checkOutDate = parseDay(checkOut);
  const guests = Math.max(1, body.guests ?? 1);
  const roomsCount = Math.min(5, Math.max(1, body.rooms ?? 1));

  try {
    const availability = await checkRoomAvailability(room.id, checkInDate, checkOutDate);
    const raw = await calculatePrice(room.id, checkInDate, checkOutDate, {
      rooms: roomsCount,
      promoCode: promoCode?.trim() || undefined,
      currency: base,
    });

    const rate = (await convertAmount(1, base, target)).rate ?? 1;
    const conv = (n: number) => Math.round(n * rate * 100) / 100;

    const price: PriceBreakdown = {
      ...raw,
      nightly: raw.nightly.map(conv),
      subtotal: conv(raw.subtotal),
      taxes: conv(raw.taxes),
      fees: conv(raw.fees),
      discount: conv(raw.discount),
      total: conv(raw.total),
      pricePerNight: conv(raw.pricePerNight),
      currency: target,
    };

    return NextResponse.json({
      ok: true,
      available: availability.available,
      blockedDates: availability.blockedDates,
      room: {
        id: room.id,
        name: room.name,
        number: room.number,
        capacity: room.capacity,
        beds: room.beds,
        type: room.type,
      },
      price,
    });
  } catch (e) {
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }
}