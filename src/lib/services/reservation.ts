import { prisma } from "@/lib/db";
import type {
  BookingSource,
  PaymentMethod,
  Prisma,
  Reservation,
  ReservationStatus,
} from "@prisma/client";
import { rangeDates, isoDay, nightsBetween, addDays, genId } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { roundMoney } from "@/lib/currency";

// ---------------------------------------------------------------------------
// Availability engine
// ---------------------------------------------------------------------------

export interface AvailabilityWindow {
  date: string;
  open: boolean;
  blocked: boolean;
  closed: boolean;
  reason?: string;
}

const ACTIVE_STATUSES: ReservationStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "NO_SHOW"];

interface AvailabilityResult {
  available: boolean;
  windows: AvailabilityWindow[];
  conflictingReservation?: { number: string; checkIn: Date; checkOut: Date };
  blockedDates: string[];
}

export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  opts?: { excludeReservationId?: string; ignoreBlocked?: boolean }
): Promise<AvailabilityResult> {
  const dates = rangeDates(checkIn, checkOut);
  const windows: AvailabilityWindow[] = dates.map((d) => ({
    date: isoDay(d),
    open: true,
    blocked: false,
    closed: false,
  }));

  const [room, overrides, conflicts] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    prisma.roomAvailability.findMany({
      where: {
        roomId,
        date: { gte: checkIn, lt: checkOut },
        status: { not: "OPEN" },
      },
    }),
    prisma.reservation.findFirst({
      where: {
        roomId,
        id: opts?.excludeReservationId ? { not: opts.excludeReservationId } : undefined,
        status: { in: ACTIVE_STATUSES },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
      orderBy: { checkIn: "asc" },
      select: { number: true, checkIn: true, checkOut: true },
    }),
  ]);

  if (!room) throw new Error("Room not found");

  const blockedByOverride = new Map(overrides.map((o) => [isoDay(o.date), o]));

  for (const w of windows) {
    const ov = blockedByOverride.get(w.date);
    if (ov && ov.status === "BLOCKED") {
      w.open = false;
      w.blocked = true;
      w.reason = ov.reason ?? "Blocked";
    } else if (ov && ov.status === "CLOSED") {
      w.open = false;
      w.closed = true;
      w.reason = ov.reason ?? "Closed";
    }
  }

  const blockedDates = windows.filter((w) => !w.open).map((w) => w.date);
  const available = room.status === "ACTIVE" && blockedDates.length === 0 && !conflicts;

  return { available, windows, conflictingReservation: conflicts ?? undefined, blockedDates };
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface PriceBreakdown {
  nightly: number[];
  nights: number;
  subtotal: number;
  taxes: number;
  taxesRate: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  pricePerNight: number;
}

export async function getNightlyPrices(roomId: string, checkIn: Date, checkOut: Date): Promise<number[]> {
  const [room, overrides] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    prisma.roomAvailability.findMany({
      where: { roomId, date: { gte: checkIn, lt: checkOut }, priceOverride: { not: null } },
    }),
  ]);
  if (!room) throw new Error("Room not found");
  const map = new Map(overrides.filter((o) => o.priceOverride != null).map((o) => [isoDay(o.date), o.priceOverride!]));
  return rangeDates(checkIn, checkOut).map((d) => map.get(isoDay(d)) ?? room.pricePerNight);
}

export async function calculatePrice(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  opts?: { rooms?: number; promoCode?: string; currency?: string }
): Promise<PriceBreakdown> {
  const [room, settings] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId } }),
    getSettings(),
  ]);
  if (!room) throw new Error("Room not found");

  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw new Error("Invalid date range");

  const nightly = await getNightlyPrices(roomId, checkIn, checkOut);
  const rooms = opts?.rooms ?? 1;
  const subtotal = roundMoney(nightly.reduce((a, b) => a + b, 0) * rooms);

  const taxRate = room.taxRate > 0 ? room.taxRate : (settings.tax?.rate ?? 10);
  const taxes = roundMoney(subtotal * (taxRate / 100));

  const fees = settings.tax?.applyCleaningFee !== false ? roundMoney(room.cleaningFee * rooms) : 0;

  let promo: { discount: number } | null = null;
  let discount = 0;
  if (opts?.promoCode) {
    promo = await validatePromotion(opts.promoCode, nights, subtotal, room.hostelId, room.id);
    if (promo) discount = promo.discount;
  }

  const total = roundMoney(subtotal + taxes + fees - discount);

  return {
    nightly,
    nights,
    subtotal,
    taxes,
    taxesRate: taxRate,
    fees,
    discount,
    total,
    currency: opts?.currency ?? settings.general?.defaultCurrency ?? "DZD",
    pricePerNight: nightly[0] ?? room.pricePerNight,
  };
}

