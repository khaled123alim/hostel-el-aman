import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSession, generateToken, hashToken } from "@/lib/auth";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(`oauth:${ipFromRequest(req)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: {
    provider?: string;
    providerId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const email = String(body.email ?? "").toLowerCase().trim();
  const providerId = String(body.providerId ?? "");
  if (!email || !providerId) {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { authProviderId: providerId }] },
  });

  const customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
  if (!customerRole) {
    return NextResponse.json({ error: "errors.generic" }, { status: 500 });
  }

  let userId: string;
  if (!existing) {
    const password = generateToken();
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        firstName: (body.firstName || "").trim() || "Guest",
        lastName: (body.lastName || "").trim() || "",
        provider: "google",
        authProviderId: providerId,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        locale: "en",
        currency: "EUR",
        roleId: customerRole.id,
      },
    });
    userId = created.id;
  } else {
    if (!existing.authProviderId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          provider: "google",
          authProviderId: providerId,
          emailVerified: true,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        },
      });
    }
    userId = existing.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { select: { name: true } } },
  });
  if (!user || user.status === "DISABLED") {
    return NextResponse.json({ error: "auth.disabled" }, { status: 403 });
  }

  await setSession({
    sub: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role?.name ?? "CUSTOMER",
  });

  return NextResponse.json({ ok: true, role: user.role?.name ?? "CUSTOMER" });
}