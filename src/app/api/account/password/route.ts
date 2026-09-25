import { NextResponse } from "next/server";
import { requireAuth, hashPassword, verifyPassword, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { user } = await requireAuth();

  const limited = await rateLimit(`pwd:${user.id}`, 5, 5 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const field = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
    return NextResponse.json({ error: field ?? "errors.generic" }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const fresh = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fresh || !verifyPassword(currentPassword, fresh.passwordHash)) {
    return NextResponse.json({ error: "errors.invalidCredentials" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword), resetTokenHash: null, failedLoginAttempts: 0 },
  });

  // Invalidate existing sessions by clearing the cookie; user logs back in.
  await destroySession();
  return NextResponse.json({ ok: true });
}