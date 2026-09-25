import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { auditAdmin } from "@/lib/services/audit";
import { hostelSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";
import { badRequest, forbidden, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "hostels.manage")) return forbidden();

  const limited = await rateLimit(`admin-hostel:${admin.userId}`, 30, 60_000);
  if (!limited.ok)
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

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
  const existing = await prisma.hostel.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const images = data.images ?? (data.imageCover ? [data.imageCover] : []);
  const hostel = await prisma.hostel.create({
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
      imageCover: data.imageCover || images[0] || "",
      images: images as never,
      houseRules: (data.houseRules ?? []) as never,
      seoTitle: data.seoTitle || null,
      metaDescription: data.metaDescription || null,
      status: data.status,
      featured: data.featured ?? false,
    },
  });

  if (data.amenities?.length) {
    await prisma.hostelAmenity.createMany({
      data: data.amenities.map((name) => ({ hostelId: hostel.id, name })),
    });
  }

  await auditAdmin(admin.userId, "HOSTEL_CREATED", "hostel", hostel.id, hostel.name, ipFromRequest(req));

  return NextResponse.json({ ok: true, hostel: { id: hostel.id, slug: hostel.slug } }, { status: 201 });
}