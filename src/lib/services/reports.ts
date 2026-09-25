import { prisma } from "@/lib/db";
import { isoDay } from "@/lib/utils";

export type Period = "today" | "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
}

export function periodRange(period: Period, customStart?: string, customEnd?: string): PeriodRange {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end.setDate(end.getDate() + 1);
      break;
    case "7d":
      start = new Date(now);
      start.setDate(start.getDate() - 6);
      break;
    case "30d":
      start = new Date(now);
      start.setDate(start.getDate() - 29);
      break;
    case "3m":
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "custom":
      start = customStart ? new Date(customStart) : start;
      break;
  }
  if (customEnd) end.setTime(new Date(customEnd).getTime());
  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);
  return { start, end, label: `${isoDay(start)} → ${isoDay(end)}` };
}

export interface DashboardStats {
  totals: {
    reservations: number;
    revenue: number;
    occupancyRate: number;
    todayCheckins: number;
    todayCheckouts: number;
    availableRooms: number;
    totalRooms: number;
    pendingPayments: number;
    cancelledRate: number;
    avgBookingValue: number;
    currentGuests: number;
  };
  series: {
    date: string;
    label: string;
    revenue: number;
    reservations: number;
    occupancy: number;
  }[];
  roomTypePopularity: { name: string; count: number }[];
  bookingSources: { name: string; count: number }[];
  paymentMethods: { name: string; count: number }[];
  recent: Array<{
    id: string;
    number: string;
    customerName: string;
    hostelName: string;
    total: number;
    currency: string;
    status: string;
    createdAt: Date;
  }>;
}

export async function getDashboardStats(period: Period, customStart?: string, customEnd?: string): Promise<DashboardStats> {
  const { start, end } = periodRange(period, customStart, customEnd);

  const [reservations, payments, rooms, today, blocked] = await Promise.all([
    prisma.reservation.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { customer: true, hostel: true, room: true },
    }),
    prisma.payment.findMany({
      where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] }, paidAt: { gte: start, lte: end } },
    }),
    prisma.room.findMany({ where: { status: "ACTIVE" }, select: { id: true, housekeepingStatus: true } }),
    Promise.all([
      reservationsForRange(start, end),
    ]),
    prisma.roomAvailability.findMany({ where: { date: { gte: start, lte: end }, status: { not: "OPEN" } } }),
  ]);

  const [todayArrivals, todayDepartures, currentGuestsCount] = await Promise.all([
    prisma.reservation.count({
      where: {
        checkIn: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.reservation.count({
      where: {
        checkOut: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "CHECKED_IN",
      },
    }),
    prisma.reservation.count({ where: { status: "CHECKED_IN" } }),
  ]);

  const revenue = payments.reduce((s, p) => s + p.amount, 0);
  const avgBookingValue = reservations.length ? revenue / reservations.length : 0;
  const cancelled = reservations.filter((r) => r.status === "CANCELLED").length;
  const cancelledRate = reservations.length ? (cancelled / reservations.length) * 100 : 0;

  // occupancy: room-nights occupied over the period
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const allRangeReservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "NO_SHOW"] },
      AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
    },
  });
  const occupiedNights = allRangeReservations.reduce(
    (s, r) => s + nightsInRange(r.checkIn, r.checkOut, start, end),
    0
  );
  const totalRoomNights = rooms.length * totalDays;
  const occupancyRate = totalRoomNights > 0 ? Math.round((occupiedNights / totalRoomNights) * 100) : 0;

  const availableRoomsToday = await prisma.room.findMany({
    where: { status: "ACTIVE" },
    include: {
      _count: {
        select: {
          reservations: {
            where: {
              status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "NO_SHOW"] },
              AND: [{ checkIn: { lte: new Date() } }, { checkOut: { gte: new Date() } }],
            },
          },
        },
      },
    },
  });
  const availableRooms = availableRoomsToday.filter((r) => r._count.reservations === 0).length;

  const pendingPayments = await prisma.reservation.count({
    where: { paymentStatus: "PENDING", status: { not: "CANCELLED" } },
  });

  // series
  const daysList: Date[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) daysList.push(d);
  const buckets = daysList.map((d) => {
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayRes = reservations.filter((r) => r.createdAt >= dayStart && r.createdAt < dayEnd);
    const dayPay = payments.filter((p) => p.paidAt && p.paidAt >= dayStart && p.paidAt < dayEnd);
    const occ = allRangeReservations.filter(
      (r) => r.checkIn < dayEnd && r.checkOut > dayStart
    ).length;
    return {
      date: isoDay(d),
      label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      revenue: dayPay.reduce((s, p) => s + p.amount, 0),
      reservations: dayRes.length,
      occupancy: Math.min(100, rooms.length ? Math.round((occ / rooms.length) * 100) : 0),
    };
  });

  const roomTypeCount = new Map<string, number>();
  for (const r of reservations) {
    roomTypeCount.set(r.room.type, (roomTypeCount.get(r.room.type) ?? 0) + 1);
  }
  const sourceCount = new Map<string, number>();
  for (const r of reservations) {
    sourceCount.set(r.bookingSource, (sourceCount.get(r.bookingSource) ?? 0) + 1);
  }
  const methodCount = new Map<string, number>();
  for (const r of reservations) {
    if (r.paymentMethod) methodCount.set(r.paymentMethod, (methodCount.get(r.paymentMethod) ?? 0) + 1);
  }

  void today;
  void blocked;

  return {
    totals: {
      reservations: reservations.length,
      revenue: Math.round(revenue * 100) / 100,
      occupancyRate,
      todayCheckins: todayArrivals,
      todayCheckouts: todayDepartures,
      availableRooms,
      totalRooms: rooms.length,
      pendingPayments,
      cancelledRate: Math.round(cancelledRate * 10) / 10,
      avgBookingValue: Math.round(avgBookingValue * 100) / 100,
      currentGuests: currentGuestsCount,
    },
    series: buckets,
    roomTypePopularity: [...roomTypeCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    bookingSources: [...sourceCount.entries()].map(([name, count]) => ({ name, count })),
    paymentMethods: [...methodCount.entries()].map(([name, count]) => ({ name, count })),
    recent: reservations
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        number: r.number,
        customerName: `${r.customer.firstName} ${r.customer.lastName}`,
        hostelName: r.hostel.name,
        total: r.total,
        currency: r.currency,
        status: r.status,
        createdAt: r.createdAt,
      })),
  };
}

