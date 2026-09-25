import { redirect } from "next/navigation";
import { getSession, getCurrentUser } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const [session, user, prefs] = await Promise.all([
    getSession(),
    getCurrentUser(),
    getPreferences(),
  ]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);

  if (session && user) {
    redirect(user.role.name === "CUSTOMER" ? "/account" : "/admin");
  }

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <p className="text-center text-sm text-ink-soft">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-brand transition hover:text-brand-dark">
            {t("auth.login")}
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}