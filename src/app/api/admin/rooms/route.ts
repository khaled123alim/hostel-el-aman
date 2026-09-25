import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { roomSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { badRequest, forbidden, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "rooms.manage")) return forbidden();

  const limited = await rateLimit(`admin-room:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) return badRequest();
  const data = parsed.data;

  const hostel = await prisma.hostel.findUnique({ where: { id: data.hostelId } });
  if (!hostel) return badRequest();

  const room = await prisma.room.create({
    data: {
      hostelId: data.hostelId,
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

  if (data.amenities?.length) {
    await prisma.roomAmenity.createMany({
      data: data.amenities.map((name) => ({ roomId: room.id, name })),
    });
  }

  await auditAdmin(admin.userId, "ROOM_CREATED", "room", room.id, `${hostel.name} · ${room.name}`, ipFromRequest(req));

  return NextResponse.json({ ok: true, room: { id: room.id } }, { status: 201 });
}