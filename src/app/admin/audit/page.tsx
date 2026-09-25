import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { roleLabel } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const action = ((Array.isArray(q?.action) ? q.action[0] : q?.action) ?? "").trim();

  const logs = await prisma.auditLog.findMany({
    where: action
      ? { action: { contains: action } }
      : {},
    orderBy: { createdAt: "desc" },
    take: 120,
    include: { user: { select: { firstName: true, lastName: true, email: true, role: { select: { name: true } } } } },
  });

  if (!can(user.role.name, "audit.view")) {
    return (
      <div className="card-surface p-10 text-center text-sm text-ink-soft">{t("admin.permissionDenied")}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.audit")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{logs.length} {t("common.results")}</p>
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-3 p-3">
        <input name="action" defaultValue={action} placeholder={t("admin.auditSearch")} className="input-base max-w-xs" />
        <button type="submit" className="btn-subtle">
          {t("common.search")}
        </button>
      </form>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t("admin.date")}</th>
              <th className="px-4 py-3">{t("admin.action")}</th>
              <th className="px-4 py-3">{t("admin.actor")}</th>
              <th className="px-4 py-3">{t("admin.detail")}</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                  {new Date(l.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ink">
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {l.actorName ?? (l.user ? `${l.user.firstName} ${l.user.lastName}` : "—")}
                  {l.user && <span className="block text-xs text-ink-soft">{roleLabel(l.user.role)}</span>}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {l.detail ?? ""}
                  {l.objectId && <span className="ml-1 font-mono text-xs text-brand">{l.objectId.slice(0, 8)}</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{l.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}