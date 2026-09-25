import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { NotificationList } from "@/components/account/notification-list";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const { t } = await serverI18n();
  const { user } = await requireAdmin();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.notifications")}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {unread > 0 ? `${unread} ${t("notif.unread")}` : t("notif.allRead")}
          </p>
        </div>
        <Link href="/admin" className="btn-subtle">
          {t("admin.dashboard")}
        </Link>
      </div>
      <NotificationList
        items={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content ?? undefined,
          type: n.type,
          link: n.link ?? undefined,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}