"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, CalendarDays, LayoutDashboard, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { useI18n } from "@/components/providers/i18n-provider";
import { LocaleSwitcher, CurrencySwitcher } from "@/components/shared/lang-currency";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";

const NAV_KEYS: { key: string; href: string; exact?: boolean }[] = [
  { key: "nav.home", href: "/", exact: true },
  { key: "nav.rooms", href: "/rooms" },
  { key: "nav.about", href: "/about" },
  { key: "nav.contact", href: "/contact" },
];

export function SiteHeader({
  siteName,
  locales,
  localeNames,
  currencies,
  currencyNames,
  currentCurrency,
  user,
}: {
  siteName: string;
  locales: string[];
  localeNames: Record<string, string>;
  currencies: string[];
  currencyNames: Record<string, string>;
  currentCurrency: string;
  user: { firstName: string; lastName: string; role: string } | null;
}) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const loggedIn = Boolean(user);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled ? "border-slate-200/80 bg-white/85 shadow-soft backdrop-blur-xl" : isHome ? "border-transparent bg-white/60 backdrop-blur" : "border-slate-200/80 bg-white/85"
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo name={siteName} />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_KEYS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-brand" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {t(item.key)}
                  {active && <span className="absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-accent" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <Link href="/rooms">
              <CalendarDays className="h-4 w-4" />
              {t("nav.bookNow")}
            </Link>
          </Button>
          <LocaleSwitcher locales={locales} names={localeNames} />
          <CurrencySwitcher currencies={currencies} names={currencyNames} current={currentCurrency} />

          {loggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="ml-1 inline-flex items-center gap-2 rounded-xl p-1 transition hover:bg-slate-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(user!.firstName, user!.lastName)}</AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden h-4 w-4 text-ink-soft sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  {user!.firstName} {user!.lastName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={user!.role === "CUSTOMER" ? "/account" : "/admin"}>
                    <LayoutDashboard className="h-4 w-4" />
                    {user!.role === "CUSTOMER" ? t("nav.dashboard") : t("admin.dashboard")}
                  </Link>
                </DropdownMenuItem>
                {user!.role === "CUSTOMER" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/account/reservations">
                      <CalendarDays className="h-4 w-4" />
                      {t("nav.myReservations")}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/reservations">
                      <CalendarDays className="h-4 w-4" />
                      {t("admin.reservations")}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="ml-1 hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink transition hover:bg-slate-100 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="border-t border-slate-200/80 bg-white lg:hidden" style={{ animation: "fade-in 0.2s ease-out both" }}>
          <nav className="container-x flex flex-col gap-1 py-4">
            {NAV_KEYS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-brand-subtle text-brand" : "text-ink hover:bg-slate-50"
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-4">
              {loggedIn ? (
                <Button asChild className="flex-1">
                  <Link href={user!.role === "CUSTOMER" ? "/account" : "/admin"}>
                    <User className="h-4 w-4" />
                    {t("nav.dashboard")}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/register">{t("nav.register")}</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}