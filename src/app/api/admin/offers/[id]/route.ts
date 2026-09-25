import { NextResponse } from "next/server";
import type { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { promotionSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

function toData(data: z.infer<typeof promotionSchema>) {
  return {
    name: data.name,
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.type === "PERCENTAGE" ? data.value ?? 0 : 0,
    fixedDiscount: data.type === "FIXED" ? data.fixedDiscount ?? 0 : 0,
    minNights: data.minNights,
    minAmount: data.minAmount ?? null,
    maxUses: data.maxUses ?? null,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    applicableHostels: JSON.stringify(data.applicableHostels ?? []),
    applicableRooms: "[]",
    status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "offers.manage")) return forbidden();

  const limited = await rateLimit(`admin-offer:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  const parsed = promotionSchema.safeParse(body);
  if (!parsed.success) return badRequest();

  const dup = await prisma.promotion.findUnique({ where: { code: parsed.data.code.toUpperCase() } });
  if (dup && dup.id !== id) return NextResponse.json({ error: "errors.generic" }, { status: 409 });

  const promo = await prisma.promotion.update({ where: { id }, data: toData(parsed.data) });
  await auditAdmin(admin.userId, "PROMOTION_UPDATED", "promotion", id, promo.name, ipFromRequest(req));
  return NextResponse.json({ ok: true, id: promo.id });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "offers.manage")) return forbidden();

  const existing = await prisma.promotion.findUnique({ where: { id } });
  if (!existing) return notFound();

  await prisma.promotion.delete({ where: { id } });
  await auditAdmin(admin.userId, "PROMOTION_DELETED", "promotion", id, existing.name, ipFromRequest(req));
  return NextResponse.json({ ok: true });
}