"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    const password = String(new FormData(form).get("password") ?? "");
    const remember = (new FormData(form).get("remember") as string) === "on";
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("auth.loginTitle"), description: t("auth.loggedIn") });
        const role = json.role ?? "CUSTOMER";
        const target =
          next && next.startsWith("/")
            ? next
            : role === "CUSTOMER"
              ? "/account"
              : "/admin";
        router.replace(target);
        router.refresh();
      } else {
        setError(json.error ?? t("auth.loginError"));
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
        <span className={labelCls}>{t("auth.email")}</span>
        <input name="email" type="email" required maxLength={120} autoComplete="email" className={fieldCls} />
      </label>
      <label className="block">
        <span className={labelCls}>{t("auth.password")}</span>
        <input
          name="password"
          type="password"
          required
          minLength={1}
          maxLength={128}
          autoComplete="current-password"
          className={fieldCls}
        />
      </label>
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-slate-300 accent-[var(--brand)]"
          />
          {t("auth.rememberMe")}
        </label>
        <Link href="/forgot-password" className="text-xs font-semibold text-brand transition hover:text-brand-dark">
          {t("auth.forgotPassword")}
        </Link>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {t("auth.login")}
      </button>
    </form>
  );
}