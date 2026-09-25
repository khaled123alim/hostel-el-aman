import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

const STATUSES = ["CLEAN", "DIRTY", "CLEANING", "INSPECTED", "OUT_OF_ORDER"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "housekeeping.manage")) return forbidden();

  const limited = await rateLimit(`admin-housekeeping:${admin.userId}`, 60, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return notFound();

  let body: { status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (!body.status || !STATUSES.includes(body.status)) return badRequest();

  const updated = await prisma.room.update({
    where: { id },
    data: {
      housekeepingStatus: body.status as never,
      housekeepingNote: body.note || null,
    },
  });

  await auditAdmin(admin.userId, "HOUSEKEEPING_UPDATED", "room", id, `status → ${body.status}`, ipFromRequest(req));

  return NextResponse.json({ ok: true, room: { id: updated.id, housekeepingStatus: updated.housekeepingStatus } });
}