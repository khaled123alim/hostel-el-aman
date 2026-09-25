import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyForm } from "@/components/auth/verify-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const [{ email }, prefs] = await Promise.all([searchParams, getPreferences()]);
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(prefs.locale, k, vars);

  return (
    <AuthShell
      title={t("auth.verifyTitle")}
      footer={
        <p className="text-center text-sm text-ink-soft">
          <Link href="/login" className="font-semibold text-brand transition hover:text-brand-dark">
            {t("auth.login")}
          </Link>
        </p>
      }
    >
      <VerifyForm email={email} />
      <p className="mt-4 text-center text-xs text-ink-soft">{t("auth.verifyMessage")}</p>
    </AuthShell>
  );
}