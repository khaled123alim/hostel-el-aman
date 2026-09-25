"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Logo } from "@/components/shared/logo";

export function SiteFooter({
  siteName,
  contact,
  socials,
}: {
  siteName: string;
  contact?: { email: string; phone: string; address: string };
  socials?: { facebook: string; instagram: string; twitter: string };
}) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#020101] text-white">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:max-w-md">
            <Logo name={siteName} />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              مرقد الأمان — a comfortable, safe hostel in Douera, Algiers. No prepayment —
              reserve online and pay when you arrive.
            </p>
            <div className="mt-5 space-y-2 text-sm text-white/60">
              {contact?.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 transition hover:text-[#F4C24B]">
                  <Phone className="h-4 w-4 text-[#F4C24B]" /> {contact.phone}
                </a>
              )}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 transition hover:text-[#F4C24B]">
                  <Mail className="h-4 w-4 text-[#F4C24B]" /> {contact.email}
                </a>
              )}
              {contact?.address && (
                <span className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-[#F4C24B]" /> {contact.address}
                </span>
              )}
            </div>
            {socials && (socials.facebook || socials.instagram || socials.twitter) && (
              <div className="mt-5 flex items-center gap-2">
                {socials.facebook && (
                  <a href={socials.facebook} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white/60 transition hover:border-[#F4C24B] hover:text-[#F4C24B]">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {socials.instagram && (
                  <a href={socials.instagram} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white/60 transition hover:border-[#F4C24B] hover:text-[#F4C24B]">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {socials.twitter && (
                  <a href={socials.twitter} target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 text-white/60 transition hover:border-[#F4C24B] hover:text-[#F4C24B]">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#F4C24B]">{t("nav.rooms")}</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/rooms" className="text-sm text-white/60 transition hover:text-[#F4C24B]">{t("nav.rooms")}</Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-white/60 transition hover:text-[#F4C24B]">{t("nav.contact")}</Link>
              </li>
              <li>
                <Link href="/account/reservations" className="text-sm text-white/60 transition hover:text-[#F4C24B]">{t("nav.myReservations")}</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-[#F4C24B]">{t("nav.about")}</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/about" className="text-sm text-white/60 transition hover:text-[#F4C24B]">{t("nav.about")}</Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-white/60 transition hover:text-[#F4C24B]">{t("nav.login")}</Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-white/60 transition hover:text-[#F4C24B]">{t("nav.register")}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/40">
            © {year} {siteName} — Douera, Alger. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-xs text-white/40">
            Reservation only — no prepayment. You pay at the hostel.
          </p>
        </div>
      </div>
    </footer>
  );
}