import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const noteSchema = z.object({
  content: z.string().min(1).max(2000),
  isInternal: z.coerce.boolean().default(true),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });
  if (!can(admin.roleName as never, "reservations.edit")) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const limited = await rateLimit(`admin-note:${admin.userId}`, 20, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "errors.generic" }, { status: 400 });

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return NextResponse.json({ error: "errors.notFound" }, { status: 404 });

  const note = await prisma.reservationNote.create({
    data: {
      reservationId: id,
      authorId: admin.userId,
      content: parsed.data.content,
      isInternal: parsed.data.isInternal,
    },
  });

  await auditAdmin(admin.userId, "NOTE_ADDED", "reservation", id, parsed.data.content.slice(0, 200), ipFromRequest(req));

  return NextResponse.json({ ok: true, note });
}