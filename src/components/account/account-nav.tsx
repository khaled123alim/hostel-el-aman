"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarRange, Bell, UserRound, KeyRound, LogOut } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AccountNav({ unread }: { unread: number }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const items = [
    { href: "/account", label: t("account.overview"), icon: LayoutDashboard },
    { href: "/account/reservations", label: t("account.myReservations"), icon: CalendarRange },
    { href: "/account/notifications", label: t("account.notifications"), icon: Bell, badge: unread },
    { href: "/account/settings", label: t("account.myProfile"), icon: UserRound },
    { href: "/account/settings?tab=password", label: t("account.changePassword"), icon: KeyRound },
  ];

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    toast({ title: t("auth.loggedOut") });
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.href.split("?")[0]);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              active
                ? "bg-brand text-ink shadow-sm"
                : "text-ink-soft hover:bg-brand-subtle hover:text-ink"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate rtl:text-right">{item.label}</span>
            {(item.badge ?? 0) > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  active ? "bg-white text-brand" : "bg-accent text-white"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {t("account.logout")}
      </button>
    </nav>
  );
}