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
  if (!can(admin.roleName as never, "settings.manage")) return forbidden();

  const limited = await rateLimit(`admin-email:${admin.userId}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: { subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (typeof body.subject !== "string" || typeof body.body !== "string" || !body.subject.trim()) return badRequest();

  const tpl = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!tpl) return notFound();

  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: { subject: body.subject.trim(), body: body.body },
  });

  await auditAdmin(admin.userId, "EMAIL_TEMPLATE_UPDATED", "email_template", id, updated.key, ipFromRequest(req));

  return NextResponse.json({ ok: true });
}