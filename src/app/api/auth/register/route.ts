import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateToken, hashToken } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { registerSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { sendTemplateEmail } from "@/lib/services/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(`register:${ipFromRequest(req)}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const field = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: field ?? "errors.generic" }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "auth.accountExists" }, { status: 409 });
  }

  const customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
  if (!customerRole) {
    return NextResponse.json({ error: "errors.generic" }, { status: 500 });
  }

  const prefs = await getPreferences();
  const verifyToken = generateToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(data.password),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      country: data.country || null,
      locale: prefs.locale,
      currency: prefs.currency,
      emailVerified: false,
      roleId: customerRole.id,
      verifyTokenHash: hashToken(verifyToken),
      verifyTokenExpiry: new Date(Date.now() + 24 * 3600_000),
    },
  });

  void user;

  await Promise.allSettled([
    sendTemplateEmail("welcome", email, { firstName: data.firstName }, prefs.locale),
    sendTemplateEmail(
      "verify_email",
      email,
      {
        firstName: data.firstName,
        verifyUrl: `${appUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`,
      },
      prefs.locale
    ),
  ]);

  return NextResponse.json({ ok: true, verifyRequired: true }, { status: 201 });
}