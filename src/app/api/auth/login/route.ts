import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const limited = await rateLimit(`login:${ipFromRequest(req)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: first ?? "errors.invalidCredentials" }, { status: 400 });
  }
  const { email, password, remember } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { role: { select: { name: true } } },
  });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + 15 * 60_000) : null,
        },
      });
    }
    return NextResponse.json({ error: "auth.loginError" }, { status: 401 });
  }

  if (user.status === "DISABLED") {
    return NextResponse.json({ error: "auth.disabled" }, { status: 403 });
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({ error: "errors.locked" }, { status: 423 });
  }

  void remember;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null },
  });

  await setSession({
    sub: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role?.name ?? "CUSTOMER",
  });

  return NextResponse.json({ ok: true, role: user.role?.name ?? "CUSTOMER", name: user.firstName });
}