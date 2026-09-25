"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Languages, ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/providers/i18n-provider";

export function LocaleSwitcher({ locales, names }: { locales: string[]; names: Record<string, string> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();

  const setLocale = (code: string) => {
    if (code === locale) return;
    fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: code }),
    }).then(() => {
      startTransition(() => {
        router.refresh();
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-slate-100 hover:text-ink">
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{names[locale] ?? locale}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((code) => (
          <DropdownMenuItem key={code} onClick={() => setLocale(code)} disabled={pending}>
            <span className="flex w-full items-center justify-between">
              {names[code] ?? code}
              {code === locale && <Check className="h-4 w-4 text-brand" />}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CurrencySwitcher({
  currencies,
  names,
  current,
}: {
  currencies: string[];
  names: Record<string, string>;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();

  const symbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", DZD: "DA" };

  const setCurrency = (code: string) => {
    if (code === current) return;
    fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: code }),
    }).then(() => {
      startTransition(() => router.refresh());
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-slate-100 hover:text-ink">
        <span className="font-bold text-brand">{symbols[current] ?? current}</span>
        <span className="hidden sm:inline">{t("common.currency")}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((code) => (
          <DropdownMenuItem key={code} onClick={() => setCurrency(code)} disabled={pending}>
            <span className="flex w-full items-center justify-between gap-3">
              <span>
                {symbols[code] ?? code} — {names[code] ?? code}
              </span>
              {code === current && <Check className="h-4 w-4 text-brand" />}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}