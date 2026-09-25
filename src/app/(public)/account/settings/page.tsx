import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { ProfileForm } from "@/components/account/profile-form";
import { PasswordForm } from "@/components/account/password-form";
import { PreferencesForm } from "@/components/account/preferences-form";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user } = await requireAuth();
  const [{ tab }, prefs] = await Promise.all([searchParams, getPreferences()]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);
  const showPassword = tab === "password";

  return (
    <div className="space-y-6">
      <h1 className="heading-xl">{t("account.myProfile")}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="font-display text-lg font-bold">{t("account.myProfile")}</h2>
          <p className="mb-5 mt-1 text-sm text-ink-soft">{t("account.profileSaved")}</p>
          <ProfileForm
            initial={{
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone ?? "",
              country: user.country ?? "",
            }}
          />
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">{t("account.changePassword")}</h2>
            <div className="mt-5">
              <PasswordForm />
            </div>
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">
              {locale === "ar" ? "اللغة والعملة" : locale === "fr" ? "Langue et devise" : "Language & currency"}
            </h2>
            <div className="mt-5">
              <PreferencesForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}