import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user } = await requireAuth();

  const limited = await rateLimit(`review:${user.id}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    const field = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: field ?? "errors.generic" }, { status: 400 });
  }
  const data = parsed.data;

  const reservation = await prisma.reservation.findFirst({
    where: { id: data.reservationId, customerId: user.id },
  });
  if (!reservation) {
    return NextResponse.json({ error: "errors.forbidden" }, { status: 403 });
  }
  const existing = await prisma.review.findUnique({ where: { reservationId: data.reservationId } });
  if (existing) {
    return NextResponse.json({ error: "errors.reviewExists" }, { status: 409 });
  }

  await prisma.review.create({
    data: {
      reservationId: reservation.id,
      hostelId: reservation.hostelId,
      userId: user.id,
      rating: data.rating,
      comment: data.comment || null,
      cleanliness: data.cleanliness,
      location: data.location,
      staff: data.staff,
      comfort: data.comfort,
      facilities: data.facilities,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}