import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user } = await requireAuth();
  const { id } = await ctx.params;

  const target = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  });
  if (!target) {
    return NextResponse.json({ error: "errors.notFound" }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id: target.id },
    data: { readAt: target.readAt ?? new Date() },
  });

  return NextResponse.json({ ok: true });
}