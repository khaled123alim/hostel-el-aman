"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { LANGUAGES, CURRENCIES } from "@/lib/constants";

export function PreferencesForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const languageOptions: { code: string; label: string }[] = [...LANGUAGES];
  const currencyOptions: { code: string; symbol: string; label: string }[] = CURRENCIES.filter((c) => c.code === "DZD");

  const save = (patch: { locale?: string; currency?: string }) => {
    setSaved(false);
    fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        setSaved(true);
        toast({ title: t("account.profileSaved") });
      })
      .catch(() => {
        toast({ title: t("errors.generic"), variant: "error" });
      })
      .finally(() => {
        startTransition(() => router.refresh());
      });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className={labelCls}>{t("common.language")}</p>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => save({ locale: l.code })}
              disabled={pending}
              className={pillCls}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={labelCls}>{t("common.currency")}</p>
        <div className="flex flex-wrap gap-2">
          {currencyOptions.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => save({ currency: c.code })}
              disabled={pending}
              className={pillCls}
            >
              {c.symbol ?? c.code} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pending && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
        {saved && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><Check className="h-3.5 w-3.5" /> {t("account.profileSaved")}</span>}
      </div>
    </div>
  );
}

const labelCls = "mb-2 block text-xs font-bold uppercase tracking-wider text-ink-soft";
const pillCls =
  "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50";