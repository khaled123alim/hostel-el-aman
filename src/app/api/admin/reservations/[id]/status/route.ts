import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import {
  confirmReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
} from "@/lib/services/reservation";
import { notifyOwner } from "@/lib/services/owner-alerts";
import { onReservationCancelled } from "@/lib/services/notifications";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["confirm", "checkin", "checkout", "cancel", "noshow"]),
  reason: z.string().max(1000).optional().or(z.literal("")),
  refund: z.coerce.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });

  const limited = await rateLimit(`admin-res:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  const { action, reason, refund } = parsed.data;

  const perms: Record<string, string> = {
    confirm: "reservations.edit",
    checkin: "reservations.checkin",
    checkout: "reservations.checkout",
    cancel: "reservations.cancel",
    noshow: "reservations.edit",
  };
  if (!can(admin.roleName as never, perms[action])) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return NextResponse.json({ error: "errors.notFound" }, { status: 404 });

  try {
    let updated;
    switch (action) {
      case "confirm":
        if (reservation.status !== "PENDING") return NextResponse.json({ error: "errors.generic" }, { status: 422 });
        updated = await confirmReservation(id, admin.userId);
        break;
      case "checkin":
        if (!["PENDING", "CONFIRMED"].includes(reservation.status)) return NextResponse.json({ error: "errors.generic" }, { status: 422 });
        updated = await checkInReservation(id, admin.userId);
        break;
      case "checkout":
        if (reservation.status !== "CHECKED_IN") return NextResponse.json({ error: "errors.generic" }, { status: 422 });
        updated = await checkOutReservation(id, admin.userId);
        break;
      case "cancel":
        updated = await cancelReservation(id, { reason: reason || undefined, cancelledBy: admin.userId, refund: refund ?? true });
        await onReservationCancelled(id);
        await notifyOwner({
          template: "reservation_cancelled_owner",
          reservationId: id,
          extras: { firstName: "Guest", lastName: "", reason: reason || "Cancelled by hostel" },
        });
        break;
      case "noshow": {
        if (!["PENDING", "CONFIRMED"].includes(reservation.status)) return NextResponse.json({ error: "errors.generic" }, { status: 422 });
        updated = await prisma.reservation.update({
          where: { id },
          data: { status: "NO_SHOW" },
        });
        await prisma.reservationHistory.create({
          data: { reservationId: id, action: "NO_SHOW", detail: "Marked no-show by staff" },
        });
        break;
      }
    }

    await auditAdmin(
      admin.userId,
      `RESERVATION_${action.toUpperCase().replace(/_/g, "_")}`,
      "reservation",
      id,
      reason || `Action: ${action}`,
      ipFromRequest(req)
    );

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("not found")) return NextResponse.json({ error: "errors.notFound" }, { status: 404 });
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }
}