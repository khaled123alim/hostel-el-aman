import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const { user } = await requireAuth();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    const field = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: field ?? "errors.generic" }, { status: 400 });
  }
  const data = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      country: data.country || null,
      locale: data.locale,
      currency: data.currency,
    },
  });

  return NextResponse.json({ ok: true });
}