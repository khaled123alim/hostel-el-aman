import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can, roleLabel } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/status-badge";
import { StaffStatusButton } from "@/components/admin/staff-status-button";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const { t } = await serverI18n();
  const { user } = await requireAdmin();

  const staff = await prisma.user.findMany({
    where: { role: { name: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST"] } } },
    orderBy: { createdAt: "asc" },
    include: { role: true, _count: { select: { reservations: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.staff")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{staff.length} {t("common.results")}</p>
      </div>

      {!can(user.role.name, "staff.manage") && (
        <div className="card-surface p-6 text-sm text-ink-soft">{t("admin.staffReadOnly")}</div>
      )}

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t("common.name")}</th>
              <th className="px-4 py-3">{t("common.email")}</th>
              <th className="px-4 py-3">{t("admin.role")}</th>
              <th className="px-4 py-3">{t("admin.reservationUses")}</th>
              <th className="px-4 py-3">{t("admin.joined")}</th>
              <th className="px-4 py-3">{t("admin.status")}</th>
              {can(user.role.name, "staff.manage") && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">
                  {s.firstName} {s.lastName}
                  {s.id === user.id && <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">{t("admin.you")}</span>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{s.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-semibold text-ink">
                    {roleLabel(s.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{s._count.reservations}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} label={t(`status.${s.status}`)} />
                </td>
                {can(user.role.name, "staff.manage") && s.id !== user.id && (
                  <td className="px-4 py-3 text-right">
                    <StaffStatusButton id={s.id} status={s.status} />
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