function nightsInRange(checkIn: Date, checkOut: Date, start: Date, end: Date): number {
  const s = checkIn > start ? checkIn : start;
  const e = checkOut < end ? checkOut : end;
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return Math.max(0, diff);
}

async function reservationsForRange(start: Date, end: Date) {
  return prisma.reservation.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { id: true },
  });
}

export interface ReportData {
  revenue: { today: number; week: number; month: number; total: number };
  reservations: { today: number; week: number; month: number; total: number };
  occupancyToday: number;
  occupancyWeek: number;
  avgBookingValue: number;
  popularRooms: { name: string; count: number }[];
  popularHostels: { name: string; count: number }[];
  cancellationRate: number;
  topCountries: { name: string; count: number }[];
  monthlyRevenue: { month: string; revenue: number; reservations: number }[];
  dailyRevenue: { day: string; revenue: number; reservations: number }[];
}

export async function getReportData(): Promise<ReportData> {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now);
  yearStart.setFullYear(yearStart.getFullYear() - 12);

  const whereRange = (start: Date) => ({ createdAt: { gte: start } });

  const [todayRes, weekRes, monthRes, allRes, paidPayments, monthPayments] = await Promise.all([
    prisma.reservation.findMany({ where: whereRange(dayStart), include: { room: true, hostel: true, customer: true } }),
    prisma.reservation.findMany({ where: whereRange(weekStart), include: { customer: true } }),
    prisma.reservation.findMany({ where: whereRange(monthStart) }),
    prisma.reservation.findMany({ include: { customer: true } }),
    prisma.payment.findMany({ where: { status: "PAID" } }),
    prisma.payment.findMany({ where: { status: "PAID", paidAt: { gte: monthStart } } }),
  ]);

  const sumPay = (arr: { amount: number }[]) => arr.reduce((s, p) => s + p.amount, 0);

  const roomCount = new Map<string, number>();
  const hostelCount = new Map<string, number>();
  const countryCount = new Map<string, number>();
  for (const r of todayRes) {
    if (r.room?.name) roomCount.set(r.room.name, (roomCount.get(r.room.name) ?? 0) + 1);
    if (r.hostel?.name) hostelCount.set(r.hostel.name, (hostelCount.get(r.hostel.name) ?? 0) + 1);
  }
  for (const r of allRes) {
    if (r.customer?.country) countryCount.set(r.customer.country, (countryCount.get(r.customer.country) ?? 0) + 1);
  }

  const cancelled = allRes.filter((r) => r.status === "CANCELLED").length;
  const cancellationRate = allRes.length ? (cancelled / allRes.length) * 100 : 0;

  const rooms = await prisma.room.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  const occupancyToday =
    rooms.length > 0
      ? Math.round(
          ((await prisma.reservation.count({
            where: {
              status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "NO_SHOW"] },
              AND: [{ checkIn: { lte: now } }, { checkOut: { gte: now } }],
            },
          })) /
            rooms.length) *
            100
        )
      : 0;

  const monthlyRevenue = await prisma.payment.groupBy({
    by: ["paidAt"],
    where: { status: "PAID", paidAt: { gte: yearStart } },
    _sum: { amount: true },
  });

  return {
    revenue: {
      today: sumPay(paidPayments.filter((p) => p.paidAt && p.paidAt >= dayStart)),
      week: sumPay(paidPayments.filter((p) => p.paidAt && p.paidAt >= weekStart)),
      month: sumPay(monthPayments),
      total: sumPay(paidPayments),
    },
    reservations: {
      today: todayRes.length,
      week: weekRes.length,
      month: monthRes.length,
      total: allRes.length,
    },
    occupancyToday,
    occupancyWeek: 0,
    avgBookingValue: allRes.length ? sumPay(paidPayments) / Math.max(1, allRes.length) : 0,
    popularRooms: [...roomCount.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    popularHostels: [...hostelCount.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    cancellationRate: Math.round(cancellationRate * 10) / 10,
    topCountries: [...countryCount.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    monthlyRevenue: [],
    dailyRevenue: [],
  };
}