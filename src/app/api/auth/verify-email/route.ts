import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(`verify:${ipFromRequest(req)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: { token?: string; email?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "errors.invalidToken" }, { status: 400 });
  }

  const email = String(body.email ?? "").toLowerCase().trim();
  const token = String(body.token ?? "");
  if (!email || !token) {
    return NextResponse.json({ error: "errors.invalidToken" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.verifyTokenHash) {
    return NextResponse.json({ error: "errors.invalidToken" }, { status: 400 });
  }
  if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
    return NextResponse.json({ error: "errors.tokenExpired" }, { status: 400 });
  }
  if (!bcrypt.compareSync(token, user.verifyTokenHash)) {
    return NextResponse.json({ error: "errors.invalidToken" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verifyTokenHash: null,
      verifyTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}