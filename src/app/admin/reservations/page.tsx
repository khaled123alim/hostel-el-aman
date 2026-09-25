import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/currency";
import { fmtDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeleteReservationButton } from "@/components/admin/reservation-delete-button";
import { ClearAllReservationsButton } from "@/components/admin/clear-all-reservations-button";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"];

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const sp = (k: string) => {
    const v = q?.[k];
    return Array.isArray(v) ? v[0] ?? "" : v ?? "";
  };
  const search = sp("q").trim();
  const status = sp("status");
  const hostelId = sp("hostel");

  const [hostels, reservations] = await Promise.all([
    prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.reservation.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { number: { contains: search } },
                { customer: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }, { email: { contains: search } }] } },
              ],
            }
          : {}),
        ...(STATUSES.includes(status) ? { status: status as never } : {}),
        ...(hostelId ? { hostelId } : {}),
      },
      include: { customer: true, hostel: true, room: true },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  const counts = await prisma.reservation.groupBy({ by: ["status"], _count: true });
  const totalCount = await prisma.reservation.count();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.reservations")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{reservations.length} {t("common.results")}</p>
        </div>
        <div className="flex items-center gap-2">
          {can(user.role.name, "reservations.delete") && totalCount > 0 && (
            <ClearAllReservationsButton count={totalCount} />
          )}
          {can(user.role.name, "reservations.create") && (
            <Link
              href="/admin/reservations/new"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              <Plus className="h-4 w-4" />
              {t("admin.newReservation")}
            </Link>
          )}
        </div>
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-3 p-3">
        <input
          name="q"
          defaultValue={search}
          placeholder={t("admin.searchReservations")}
          className="input-base max-w-xs"
        />
        <select name="status" defaultValue={status} className="input-base max-w-44">
          <option value="">{t("common.status")} — {t("common.all")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <select name="hostel" defaultValue={hostelId} className="input-base max-w-56">
          <option value="">{t("admin.allHostels")}</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-subtle">
          {t("common.search")}
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => {
          const count = counts.find((c) => c.status === s)?._count ?? 0;
          const active = status === s;
          return (
            <Link
              key={s}
              href={`/admin/reservations?status=${s}${search ? `&q=${encodeURIComponent(search)}` : ""}${hostelId ? `&hostel=${hostelId}` : ""}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? "bg-brand text-ink" : "bg-white text-ink-soft ring-1 ring-slate-200 hover:text-ink"
              }`}
            >
              {t(`status.${s}`)}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm rtl:text-right">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-5 py-3 font-semibold">{t("admin.customers")}</th>
                <th className="px-5 py-3 font-semibold">{t("admin.hostels")}</th>
                <th className="px-5 py-3 font-semibold">{t("common.dates")}</th>
                <th className="px-5 py-3 font-semibold">{t("common.guests")}</th>
                <th className="px-5 py-3 font-semibold">{t("common.total")}</th>
                <th className="px-5 py-3 font-semibold">{t("common.status")}</th>
                <th className="px-5 py-3 font-semibold">{t("admin.paymentStatus")}</th>
                {can(user.role.name, "reservations.delete") && (
                  <th className="px-5 py-3 font-semibold">{t("common.actions")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-ink-soft">
                    {t("common.noResults")}
                  </td>
                </tr>
              )}
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/reservations/${r.id}`} className="font-mono text-xs font-bold text-brand hover:underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">
                      {r.customer.firstName} {r.customer.lastName}
                    </p>
                    <p className="text-xs text-ink-soft">{r.customer.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{r.hostel.name}</p>
                    <p className="text-xs text-ink-soft">{r.room.name} ({r.room.number})</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-ink">
                      {fmtDate(r.checkIn, locale, "d MMM")} → {fmtDate(r.checkOut, locale, "d MMM yyyy")}
                    </p>
                    <p className="text-xs text-ink-soft">{r.nights} {t("common.nights")}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-ink-soft">
                      <Users className="h-3.5 w-3.5" />
                      {r.guests}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-ink">{formatMoney(r.total, r.currency, locale)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.status} label={t(`status.${r.status}`)} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={r.paymentStatus} label={t(`status.${r.paymentStatus}`)} />
                  </td>
                  {can(user.role.name, "reservations.delete") && (
                    <td className="px-5 py-3 text-center">
                      <DeleteReservationButton id={r.id} number={r.number} compact />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}