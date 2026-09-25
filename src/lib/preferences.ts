import { cookies } from "next/headers";
import { normalizeLocale, type Locale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

const PREFS_COOKIE = "sh_prefs";
const PREFS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface Preferences {
  locale: Locale;
  currency: string;
}

export function parsePreferences(raw: string | undefined): Partial<Preferences> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return {
      locale: normalizeLocale(parsed.locale),
      currency: typeof parsed.currency === "string" ? parsed.currency : undefined,
    };
  } catch {
    return {};
  }
}

export async function getPreferences(): Promise<Preferences> {
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  const parsed = parsePreferences(raw);
  const settings = await getSettings();
  const defaultLocale: Locale = normalizeLocale(settings.general?.defaultLocale);
  const supportedCurrencies = (settings.general?.supportedCurrencies ?? ["DZD"]) as string[];
  const defaultCurrency: string = settings.general?.defaultCurrency ?? "DZD";
  const requested = parsed.currency;
  return {
    locale: parsed.locale ?? defaultLocale,
    currency: requested && supportedCurrencies.includes(requested) ? requested : defaultCurrency,
  };
}

export async function getUserLocale(): Promise<Locale> {
  const prefs = await getPreferences();
  return prefs.locale;
}

export async function getUserCurrency(): Promise<string> {
  const prefs = await getPreferences();
  return prefs.currency;
}

export async function savePreferences(prefs: Partial<Preferences>) {
  const store = await cookies();
  const current = await getPreferences();
  const next: Preferences = {
    locale: prefs.locale ?? current.locale,
    currency: prefs.currency ?? current.currency,
  };
  store.set(PREFS_COOKIE, JSON.stringify(next), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: PREFS_COOKIE_MAX_AGE,
  });
}

export const PREFS_COOKIE_NAME = PREFS_COOKIE;