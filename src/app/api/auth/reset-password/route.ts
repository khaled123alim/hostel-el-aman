import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(`reset:${ipFromRequest(req)}`, 5, 5 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const field = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: field ?? "errors.generic" }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const users = await prisma.user.findMany({ where: { resetTokenHash: { not: null } } });

  let match: { id: string; firstName: string; email: string; locale: string | null } | null = null;
  for (const u of users) {
    if (u.resetTokenHash && bcrypt.compareSync(token, u.resetTokenHash)) {
      match = { id: u.id, firstName: u.firstName, email: u.email, locale: u.locale };
      break;
    }
  }
  if (!match) {
    return NextResponse.json({ error: "errors.invalidToken" }, { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id: match.id } });
  if (!target || !target.resetTokenExpiry || target.resetTokenExpiry < new Date()) {
    return NextResponse.json({ error: "errors.tokenExpired" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: match.id },
    data: {
      passwordHash: hashPassword(password),
      resetTokenHash: null,
      resetTokenExpiry: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  return NextResponse.json({ ok: true });
}