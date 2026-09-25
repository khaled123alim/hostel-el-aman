import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { sendTemplateEmail } from "@/lib/services/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(`forgot:${ipFromRequest(req)}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Keep responses identical to avoid account enumeration.
    return NextResponse.json({ ok: true });
  }
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: hashToken(token),
      resetTokenExpiry: new Date(Date.now() + 60 * 60_000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendTemplateEmail(
    "reset_password",
    email,
    {
      firstName: user.firstName,
      resetUrl: `${appUrl}/reset-password?token=${token}`,
    },
    user.locale || "en"
  );

  return NextResponse.json({ ok: true });
}