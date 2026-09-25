import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import {
  NotificationList,
  type NotificationItem,
} from "@/components/account/notification-list";

export const dynamic = "force-dynamic";

export default async function AccountNotificationsPage() {
  const { user } = await requireAuth();
  const prefs = await getPreferences();
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(prefs.locale, k, vars);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const items: NotificationItem[] = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content ?? undefined,
    type: n.type,
    link: n.link ?? undefined,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-5">
      <h1 className="heading-xl">{t("account.notifications")}</h1>
      <NotificationList items={items} />
    </div>
  );
}