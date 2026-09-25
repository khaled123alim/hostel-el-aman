"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

export function OfferCard({
  name,
  code,
  type,
  value,
  fixedDiscount,
  minNights,
  validUntil,
}: {
  name: string;
  code: string;
  type: string;
  value: number;
  fixedDiscount: number;
  minNights: number;
  validUntil: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-brand p-6 text-white shadow-card transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20" />
      <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />

      <p className="font-display text-4xl font-extrabold tracking-tight text-accent">
        {type === "PERCENTAGE" ? `-${value}%` : `-${fixedDiscount.toFixed(0)}${fixedDiscount >= 100 ? "" : ""}`}
      </p>
      <p className="mt-2 font-display text-lg font-bold">{name}</p>

      <button
        onClick={copy}
        className="mt-4 inline-flex w-max items-center gap-2 rounded-lg border border-dashed border-white/40 bg-white/10 px-3.5 py-2 text-sm font-bold tracking-widest backdrop-blur transition hover:bg-white/20"
      >
        {code}
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>

      <p className="mt-4 text-xs text-white/70">{t("home.minNights", { n: minNights })}</p>
      <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-white/60">
        {t("offers.validUntil")} {validUntil}
      </p>
    </div>
  );
}