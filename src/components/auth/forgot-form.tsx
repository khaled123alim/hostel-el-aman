"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function ForgotForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
        toast({ title: t("auth.resetSent") });
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: json.error ?? t("errors.generic"), variant: "error" });
      }
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft";

  if (sent) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-sm text-emerald-700">
        {t("auth.resetSent")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-ink-soft">{t("auth.resetMessage")}</p>
      <label className="block">
        <span className={labelCls}>{t("auth.email")}</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" className={fieldCls} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {t("common.send")}
      </button>
    </form>
  );
}