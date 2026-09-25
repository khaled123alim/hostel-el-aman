import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

const STATUSES = ["PENDING", "APPROVED", "HIDDEN", "REJECTED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "reviews.moderate")) return forbidden();

  const limited = await rateLimit(`admin-review:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return notFound();
  if (!body.status || !STATUSES.includes(body.status)) return badRequest();

  const updated = await prisma.review.update({
    where: { id },
    data: { status: body.status as never },
  });

  await auditAdmin(admin.userId, "REVIEW_MODERATED", "review", id, `status → ${body.status}`, ipFromRequest(req));

  return NextResponse.json({ ok: true, review: { id: updated.id, status: updated.status } });
}