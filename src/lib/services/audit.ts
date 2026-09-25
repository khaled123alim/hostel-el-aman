import { prisma } from "@/lib/db";

export interface AuditInput {
  userId?: string | null;
  actorName?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  detail?: string | null;
  ip?: string | null;
}

export async function audit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        objectType: input.objectType,
        objectId: input.objectId ?? null,
        detail: input.detail ?? null,
        ip: input.ip ?? null,
      },
    });
  } catch {
    // audit failure must never break the primary action
  }
}

export async function auditAdmin(
  userId: string | undefined,
  action: string,
  objectType: string,
  objectId: string | null,
  detail?: string,
  ip?: string
) {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }).catch(() => null) : null;
  await audit({
    userId: user?.id ?? null,
    actorName: user ? `${user.firstName} ${user.lastName}` : null,
    action,
    objectType,
    objectId,
    detail,
    ip,
  });
}