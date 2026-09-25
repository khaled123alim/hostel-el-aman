"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function ProfileForm({
  initial,
}: {
  initial: { firstName: string; lastName: string; email: string; phone: string; country: string };
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("account.profileSaved") });
        router.refresh();
      } else {
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("auth.firstName")}</span>
          <input
            value={values.firstName}
            onChange={(e) => setValues({ ...values, firstName: e.target.value })}
            required
            minLength={2}
            maxLength={60}
            className={fieldCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>{t("auth.lastName")}</span>
          <input
            value={values.lastName}
            onChange={(e) => setValues({ ...values, lastName: e.target.value })}
            required
            minLength={2}
            maxLength={60}
            className={fieldCls}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelCls}>{t("auth.email")}</span>
        <input value={values.email} disabled className={fieldCls + " cursor-not-allowed opacity-60"} />
        <span className="mt-1 block text-xs text-ink-soft">{t("account.emailFixed") ?? ""}</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>{t("auth.phone")}</span>
          <input
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
            maxLength={30}
            className={fieldCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>{t("auth.country")}</span>
          <input
            value={values.country}
            onChange={(e) => setValues({ ...values, country: e.target.value })}
            maxLength={60}
            className={fieldCls}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("common.save")}
      </button>
    </form>
  );
}