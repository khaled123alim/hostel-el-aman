import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/currency";
import { StatusBadge } from "@/components/ui/status-badge";
import { CustomerStatusButton } from "@/components/admin/customer-status-button";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const needle = (Array.isArray(q?.q) ? q.q[0] : q?.q ?? "").trim();

  const customers = await prisma.user.findMany({
    where: {
      role: { name: "CUSTOMER" },
      ...(needle
        ? {
            OR: [{ firstName: { contains: needle } }, { lastName: { contains: needle } }, { email: { contains: needle } }],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { reservations: true } },
      reservations: { select: { total: true, status: true, paymentStatus: true } },
    },
  });

  const spent = (r: { reservations: { total: number; status: string }[] }) =>
    r.reservations
      .filter((x) => x.status !== "CANCELLED" && x.status !== "NO_SHOW")
      .reduce((s, x) => s + x.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.customers")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{customers.length} {t("common.results")}</p>
        </div>
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-3 p-3">
        <input name="q" defaultValue={needle} placeholder={t("admin.searchCustomers")} className="input-base max-w-xs" />
        <button type="submit" className="btn-subtle">
          {t("common.search")}
        </button>
      </form>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t("common.name")}</th>
              <th className="px-4 py-3">{t("common.email")}</th>
              <th className="px-4 py-3">{t("admin.reservationUses")}</th>
              <th className="px-4 py-3">{t("admin.totalSpent")}</th>
              <th className="px-4 py-3">{t("admin.joined")}</th>
              <th className="px-4 py-3">{t("admin.status")}</th>
              {can(user.role.name, "customers.edit") && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-soft">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  {c.firstName} {c.lastName}
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.email}</td>
                <td className="px-4 py-3">{c._count.reservations}</td>
                <td className="px-4 py-3 font-semibold text-ink">{formatMoney(spent(c), "EUR", locale)}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} label={t(`status.${c.status}`)} />
                </td>
                {can(user.role.name, "customers.edit") && (
                  <td className="px-4 py-3 text-right">
                    <CustomerStatusButton id={c.id} status={c.status} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}