"use client";

import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function PasswordForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const currentPassword = String(new FormData(form).get("currentPassword") ?? "");
    const newPassword = String(new FormData(form).get("newPassword") ?? "");
    const confirmPassword = String(new FormData(form).get("confirmPassword") ?? "");
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        toast({ title: t("account.passwordChanged") });
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
      <label className="block">
        <span className={labelCls}>{t("account.currentPassword")}</span>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={fieldCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>{t("auth.newPassword")}</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
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
          autoComplete="new-password"
          className={fieldCls}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {t("account.changePassword")}
      </button>
    </form>
  );
}