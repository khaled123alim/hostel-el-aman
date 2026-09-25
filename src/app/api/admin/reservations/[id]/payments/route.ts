import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { onPaymentReceived } from "@/lib/services/notifications";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(["PAY_AT_HOSTEL", "BANK_TRANSFER", "CARD", "STRIPE", "PAYPAL"]).default("PAY_AT_HOSTEL"),
  status: z.enum(["PENDING", "PAID"]).default("PAID"),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
  if (!can(admin.roleName as never, "payments.manage")) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const limited = await rateLimit(`admin-pay:${admin.userId}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "errors.generic" }, { status: 400 });

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return NextResponse.json({ error: "errors.notFound" }, { status: 404 });
  if (reservation.status === "CANCELLED") return NextResponse.json({ error: "errors.generic" }, { status: 422 });

  // This platform takes no card payments — record local hostel payments only.
  const method = parsed.data.method === "CARD" || parsed.data.method === "STRIPE" || parsed.data.method === "PAYPAL"
    ? "PAY_AT_HOSTEL"
    : parsed.data.method;

  const payment = await prisma.payment.create({
    data: {
      reservationId: id,
      customerId: reservation.customerId,
      amount: parsed.data.amount,
      currency: reservation.currency,
      method,
      provider: "local",
      status: parsed.data.status,
      paidAt: parsed.data.status === "PAID" ? new Date() : null,
    },
  });

  if (parsed.data.status === "PAID") {
    await prisma.reservation.update({ where: { id }, data: { paymentStatus: "PAID" } });
    await prisma.reservationHistory.create({
      data: {
        reservationId: id,
        action: "PAYMENT_RECORDED",
        detail: `${parsed.data.amount} ${reservation.currency} received (${method})`,
      },
    });
    await onPaymentReceived(id);
  }

  await auditAdmin(admin.userId, "PAYMENT_RECORDED", "reservation", id, `${parsed.data.amount} ${reservation.currency}`, ipFromRequest(req));

  return NextResponse.json({ ok: true, payment: { id: payment.id, amount: payment.amount, status: payment.status } }, { status: 201 });
}