import { getSettings } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { getSession } from "@/lib/auth";
import { LANGUAGES, CURRENCIES } from "@/lib/constants";
import { SiteHeader } from "@/components/shared/header";
import { SiteFooter } from "@/components/shared/footer";
import { PageFade } from "@/components/shared/page-fade";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, prefs, session] = await Promise.all([getSettings(), getPreferences(), getSession()]);

  const enabledLocales = (settings.general?.supportedLocales ?? ["en", "fr", "ar"]) as string[];
  const enabledCurrencies = (settings.general?.supportedCurrencies ?? ["DZD"]) as string[];

  const localeNames: Record<string, string> = {};
  for (const l of LANGUAGES) localeNames[l.code] = l.label;
  const currencyNames: Record<string, string> = {};
  for (const c of CURRENCIES) currencyNames[c.code] = c.label;

  const user = session
    ? await (await import("@/lib/auth")).getCurrentUser()
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        siteName={settings.site?.name ?? "StayHub"}
        locales={enabledLocales}
        localeNames={localeNames}
        currencies={enabledCurrencies}
        currencyNames={currencyNames}
        currentCurrency={prefs.currency}
        user={
          user
            ? { firstName: user.firstName, lastName: user.lastName, role: user.role.name }
            : null
        }
      />
      <main className="flex-1">
        <PageFade>{children}</PageFade>
      </main>
      <SiteFooter
        siteName={settings.site?.name ?? "StayHub"}
        contact={{ email: settings.site?.contactEmail, phone: settings.site?.phone, address: settings.site?.address }}
        socials={{ facebook: settings.site?.facebook, instagram: settings.site?.instagram, twitter: settings.site?.twitter }}
      />
    </div>
  );
}