import { redirect } from "next/navigation";
import { getSession, getCurrentUser } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { getGoogleClientConfig } from "@/lib/oauth";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; oauth?: string }>;
}) {
  const [{ next, oauth }, session, user, prefs, google] = await Promise.all([
    searchParams,
    getSession(),
    getCurrentUser(),
    getPreferences(),
    getGoogleClientConfig(),
  ]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);

  if (session && user) {
    if (next && next.startsWith("/")) redirect(next);
    redirect(user.role.name === "CUSTOMER" ? "/account" : "/admin");
  }

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <p className="text-center text-sm text-ink-soft">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-semibold text-brand transition hover:text-brand-dark">
            {t("auth.signUp")}
          </Link>
        </p>
      }
    >
      {oauth === "unavailable" && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t("auth.oauthUnavailable") ?? "Social login is not configured."}
        </p>
      )}
      {oauth === "error" && (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {t("errors.generic")}
        </p>
      )}

      <LoginForm next={next} />

      {google && (
        <div className="mt-5">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            <span className="h-px flex-1 bg-slate-200" />
            {t("auth.orContinue")}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <a
            href="/api/auth/google"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 font-semibold text-ink transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.4a4.87 4.87 0 0 1-2.11 3.2v2.66h3.41c1.99-1.84 3.9-4.57 3.9-7.71Z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.88 0 5.3-.95 7.07-2.58l-3.41-2.66c-.94.63-2.15 1-3.66 1-2.82 0-5.21-1.9-6.06-4.46H2.42v2.75A10.8 10.8 0 0 0 12 22Z"
              />
              <path
                fill="#FBBC05"
                d="M5.94 13.3a6.52 6.52 0 0 1 0-4.6V5.95H2.42a10.98 10.98 0 0 0 0 9.7l3.52-2.35Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.02c1.56 0 2.97.54 4.07 1.6l3.05-3.05A10.8 10.8 0 0 0 12 0 10.8 10.8 0 0 0 2.42 5.95l3.52 2.75C6.79 6.92 9.18 5.02 12 5.02Z"
              />
            </svg>
            {t("auth.google")}
          </a>
        </div>
      )}
    </AuthShell>
  );
}