export async function validatePromotion(
  code: string,
  nights: number,
  subtotal: number,
  hostelId: string,
  roomId: string
): Promise<{ discount: number } | null> {
  const promo = await prisma.promotion.findFirst({
    where: { code: code.trim().toUpperCase(), status: "ACTIVE" },
  });
  if (!promo) return null;
  const now = new Date();
  if (now < promo.startDate || now > promo.endDate) return null;
  if (nights < promo.minNights) return null;
  if (promo.minAmount && subtotal < promo.minAmount) return null;
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return null;

  let applicableHostels: string[] = [];
  let applicableRooms: string[] = [];
  try {
    applicableHostels = JSON.parse(promo.applicableHostels);
    applicableRooms = JSON.parse(promo.applicableRooms);
  } catch {
    applicableHostels = [];
    applicableRooms = [];
  }

  if (applicableHostels.length && !applicableHostels.includes(hostelId)) return null;
  if (applicableRooms.length && !applicableRooms.includes(roomId)) return null;

  const discount =
    promo.type === "PERCENTAGE" ? roundMoney(subtotal * (promo.value / 100)) : promo.fixedDiscount;
  return { discount: Math.min(discount, subtotal) };
}

// ---------------------------------------------------------------------------
// Reservation creation (transactional, prevents double-booking)
// ---------------------------------------------------------------------------

export interface CreateReservationInput {
  customerId: string;
  hostelId: string;
  roomId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  guests: number;
  rooms?: number;
  specialRequests?: string;
  paymentMethod: PaymentMethod;
  promoCode?: string;
  bookingSource?: BookingSource;
  guestNames?: { fullName: string; age?: number | null }[];
}

