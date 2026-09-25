import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

const STATUSES = ["PAID", "PENDING", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
type Summary = { paid: number; pending: number; refunded: number; count: number };

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  await requireAdmin();
  const q = await searchParams;
  const status = (Array.isArray(q?.status) ? q.status[0] : q?.status ?? "") as string;

  const [payments, paidAgg, pendingAgg, refundAgg] = await Promise.all([
    prisma.payment.findMany({
      where: status && STATUSES.includes(status as (typeof STATUSES)[number]) ? { status: status as never } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        reservation: { select: { id: true, number: true, hostel: { select: { name: true } } } },
      },
    }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    prisma.refund.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
  ]);

  const summary: Summary = {
    paid: paidAgg._sum.amount ?? 0,
    pending: pendingAgg._sum.amount ?? 0,
    refunded: refundAgg._sum.amount ?? 0,
    count: payments.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.payments")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{summary.count} {t("common.results")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            [t("admin.totalPaid"), summary.paid, "text-emerald-600"],
            [t("admin.pendingPayments"), summary.pending, "text-amber-600"],
            [t("admin.totalRefunded"), summary.refunded, "text-rose-600"],
          ] as const
        ).map(([label, value, color]) => (
          <div key={label} className="card-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${color}`}>{formatMoney(value, "EUR", locale)}</p>
          </div>
        ))}
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-2 p-3">
        <Link
          href="/admin/payments"
          className={
            !status
              ? "rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
              : "rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-slate-200"
          }
        >
          {t("common.all")}
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/payments?status=${s}`}
            className={
              status === s
                ? "rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-slate-200"
            }
          >
            {t(`status.${s}`)}
          </Link>
        ))}
      </form>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t("admin.customer")}</th>
              <th className="px-4 py-3">{t("admin.reservations")}</th>
              <th className="px-4 py-3">{t("admin.hostels")}</th>
              <th className="px-4 py-3">{t("common.amountReceived")}</th>
              <th className="px-4 py-3">{t("admin.method")}</th>
              <th className="px-4 py-3">{t("common.date")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium text-ink">
                    {p.customer.firstName} {p.customer.lastName}
                  </span>
                  <span className="block text-xs text-ink-soft">{p.customer.email}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/reservations/${p.reservation.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">
                    {p.reservation.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.reservation.hostel.name}</td>
                <td className="px-4 py-3 font-semibold text-ink">{formatMoney(p.amount, p.currency, locale)}</td>
                <td className="px-4 py-3 text-ink-soft">{t(`payment.${p.method}`)}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(p.paidAt ?? p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} label={t(`status.${p.status}`)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}