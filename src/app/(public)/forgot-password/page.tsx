import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const prefs = await getPreferences();
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(prefs.locale, k, vars);

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
      <ForgotForm />
    </AuthShell>
  );
}