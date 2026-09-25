"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function VerifyForm({ email }: { email?: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "verified" | "error" | "idle">("checking");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const mail = params.get("email") ?? email ?? "";
    if (!token || !mail) {
      setStatus("idle");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: mail }),
        });
        if (res.ok) {
          setStatus("verified");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [email]);

  const resend = async () => {
    const mail = email ?? new URLSearchParams(window.location.search).get("email") ?? "";
    if (!mail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });
      if (res.ok) {
        toast({ title: t("auth.verifyResent") });
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: json.error ?? t("errors.generic"), variant: "error" });
      }
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setResending(false);
    }
  };

  if (status === "checking") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm text-ink-soft">{t("common.loading")}</p>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="text-sm font-semibold text-ink">{t("auth.verifySuccess")}</p>
        <button
          onClick={() => router.replace("/login")}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          {t("auth.login")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <Mail className="h-10 w-10 text-brand" />
      <p className="text-sm text-ink-soft">{t("auth.verifyMessage")}</p>
      <button
        onClick={resend}
        disabled={resending}
        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {t("auth.verifyResend")}
      </button>
    </div>
  );
}