export async function createReservation(input: CreateReservationInput) {
  const settings = await getSettings();
  const checkIn = new Date(input.checkIn + "T14:00:00");
  const checkOut = new Date(input.checkOut + "T11:00:00");

  return prisma.$transaction(async (tx) => {
    const [room, customer] = await Promise.all([
      tx.room.findUnique({ where: { id: input.roomId }, include: { hostel: true } }),
      tx.user.findUnique({ where: { id: input.customerId } }),
    ]);
    if (!room || !customer) throw new Error("Room or customer not found");
    if (input.rooms && input.rooms > 1) {
      const roomsAvailable = await tx.room.count({ where: { id: input.roomId, status: "ACTIVE" } });
      if (roomsAvailable < input.rooms) throw new Error("Not enough rooms available");
    }
    if (input.guests > room.capacity * (input.rooms ?? 1)) throw new Error("Guest count exceeds room capacity");

    // double-booking guard
    const overlap = await tx.reservation.findFirst({
      where: {
        roomId: room.id,
        status: { in: ACTIVE_STATUSES },
        AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
      },
      select: { number: true },
    });
    if (overlap) throw new Error(`Room is already booked for these dates (${overlap.number}).`);

    const blocked = await tx.roomAvailability.findFirst({
      where: { roomId: room.id, date: { gte: checkIn, lt: checkOut }, status: { not: "OPEN" } },
    });
    if (blocked) throw new Error("Room is unavailable for these dates.");

    const nights = nightsBetween(checkIn, checkOut);
    if (nights < room.minStay) throw new Error(`Minimum stay is ${room.minStay} night(s).`);
    if (nights > room.maxStay) throw new Error(`Maximum stay is ${room.maxStay} night(s).`);
    if (nights < (settings.reservations?.minNights ?? 1)) throw new Error("Stay is too short.");

    let price = await calculatePrice(
      room.id,
      checkIn,
      checkOut,
      { rooms: input.rooms ?? 1, promoCode: input.promoCode, currency: customer.currency || undefined }
    );

    const promo = input.promoCode
      ? await tx.promotion.findFirst({ where: { code: input.promoCode.trim().toUpperCase(), status: "ACTIVE" } })
      : null;
    if (input.promoCode && !promo) throw new Error("Invalid promo code.");
    if (promo) await tx.promotion.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });

    const number = genId("RS", 6);
    const currency = customer.currency || settings.general?.defaultCurrency || "DZD";

    const reservation = await tx.reservation.create({
      data: {
        number,
        customerId: customer.id,
        hostelId: room.hostelId,
        roomId: room.id,
        checkIn,
        checkOut,
        nights,
        roomsCount: input.rooms ?? 1,
        guests: input.guests,
        pricePerNight: price.pricePerNight,
        subtotal: price.subtotal,
        taxes: price.taxes,
        fees: price.fees,
        discount: price.discount,
        total: price.total,
        currency,
        status: settings.reservations?.autoConfirm === false ? "PENDING" : "CONFIRMED",
        paymentStatus: input.paymentMethod === "PAY_AT_HOSTEL" ? "PENDING" : "PENDING",
        paymentMethod: input.paymentMethod,
        specialRequests: input.specialRequests,
        promoCode: input.promoCode?.trim().toUpperCase(),
        promotionId: promo?.id ?? null,
        bookingSource: input.bookingSource ?? "WEB",
        cancellationPolicy: settings.cancellation?.text,
        checkInCode: genId("KEY", 4),
      },
    });

    if (input.guestNames?.length) {
      await tx.reservationGuest.createMany({
        data: input.guestNames.map((g) => ({
          reservationId: reservation.id,
          fullName: g.fullName,
          age: g.age ?? null,
        })),
      });
    }

    await tx.reservationHistory.create({
      data: {
        reservationId: reservation.id,
        action: "CREATED",
        detail: `Reservation created (source: ${input.bookingSource ?? "web"})`,
      },
    });

    return reservation;
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function cancelReservation(
  reservationId: string,
  opts?: { reason?: string; cancelledBy?: string; refund?: boolean }
) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: true, promotion: true },
    });
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status === "CANCELLED") return reservation;

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: opts?.reason,
      },
    });

    // Restore promo usage if it was used
    if (reservation.promotionId) {
      await tx.promotion.update({
        where: { id: reservation.promotionId },
        data: { usedCount: { decrement: 1 } },
      });
    }

    // If already paid and refund requested / policy allows → create refund
    const paid = reservation.payments.find((p) => p.status === "PAID");
    if (paid && (opts?.refund ?? true)) {
      await tx.refund.create({
        data: {
          paymentId: paid.id,
          amount: paid.amount,
          currency: paid.currency,
          reason: opts?.reason ?? "Reservation cancelled",
          status: "COMPLETED",
          processedById: opts?.cancelledBy,
        },
      });
      await tx.payment.update({
        where: { id: paid.id },
        data: { status: "REFUNDED" },
      });
      await tx.reservation.update({
        where: { id: reservationId },
        data: { paymentStatus: "REFUNDED" },
      });
    } else if (reservation.paymentStatus === "PENDING") {
      const pending = reservation.payments.find((p) => p.status === "PENDING");
      if (pending) {
        await tx.payment.update({ where: { id: pending.id }, data: { status: "FAILED" } });
      }
    }

    await tx.reservationHistory.create({
      data: {
        reservationId,
        action: "CANCELLED",
        detail: opts?.reason ?? "Cancelled",
      },
    });

    return updated;
  });
}

export async function confirmReservation(reservationId: string, adminId?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error("Reservation not found");
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
    });
    await tx.reservationHistory.create({
      data: { reservationId, action: "CONFIRMED", detail: "Confirmed by staff" },
    });
    return updated;
  });
}

