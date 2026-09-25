"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  DoorOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { can, type RoleName } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  roleName: RoleName;
  userName: string;
  unread: number;
  children: React.ReactNode;
}

export function AdminShell({ roleName, userName, children }: AdminShellProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const allowed = (perm: string) => can(roleName, perm);

  interface Item {
    href: string;
    label: string;
    icon: LucideIcon;
    perm: string;
  }

  const groups: { title?: string; items: Item[] }[] = [];

  if (allowed("dashboard.view")) {
    groups.push({
      items: [{ href: "/admin", label: t("admin.dashboard"), icon: LayoutDashboard, perm: "dashboard.view" }],
    });
  }

  const manage: Item[] = [];
  if (allowed("reservations.view"))
    manage.push({ href: "/admin/reservations", label: t("admin.reservations"), icon: CalendarRange, perm: "reservations.view" });
  if (allowed("rooms.view"))
    manage.push({ href: "/admin/rooms", label: t("admin.rooms"), icon: DoorOpen, perm: "rooms.view" });
  if (manage.length) groups.push({ title: t("admin.menu"), items: manage });

  const admin: Item[] = [];
  if (allowed("settings.manage"))
    admin.push({ href: "/admin/settings", label: t("admin.settings"), icon: Settings, perm: "settings.manage" });
  if (admin.length) groups.push({ title: "Admin", items: admin });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

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

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((g, i) => (
        <div key={i}>
          {g.title && (
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">{g.title}</p>
          )}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-white/12 text-white"
                        : "text-white/65 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="border-t border-white/10 pt-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
        >
          <Home className="h-4 w-4 shrink-0" />
          {t("admin.viewSite")}
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t("admin.menu")}
            onClick={() => setOpen(true)}
            className="rounded-lg p-1.5 text-ink transition hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-sm font-bold uppercase tracking-wider text-brand">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          {allowed("reservations.create") && (
            <Link href="/admin/reservations/new" className="rounded-lg bg-brand p-1.5 text-white">
              <Plus className="h-5 w-5" />
            </Link>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-brand-dark text-white shadow-2xl rtl:left-auto rtl:right-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="font-display text-base font-bold">Admin</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="border-t border-white/10 p-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  <p className="truncate text-xs text-white/50">{roleName.toLowerCase().replace(/_/g, " ")}</p>
                </div>
                <button type="button" onClick={logout} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-dark text-white lg:flex">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <span className="font-display text-base font-bold uppercase tracking-wider">Admin</span>
            <Link href="/admin" className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
              <LayoutDashboard className="h-4 w-4" />
            </Link>
          </div>
          <NavLinks />
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="truncate text-xs text-white/50">{roleName.toLowerCase().replace(/_/g, " ")}</p>
              </div>
              <button type="button" onClick={logout} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10" title={t("admin.logout")}>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 lg:sticky">
          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}