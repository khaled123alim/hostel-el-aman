import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import { sendTemplateEmail } from "@/lib/services/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(`resend:${ipFromRequest(req)}`, 5, 120_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let email = "";
  try {
    const body = (await req.json()) as { email?: string };
    email = String(body.email ?? "").toLowerCase().trim();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "errors.email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verifyTokenHash: hashToken(token),
      verifyTokenExpiry: new Date(Date.now() + 24 * 3600_000),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await sendTemplateEmail(
    "verify_email",
    email,
    {
      firstName: user.firstName,
      verifyUrl: `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`,
    },
    user.locale || "en"
  );

  return NextResponse.json({ ok: true });
}