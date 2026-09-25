"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function ContactForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        toast({ title: t("contact.successTitle"), description: t("contact.successDesc") });
      } else {
        toast({ title: t("contact.errorTitle"), description: json.error ?? t("contact.errorDesc"), variant: "error" });
      }
    } catch {
      toast({ title: t("contact.errorTitle"), description: t("contact.errorDesc"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft";

  return (
    <form onSubmit={submit} className="card-surface space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("contact.name")}</span>
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={fieldCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{t("common.emailLabel")}</span>
          <input name="email" type="email" required maxLength={120} autoComplete="email" className={fieldCls} />
        </label>
      </div>
      <label className="block">
        <span className={labelCls}>{t("contact.subject")}</span>
        <input name="subject" required minLength={3} maxLength={150} className={fieldCls} />
      </label>
      <label className="block">
        <span className={labelCls}>{t("contact.message")}</span>
        <textarea name="message" required minLength={10} maxLength={3000} rows={6} placeholder={t("contact.messagePh")} className={fieldCls} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t("common.send")}
      </button>
    </form>
  );
}