export async function changeReservationDates(
  reservationId: string,
  checkIn: string,
  checkOut: string,
  adminId?: string
) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error("Reservation not found");
    if (["CANCELLED", "CHECKED_OUT", "NO_SHOW"].includes(reservation.status)) {
      throw new Error("This reservation cannot be modified.");
    }

    const newCheckIn = new Date(checkIn + "T14:00:00");
    const newCheckOut = new Date(checkOut + "T11:00:00");

    const overlap = await tx.reservation.findFirst({
      where: {
        roomId: reservation.roomId,
        id: { not: reservationId },
        status: { in: ACTIVE_STATUSES },
        AND: [{ checkIn: { lt: newCheckOut } }, { checkOut: { gt: newCheckIn } }],
      },
    });
    if (overlap) throw new Error("Room is not available for the new dates.");

    const blocked = await tx.roomAvailability.findFirst({
      where: { roomId: reservation.roomId, date: { gte: newCheckIn, lt: newCheckOut }, status: { not: "OPEN" } },
    });
    if (blocked) throw new Error("Room is blocked for the new dates.");

    const nights = nightsBetween(newCheckIn, newCheckOut);
    if (nights < 1) throw new Error("Invalid dates.");

    const price = await calculatePrice(reservation.roomId, newCheckIn, newCheckOut, {
      rooms: reservation.roomsCount,
      promoCode: reservation.promoCode ?? undefined,
      currency: reservation.currency,
    });

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        nights,
        pricePerNight: price.pricePerNight,
        subtotal: price.subtotal,
        taxes: price.taxes,
        fees: price.fees,
        discount: price.discount,
        total: price.total,
      },
    });

    await tx.reservationHistory.create({
      data: { reservationId, action: "MODIFIED", detail: `Dates changed to ${checkIn} → ${checkOut}` },
    });

    return updated;
  });
}

export async function moveReservationToRoom(reservationId: string, newRoomId: string, adminId?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error("Reservation not found");

    const target = await tx.room.findUnique({ where: { id: newRoomId } });
    if (!target) throw new Error("Target room not found");

    const overlap = await tx.reservation.findFirst({
      where: {
        roomId: newRoomId,
        id: { not: reservationId },
        status: { in: ACTIVE_STATUSES },
        AND: [
          { checkIn: { lt: reservation.checkOut } },
          { checkOut: { gt: reservation.checkIn } },
        ],
      },
    });
    if (overlap) throw new Error("Target room is occupied for these dates.");

    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { roomId: newRoomId },
    });
    await tx.reservationHistory.create({
      data: {
        reservationId,
        action: "ROOM_CHANGED",
        detail: `Moved from room #${reservation.roomId} to ${target.name} (${target.number})`,
      },
    });
    return updated;
  });
}

export async function checkInReservation(reservationId: string, adminId?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error("Reservation not found");
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });
    await tx.reservationHistory.create({ data: { reservationId, action: "CHECKED_IN", detail: "Guest checked in" } });
    return updated;
  });
}

export async function checkOutReservation(reservationId: string, adminId?: string) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error("Reservation not found");
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CHECKED_OUT", checkedOutAt: new Date() },
    });
    await tx.reservationHistory.create({ data: { reservationId, action: "CHECKED_OUT", detail: "Guest checked out" } });
    await tx.room.update({
      where: { id: reservation.roomId },
      data: { housekeepingStatus: "DIRTY" },
    });
    return updated;
  });
}

export function reservationStatusActions(status: ReservationStatus) {
  return {
    canConfirm: status === "PENDING",
    canCheckIn: ["CONFIRMED", "PENDING"].includes(status),
    canCheckOut: status === "CHECKED_IN",
    canCancel: ["PENDING", "CONFIRMED"].includes(status),
    canRefund: status !== "CANCELLED",
  };
}

export type ReservationFull = Prisma.ReservationGetPayload<{
  include: {
    customer: true;
    hostel: true;
    room: true;
    payments: true;
    history: { orderBy?: any };
    notes: { include: { author: true } };
    review: true;
  };
}>;