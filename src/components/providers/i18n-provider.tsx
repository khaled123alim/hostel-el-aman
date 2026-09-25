"use client";

import { createContext, useContext, useMemo } from "react";
import { translate, type Locale } from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
  localeNames: Record<string, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  localeNames,
  children,
}: {
  locale: Locale;
  localeNames: Record<string, string>;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      t: (key, vars) => translate(locale, key, vars),
      localeNames,
    }),
    [locale, localeNames]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en",
      dir: "ltr",
      t: (key) => key,
      localeNames: {},
    };
  }
  return ctx;
}