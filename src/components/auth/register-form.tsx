"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function RegisterForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data.terms !== "on") {
      setError(t("auth.termsRequired"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("auth.registerTitle"), description: t("auth.verifyMessage") });
        router.replace("/verify-email");
        router.refresh();
      } else {
        setError(json.error ?? t("errors.generic"));
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setPending(false);
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft";

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("auth.firstName")}</span>
          <input name="firstName" required minLength={2} maxLength={60} autoComplete="given-name" className={fieldCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{t("auth.lastName")}</span>
          <input name="lastName" required minLength={2} maxLength={60} autoComplete="family-name" className={fieldCls} />
        </label>
      </div>
      <label className="block">
        <span className={labelCls}>{t("auth.email")}</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" className={fieldCls} />
      </label>
      <label className="block">
        <span className={labelCls}>{t("auth.password")}</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={fieldCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>{t("auth.confirmPassword")}</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={fieldCls}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("auth.phone")}</span>
          <input name="phone" maxLength={30} autoComplete="tel" className={fieldCls} />
        </label>
        <label className="block">
          <span className={labelCls}>{t("auth.country")}</span>
          <input name="country" maxLength={60} autoComplete="country-name" className={fieldCls} />
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-xs font-medium text-ink-soft">
        <input
          type="checkbox"
          name="terms"
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[var(--brand)]"
        />
        <span>{t("auth.acceptTerms")}</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        {t("auth.register")}
      </button>
    </form>
  );
}