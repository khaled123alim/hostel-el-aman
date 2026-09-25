import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "customers.edit")) return forbidden();

  const limited = await rateLimit(`admin-customer:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (!body.status || !["ACTIVE", "DISABLED"].includes(body.status)) return badRequest();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return notFound();

  await prisma.user.update({ where: { id }, data: { status: body.status as never } });
  await auditAdmin(admin.userId, "CUSTOMER_STATUS_UPDATED", "user", id, `status → ${body.status}`, ipFromRequest(req));

  return NextResponse.json({ ok: true });
}