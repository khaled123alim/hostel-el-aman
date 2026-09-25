import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export async function serverI18n() {
  const prefs = await getPreferences();
  const t = (key: string, vars?: Record<string, string | number>) =>
    translateKey(prefs.locale, key, vars);
  return { t, locale: prefs.locale as Locale, prefs };
}