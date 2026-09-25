import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { rangeDates, parseDay, isoDay } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  roomId: z.string().min(1),
  startDate: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)),
  endDate: z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v)),
  status: z.enum(["OPEN", "CLOSED", "BLOCKED"]),
  priceOverride: z.coerce.number().min(0).nullable().optional(),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
  if (!can(admin.roleName as never, "availability.manage")) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const limited = await rateLimit(`admin-avail:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  const { roomId, startDate, endDate, status: target, priceOverride, reason } = parsed.data;

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: "errors.notFound" }, { status: 404 });

  const start = parseDay(startDate);
  const end = parseDay(endDate);
  if (end <= start) return NextResponse.json({ error: "errors.checkoutAfterCheckin" }, { status: 422 });
  if (end.getTime() - start.getTime() > 400 * 86400000) {
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }

  const dates = rangeDates(start, end);

  if (target === "OPEN") {
    await prisma.roomAvailability.deleteMany({
      where: { roomId, date: { gte: start, lt: end } },
    });
  } else {
    for (const d of dates) {
      await prisma.roomAvailability.upsert({
        where: { roomId_date: { roomId, date: d } },
        update: { status: target, priceOverride: priceOverride ?? null, reason: reason || undefined },
        create: {
          roomId,
          date: d,
          status: target,
          priceOverride: priceOverride ?? null,
          reason: reason || undefined,
        },
      });
    }
  }

  await auditAdmin(admin.userId, "AVAILABILITY_UPDATED", "room", roomId, `${isoDay(start)} → ${isoDay(end)} (${target})`, ipFromRequest(req));

  return NextResponse.json({ ok: true, updated: dates.length });
}