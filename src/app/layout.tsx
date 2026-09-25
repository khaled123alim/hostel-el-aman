import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { getSettings, brandCssVars } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { normalizeLocale, isRtl, LANGUAGES } from "@/lib/i18n";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seo = settings.seo ?? {};
  return {
    title: {
      default: seo.title ?? `${settings.site?.name ?? "StayHub"} — Hostel Booking`,
      template: `%s · ${settings.site?.name ?? "StayHub"}`,
    },
    description:
      seo.description ??
      "Comfortable hostels, great locations and unforgettable experiences. Book your perfect stay across the world's best hostels and guesthouses.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    openGraph: {
      title: seo.title ?? settings.site?.name ?? "StayHub",
      description: seo.description ?? "Hostel booking platform",
      type: "website",
      images: ["/og-image.jpg"],
    },
    robots: { index: true, follow: true },
    icons: { icon: "/favicon.ico", apple: "/apple-icon.png" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, prefs] = await Promise.all([getSettings(), getPreferences()]);
  const locale = normalizeLocale(prefs.locale);
  const dir = isRtl(locale) ? "rtl" : "ltr";
  const brandVars = brandCssVars(settings);

  const localeNames: Record<string, string> = {};
  for (const l of LANGUAGES) localeNames[l.code] = l.label;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{${brandVars}}` }} />
      </head>
      <body className={cn(inter.variable, jakarta.variable, "font-sans antialiased")}>
        <I18nProvider locale={locale} localeNames={localeNames}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}