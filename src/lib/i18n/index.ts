import { en, type Dictionary } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { ar } from "./dictionaries/ar";
import { getSettings } from "@/lib/settings";

export type Locale = "en" | "fr" | "ar";

const dictionaries: Record<string, Dictionary> = { en, fr, ar };

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "fr" || value === "ar";
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (value && isLocale(value)) return value;
  return "en";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = getDictionary(locale) as Record<string, string>;
  let text = dict[key] ?? (en as Record<string, string>)[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function translateKey(locale: string, key: string, vars?: Record<string, string | number>): string {
  return translate(normalizeLocale(locale), key, vars);
}

export function makeT(locale: Locale): Translator {
  return (key, vars) => translate(locale, key, vars);
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

export async function getConfigurableLocales(): Promise<string[]> {
  const settings = await getSettings();
  const enabled = settings?.general?.supportedLocales;
  if (Array.isArray(enabled) && enabled.length) return enabled;
  return ["en", "fr", "ar"];
}

export async function getDefaultLocale(): Promise<Locale> {
  const settings = await getSettings();
  const def = settings?.general?.defaultLocale;
  return def && isLocale(def) ? def : "en";
}

export const LANGUAGES: Array<{ code: Locale; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "GB" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "ar", label: "العربية", flag: "DZ" },
];

export { dictionaries }; 
export type { Dictionary };