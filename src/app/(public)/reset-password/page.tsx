import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ token }, prefs] = await Promise.all([searchParams, getPreferences()]);
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(prefs.locale, k, vars);

  if (!token) {
    return (
      <AuthShell
        title={t("auth.resetTitle")}
        footer={
          <p className="text-center text-sm text-ink-soft">
            <Link href="/forgot-password" className="font-semibold text-brand">
              {t("auth.forgotPassword")}
            </Link>
          </p>
        }
      >
        <div className="space-y-3">
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {t("errors.invalidToken")}
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("auth.resetTitle")}
      footer={
        <p className="text-center text-sm text-ink-soft">
          <Link href="/login" className="font-semibold text-brand transition hover:text-brand-dark">
            {t("auth.login")}
          </Link>
        </p>
      }
    >
      <ResetForm token={token} />
    </AuthShell>
  );
}