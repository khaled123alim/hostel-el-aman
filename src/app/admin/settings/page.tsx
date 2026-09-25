import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";
import { SettingsSection, type FieldSpec } from "@/components/admin/settings-section";

export const dynamic = "force-dynamic";

const SELECT_LANG = ["en", "fr", "ar"];
const SELECT_CURRENCY = ["EUR", "USD", "GBP", "DZD"];

function rgbToHex(v: unknown): string {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{1,3}) (\d{1,3}) (\d{1,3})$/);
  if (!m) return s.startsWith("#") ? s : "#ffffff";
  const toHex = (n: string) => Number(n).toString(16).padStart(2, "0");
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
}

export default async function AdminSettingsPage() {
  const { t } = await serverI18n();
  await requireAdmin();

  const s = await getSettings(true);

  const site: FieldSpec[] = [
    { key: "name", label: t("admin.siteName"), type: "text" },
    { key: "tagline", label: t("admin.tagline"), type: "text" },
    { key: "logo", label: "Logo URL", type: "text" },
    { key: "favicon", label: "Favicon URL", type: "text" },
    { key: "contactEmail", label: t("common.email"), type: "text" },
    { key: "phone", label: t("common.phone"), type: "text" },
    { key: "address", label: t("admin.address"), type: "text" },
    { key: "facebook", label: "Facebook", type: "text" },
    { key: "instagram", label: "Instagram", type: "text" },
    { key: "twitter", label: "Twitter / X", type: "text" },
  ];

  const general: FieldSpec[] = [
    { key: "defaultCurrency", label: t("admin.defaultCurrency"), type: "select", options: SELECT_CURRENCY },
    { key: "supportedCurrencies", label: t("admin.supportedCurrencies"), type: "text" },
    { key: "defaultLocale", label: t("admin.defaultLocale"), type: "select", options: SELECT_LANG },
    { key: "supportedLocales", label: t("admin.supportedLocales"), type: "text" },
    { key: "timezone", label: t("admin.timezone"), type: "text" },
  ];

  const reservations: FieldSpec[] = [
    { key: "autoConfirm", label: t("admin.autoConfirm"), type: "checkbox" },
    { key: "minNights", label: t("admin.minNights"), type: "number" },
    { key: "maxNights", label: t("admin.maxNights"), type: "number" },
    { key: "maxGuestsPerRoom", label: t("admin.maxGuestsPerRoom"), type: "number" },
    { key: "checkInDefault", label: t("admin.checkInDefault"), type: "text" },
    { key: "checkOutDefault", label: t("admin.checkOutDefault"), type: "text" },
  ];

  const payments: FieldSpec[] = [
    { key: "payAtHostelEnabled", label: t("admin.payAtHostel"), type: "checkbox" },
    { key: "cardEnabled", label: t("admin.cardEnabled"), type: "checkbox" },
    { key: "stripeEnabled", label: t("admin.stripeEnabled"), type: "checkbox" },
    { key: "taxRate", label: t("admin.taxRate") + " (%)", type: "number" },
    { key: "currency", label: t("admin.defaultCurrency"), type: "select", options: SELECT_CURRENCY },
  ];

  const tax: FieldSpec[] = [
    { key: "rate", label: t("admin.taxRate") + " (%)", type: "number" },
    { key: "label", label: t("admin.taxLabel"), type: "text" },
    { key: "applyCleaningFee", label: t("admin.applyCleaningFee"), type: "checkbox" },
  ];

  const cancellation: FieldSpec[] = [
    { key: "policy", label: t("admin.policy"), type: "text" },
    { key: "freeUntilDays", label: t("admin.freeUntilDays"), type: "number" },
    { key: "refundPercentage", label: t("admin.refundPercentage"), type: "number" },
    { key: "text", label: t("admin.cancellationText"), type: "textarea" },
  ];

  const emailGroup: FieldSpec[] = [
    { key: "ownerEmail", label: t("admin.ownerEmail"), type: "email" },
    { key: "enabled", label: t("admin.emailsEnabled"), type: "checkbox" },
    { key: "cc", label: "CC", type: "text" },
  ];

  const notif: FieldSpec[] = [
    { key: "bookingCreated", label: t("admin.notifBooking"), type: "checkbox" },
    { key: "paymentReceived", label: t("admin.notifPayment"), type: "checkbox" },
    { key: "checkinReminder", label: t("admin.notifCheckin"), type: "checkbox" },
  ];

  const mapCfg: FieldSpec[] = [
    { key: "provider", label: t("admin.mapProvider"), type: "select", options: ["osm", "mapbox"] },
    { key: "token", label: t("admin.mapToken"), type: "text" },
  ];

  const seo: FieldSpec[] = [
    { key: "title", label: t("admin.seoTitle"), type: "text" },
    { key: "description", label: t("admin.metaDescription"), type: "textarea" },
  ];

  const brandValues: Record<string, unknown> = Object.fromEntries(
    Object.entries(s.brand ?? {}).map(([k, v]) => [k, rgbToHex(v)])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.settings")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("admin.settingsHint")}</p>
      </div>

      <SettingsSection
        group="site"
        title={t("admin.sectionSite")}
        description={t("admin.sectionSiteDesc")}
        fields={site}
        values={s.site ?? {}}
      />

      <SettingsSection
        group="brand"
        title={t("admin.sectionBrand")}
        description={t("admin.sectionBrandDesc")}
        fields={[
          { key: "primary", label: t("admin.colorPrimary"), type: "text" },
          { key: "primaryDark", label: t("admin.colorPrimaryDark"), type: "text" },
          { key: "accent", label: t("admin.colorAccent"), type: "text" },
          { key: "accentDark", label: t("admin.colorAccentDark"), type: "text" },
        ]}
        values={brandValues}
      />

      <SettingsSection
        group="general"
        title={t("admin.sectionGeneral")}
        description={t("admin.sectionGeneralDesc")}
        fields={general}
        values={{
          ...s.general,
          supportedCurrencies: (s.general?.supportedCurrencies ?? []).join(", "),
          supportedLocales: (s.general?.supportedLocales ?? []).join(", "),
        }}
      />

      <SettingsSection
        group="reservations"
        title={t("admin.sectionReservations")}
        description={t("admin.sectionReservationsDesc")}
        fields={reservations}
        values={s.reservations ?? {}}
      />

      <SettingsSection
        group="payments"
        title={t("admin.sectionPayments")}
        description={t("admin.sectionPaymentsDesc")}
        fields={payments}
        values={s.payments ?? {}}
      />

      <SettingsSection
        group="tax"
        title={t("admin.sectionTax")}
        fields={tax}
        values={s.tax ?? {}}
      />

      <SettingsSection
        group="cancellation"
        title={t("admin.sectionCancellation")}
        fields={cancellation}
        values={s.cancellation ?? {}}
      />

      <SettingsSection
        group="emails"
        title={t("admin.sectionEmails")}
        description={t("admin.sectionEmailsDesc")}
        fields={emailGroup}
        values={s.emails ?? {}}
      />

      <SettingsSection
        group="notifications"
        title={t("admin.sectionNotifications")}
        fields={notif}
        values={s.notifications ?? {}}
      />

      <SettingsSection
        group="map"
        title={t("admin.sectionMap")}
        fields={mapCfg}
        values={s.map ?? {}}
      />

      <SettingsSection
        group="seo"
        title={t("admin.sectionSeo")}
        fields={seo}
        values={s.seo ?? {}}
      />
    </div>
  );
}