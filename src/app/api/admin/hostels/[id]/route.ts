import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { hostelSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "hostels.manage")) return forbidden();

  const limited = await rateLimit(`admin-hostel:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  const existing = await prisma.hostel.findUnique({ where: { id } });
  if (!existing) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  const parsed = hostelSchema.safeParse(body);
  if (!parsed.success) return badRequest();
  const data = parsed.data;

  let slug = data.slug?.trim() || slugify(data.name);
  if (slug !== existing.slug) {
    const clash = await prisma.hostel.findUnique({ where: { slug } });
    if (clash && clash.id !== id) slug = `${slug}-${Date.now().toString(36)}`;
  }

  const images = data.images ?? (data.imageCover ? [data.imageCover] : (existing.images as string[] ?? []));
  const imagesArr = Array.isArray(existing.images) ? (existing.images as string[]) : [];
  const finalImages = data.images ? data.images : imagesArr;

  const hostel = await prisma.hostel.update({
    where: { id },
    data: {
      slug,
      name: data.name,
      description: data.description,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      imageCover: data.imageCover || images[0] || existing.imageCover,
      images: finalImages as never,
      houseRules: (data.houseRules ?? []) as never,
      seoTitle: data.seoTitle || null,
      metaDescription: data.metaDescription || null,
      status: data.status,
      featured: data.featured ?? existing.featured,
    },
  });

  await prisma.hostelAmenity.deleteMany({ where: { hostelId: id } });
  if (data.amenities?.length) {
    await prisma.hostelAmenity.createMany({
      data: data.amenities.map((name) => ({ hostelId: id, name })),
    });
  }

  await auditAdmin(admin.userId, "HOSTEL_UPDATED", "hostel", id, hostel.name, ipFromRequest(req));

  return NextResponse.json({ ok: true, hostel: { id: hostel.id, slug: hostel.slug } });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "hostels.manage")) return forbidden();

  const hostel = await prisma.hostel.findUnique({ where: { id } });
  if (!hostel) return notFound();

  const reservations = await prisma.reservation.count({ where: { hostelId: id } });
  if (reservations > 0) {
    await prisma.hostel.update({ where: { id }, data: { status: "INACTIVE" } });
    await auditAdmin(admin.userId, "HOSTEL_DEACTIVATED", "hostel", id, "Deactivated (has reservations)", ipFromRequest(req));
    return NextResponse.json({ ok: true, deactivated: true });
  }

  await prisma.hostel.delete({ where: { id } });
  await auditAdmin(admin.userId, "HOSTEL_DELETED", "hostel", id, hostel.name, ipFromRequest(req));
  return NextResponse.json({ ok: true, deleted: true });
}