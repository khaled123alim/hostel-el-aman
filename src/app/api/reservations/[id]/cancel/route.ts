import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { cancelReservation } from "@/lib/services/reservation";
import { notifyOwner } from "@/lib/services/owner-alerts";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireAuth();
  const { id } = await ctx.params;

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) {
    return NextResponse.json({ error: "errors.notFound" }, { status: 404 });
  }
  if (reservation.customerId !== user.id) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }
  if (!["PENDING", "CONFIRMED"].includes(reservation.status)) {
    return NextResponse.json({ error: "errors.cannotCancel" }, { status: 422 });
  }

  await cancelReservation(reservation.id, {
    reason: "Cancelled by customer",
    cancelledBy: user.id,
    refund: false,
  });

  await notifyOwner({
    template: "reservation_cancelled_owner",
    reservationId: reservation.id,
    extras: {
      firstName: user.firstName,
      lastName: user.lastName,
      reason: "Cancelled by customer",
    },
  });

  return NextResponse.json({ ok: true });
}