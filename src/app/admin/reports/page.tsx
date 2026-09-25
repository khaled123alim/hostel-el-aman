import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { getReportData } from "@/lib/services/reports";
import { formatMoney } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const { t, locale } = await serverI18n();
  await requireAdmin();
  const data = await getReportData();
  const cur = "EUR";

  const cards = [
    { label: t("admin.revenueToday"), value: data.revenue.today, color: "text-emerald-600" },
    { label: t("admin.revenueWeek"), value: data.revenue.week, color: "text-emerald-600" },
    { label: t("admin.revenueMonth"), value: data.revenue.month, color: "text-emerald-600" },
    { label: t("admin.revenueTotal"), value: data.revenue.total, color: "text-emerald-600" },
    { label: t("admin.resToday"), value: data.reservations.today, color: "text-ink" },
    { label: t("admin.resWeek"), value: data.reservations.week, color: "text-ink" },
    { label: t("admin.resMonth"), value: data.reservations.month, color: "text-ink" },
    { label: t("admin.resTotal"), value: data.reservations.total, color: "text-ink" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.reports")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("admin.reportsHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{c.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${c.color}`}>
              {c.label.startsWith(t("admin.revenue")) ? formatMoney(c.value, cur, locale) : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="font-display text-base font-bold">{t("admin.occupancyRate")}</h2>
          <p className="mt-3 font-display text-3xl font-bold text-ink">{data.occupancyToday}%</p>
          <p className="mt-1 text-sm text-ink-soft">{t("admin.occupancyTodayHint")}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, data.occupancyToday)}%` }} />
          </div>
        </div>
        <div className="card-surface p-6">
          <h2 className="font-display text-base font-bold">{t("admin.avgBookingValue")}</h2>
          <p className="mt-3 font-display text-3xl font-bold text-ink">{formatMoney(data.avgBookingValue, cur, locale)}</p>
          <p className="mt-1 text-sm text-ink-soft">{t("admin.cancelledRate")}: {data.cancellationRate}%</p>
        </div>
        <div className="card-surface p-6">
          <h2 className="font-display text-base font-bold">{t("admin.popularRooms")}</h2>
          <ul className="mt-3 space-y-2">
            {data.popularRooms.length === 0 && <li className="text-sm text-ink-soft">{t("common.noResults")}</li>}
            {data.popularRooms.slice(0, 6).map((r) => (
              <li key={r.name} className="flex items-center justify-between text-sm">
                <span className="text-ink">{r.name}</span>
                <span className="font-semibold text-ink-soft">{r.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-surface p-6">
          <h2 className="font-display text-base font-bold">{t("admin.popularHostels")}</h2>
          <ul className="mt-3 space-y-2">
            {data.popularHostels.length === 0 && <li className="text-sm text-ink-soft">{t("common.noResults")}</li>}
            {data.popularHostels.slice(0, 6).map((h) => (
              <li key={h.name} className="flex items-center justify-between text-sm">
                <span className="text-ink">{h.name}</span>
                <span className="font-semibold text-ink-soft">{h.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="font-display text-base font-bold">{t("admin.topCountries")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.topCountries.length === 0 && <li className="text-sm text-ink-soft">{t("common.noResults")}</li>}
            {data.topCountries.slice(0, 8).map((c) => (
              <li key={c.name} className="rounded-full bg-brand-subtle px-3 py-1 text-xs font-semibold text-ink">
                {c.name} · {c.count}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}