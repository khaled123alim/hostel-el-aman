import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      country: true,
      locale: true,
      currency: true,
      emailVerified: true,
      status: true,
      role: { select: { name: true } },
    },
  });
  if (!user || user.status === "DISABLED") {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}