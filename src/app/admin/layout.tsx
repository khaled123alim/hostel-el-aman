import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <AdminShell
      roleName={user.role.name}
      userName={`${user.firstName} ${user.lastName}`}
      unread={unread}
    >
      {children}
    </AdminShell>
  );
}