import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AccountNav } from "@/components/account/account-nav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth();

  const [prefs, settings] = await Promise.all([getPreferences(), getSettings()]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);

  const base = settings.general?.defaultCurrency ?? "EUR";
  const totalSpent = await prisma.reservation.aggregate({
    where: { customerId: user.id, status: { notIn: ["CANCELLED"] } },
    _sum: { total: true },
    _count: true,
  });

  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <div className="container-x pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 pt-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-white shadow-soft">
            <AvatarFallback className="bg-brand-subtle text-brand">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">{t("account.welcome")}</p>
            <h1 className="heading-2xl">
              {t("account.hello")}, {user.firstName}
            </h1>
            <p className="text-sm text-ink-soft">
              {t("account.memberSince")} {new Date(user.createdAt).getFullYear()} ·{" "}
              {formatMoney(totalSpent._sum.total ?? 0, user.currency || base, locale)} {t("account.totalSpent")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-surface p-3">
            <AccountNav unread={unread} />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}