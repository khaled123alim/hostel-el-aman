import { Mail, Phone, MapPin, MessageCircleQuestion } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "@/components/shared/contact-form";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [settings, prefs] = await Promise.all([getSettings(), getPreferences()]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);
  const site = settings.site;

  const info = [
    { icon: Mail, label: t("common.emailLabel"), value: site?.contactEmail ?? "hello@stayhub.com", href: `mailto:${site?.contactEmail ?? "hello@stayhub.com"}` },
    { icon: Phone, label: t("common.phone"), value: site?.phone ?? "—", href: `tel:${site?.phone}` },
    { icon: MapPin, label: t("hd.address"), value: site?.address ?? "—", href: "https://share.google/Fxe6xMjPReKrkFu1R" },
  ];

  return (
    <div className="pb-12">
      <section className="border-b border-[#020101]/8 bg-[#020101] pb-10 pt-16 text-white">
        <div className="container-x">
          <Breadcrumbs items={[{ label: t("common.backToHome"), href: "/" }, { label: t("nav.contact") }]} className="mb-3 text-white/60" />
          <h1 className="heading-2xl">{t("contact.title")}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/65">{t("contact.subtitle")}</p>
        </div>
      </section>

      <section className="container-x grid gap-8 py-10 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Reveal>
            <div className="card-surface flex h-full flex-col p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand">
                <MessageCircleQuestion className="h-6 w-6" />
              </div>
              {info.map((row) => (
                <div key={row.label} className="mt-5 border-t border-slate-100 pt-5 first:border-0 first:pt-0">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                    <row.icon className="h-4 w-4 text-accent" />
                    {row.label}
                  </p>
                  {row.href ? (
                    <a href={row.href} className="mt-1.5 block text-sm font-semibold text-ink transition hover:text-brand">
                      {row.value}
                    </a>
                  ) : (
                    <p className="mt-1.5 block text-sm font-semibold text-ink">{row.value}</p>
                  )}
                </div>
              ))}
              <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-ink-soft">
                {t("booking.customerService")}
              </p>
            </div>
          </Reveal>
        </aside>

        <Reveal delay={100}>
          <ContactForm />
        </Reveal>
      </section>
    </div>
  );
}