import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { roomSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "rooms.manage")) return forbidden();

  const limited = await rateLimit(`admin-room:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  const existing = await prisma.room.findUnique({ where: { id }, include: { hostel: { select: { name: true } } } });
  if (!existing) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) return badRequest();
  const data = parsed.data;

  const room = await prisma.room.update({
    where: { id },
    data: {
      name: data.name,
      number: data.number,
      type: data.type,
      description: data.description || null,
      capacity: data.capacity,
      beds: data.beds,
      bedType: data.bedType,
      bathroomType: data.bathroomType,
      pricePerNight: data.pricePerNight,
      cleaningFee: data.cleaningFee,
      taxRate: data.taxRate,
      minStay: data.minStay,
      maxStay: data.maxStay,
      images: (data.images ?? []) as never,
      status: data.status as never,
    },
  });

  await prisma.roomAmenity.deleteMany({ where: { roomId: id } });
  if (data.amenities?.length) {
    await prisma.roomAmenity.createMany({
      data: data.amenities.map((name) => ({ roomId: id, name })),
    });
  }

  await auditAdmin(admin.userId, "ROOM_UPDATED", "room", id, `${existing.hostel?.name ?? ""} · ${room.name}`, ipFromRequest(req));

  return NextResponse.json({ ok: true, room: { id: room.id } });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "rooms.manage")) return forbidden();

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) return notFound();

  const reservations = await prisma.reservation.count({ where: { roomId: id } });
  if (reservations > 0) {
    await prisma.room.update({ where: { id }, data: { status: "INACTIVE" } });
    await auditAdmin(admin.userId, "ROOM_DEACTIVATED", "room", id, "Deactivated (has reservations)", ipFromRequest(req));
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.room.delete({ where: { id } });
  await auditAdmin(admin.userId, "ROOM_DELETED", "room", id, room.name, ipFromRequest(req));
  return NextResponse.json({ ok: true, deleted: true });
}