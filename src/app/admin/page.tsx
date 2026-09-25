import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarRange, Users, Banknote, Percent, KeyRound, Sparkles, AlertCircle, Activity } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { getSettings } from "@/lib/settings";
import { getDashboardStats, type Period } from "@/lib/services/reports";
import { formatMoney } from "@/lib/currency";
import { can } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/status-badge";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["today", "7d", "30d", "3m", "6m", "1y"];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const [, settings, userCtx] = await Promise.all([requireAdmin(), getSettings(), requireAdmin()]);
  void userCtx;

  const q = await searchParams;
  const rawPeriod = Array.isArray(q?.period) ? q.period[0] : q?.period;
  const period: Period = PERIODS.includes(rawPeriod as Period) ? (rawPeriod as Period) : "7d";

  const stats = await getDashboardStats(period);
  const base = settings.general?.defaultCurrency ?? "EUR";

  const summary = [
    { label: t("admin.revenue"), value: formatMoney(stats.totals.revenue, base, locale), icon: Banknote, tone: "bg-emerald-50 text-emerald-600" },
    { label: t("admin.totalReservations"), value: String(stats.totals.reservations), icon: CalendarRange, tone: "bg-brand-subtle text-brand" },
    { label: t("admin.occupancyRate"), value: `${stats.totals.occupancyRate}%`, icon: Percent, tone: "bg-indigo-50 text-indigo-600" },
    { label: t("admin.availableRooms"), value: `${stats.totals.availableRooms}/${stats.totals.totalRooms}`, icon: KeyRound, tone: "bg-amber-50 text-amber-600" },
  ];

  const live = [
    { label: t("admin.todayCheckins"), value: stats.totals.todayCheckins, icon: Users, tone: "bg-sky-50 text-sky-600" },
    { label: t("admin.todayCheckouts"), value: stats.totals.todayCheckouts, icon: Sparkles, tone: "bg-violet-50 text-violet-600" },
    { label: t("admin.currentGuests"), value: stats.totals.currentGuests, icon: Activity, tone: "bg-rose-50 text-rose-600" },
    { label: t("admin.pendingPayments"), value: stats.totals.pendingPayments, icon: AlertCircle, tone: "bg-orange-50 text-orange-600" },
  ];

  const maxRevenue = Math.max(1, ...stats.series.map((s) => s.revenue));
  const maxOcc = 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.dashboard")}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {t("admin.avgBookingValue")}: <span className="font-semibold text-ink">{formatMoney(stats.totals.avgBookingValue, base, locale)}</span>
            &nbsp;·&nbsp;{t("admin.cancelledRate")}: <span className="font-semibold text-ink">{stats.totals.cancelledRate}%</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`/admin?period=${p}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                p === period ? "bg-brand text-ink" : "text-ink-soft hover:bg-slate-100 hover:text-ink"
              }`}
            >
              {t(`admin.${p}`)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {summary.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {live.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold">{t("admin.revenueOverTime")}</h2>
            <span className="text-xs text-ink-soft">{t("admin.occupancyTrend")}</span>
          </div>
          <div className="flex h-40 items-end gap-1 sm:gap-1.5">
            {stats.series.map((s, i) => (
              <div key={i} className="group relative flex flex-1 flex-col justify-end gap-1" title={`${s.label} · ${formatMoney(s.revenue, base, locale)}`}>
                <div className="relative flex h-36 flex-col justify-end">
                  <div
                    className="w-full rounded-t bg-brand/80 transition group-hover:bg-brand"
                    style={{ height: `${(s.revenue / maxRevenue) * 100}%`, minHeight: s.revenue > 0 ? 2 : 1 }}
                  />
                  <div
                    className="w-full rounded-t bg-amber-400/70"
                    style={{ height: `${(s.occupancy / maxOcc) * 100}%`, minHeight: s.occupancy > 0 ? 2 : 1 }}
                  />
                </div>
                <span className={`text-center text-[9px] font-medium ${s.reservations > 0 ? "text-ink" : "text-slate-300"}`}>
                  {s.label.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.roomTypePopularity")}</h2>
          <div className="space-y-3">
            {stats.roomTypePopularity.length === 0 && (
              <p className="text-sm text-ink-soft">{t("common.noResults")}</p>
            )}
            {stats.roomTypePopularity.slice(0, 6).map((r) => {
              const max = Math.max(1, ...stats.roomTypePopularity.map((x) => x.count));
              return (
                <div key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">{t(`roomType.${r.name}`)}</span>
                    <span className="text-ink-soft">{r.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(r.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.bookingSources")}</h2>
          <div className="flex flex-wrap gap-2">
            {stats.bookingSources.map((b) => (
              <span key={b.name} className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1.5 text-xs font-semibold text-brand">
                {b.name}
                <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-ink">{b.count}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.paymentMethods")}</h2>
          <div className="flex flex-wrap gap-2">
            {stats.paymentMethods.length === 0 && <p className="text-sm text-ink-soft">{t("common.noResults")}</p>}
            {stats.paymentMethods.map((b) => (
              <span key={b.name} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                {b.name}
                <span className="rounded-full bg-white px-1.5 text-[10px] font-bold text-ink">{b.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-sm font-bold">{t("admin.recentReservations")}</h2>
          {can(userCtx.user.role.name, "reservations.view") && (
            <Link href="/admin/reservations" className="text-xs font-semibold text-brand hover:underline">
              {t("admin.viewAll")}
            </Link>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm rtl:text-right">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">{t("admin.customers")}</th>
                <th className="px-5 py-3 font-semibold">{t("admin.hostels")}</th>
                <th className="px-5 py-3 font-semibold">{t("common.total")}</th>
                <th className="px-5 py-3 font-semibold">{t("admin.status")}</th>
                <th className="px-5 py-3 font-semibold">{t("common.date")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-ink-soft">
                    {t("common.noResults")}
                  </td>
                </tr>
              )}
              {stats.recent.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/reservations/${r.id}`} className="font-mono text-xs font-bold text-brand hover:underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-ink">{r.customerName}</td>
                  <td className="px-5 py-3 text-ink-soft">{r.hostelName}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{formatMoney(r.total, r.currency, locale)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} label={t(`status.${r.status}`)} />
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-soft">{fmtDate(r.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: LucideIcon; tone: string }) {
  return (
    <div className="card-surface flex items-center gap-3.5 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-ink-soft">{label}</p>
        <p className="truncate font-display text-xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}