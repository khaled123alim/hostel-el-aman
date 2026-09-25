import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return NextResponse.json({ error: "errors.unauthorized" }, { status: 401 });

  const limited = await rateLimit(`admin-res-del:${admin.userId}`, 15, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  if (!can(admin.roleName as never, "reservations.delete")) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { number: true },
  });
  if (!reservation) return NextResponse.json({ error: "errors.notFound" }, { status: 404 });

  try {
    await prisma.reservation.delete({ where: { id } });

    await auditAdmin(
      admin.userId,
      "RESERVATION_DELETED",
      "reservation",
      id,
      `Deleted reservation ${reservation.number}`,
      ipFromRequest(req)
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 422 });
  }
}