import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const { t } = await serverI18n();
  await requireAdmin();

  const templates = await prisma.emailTemplate.findMany({ orderBy: [{ key: "asc" }, { locale: "asc" }] });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.emails")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{templates.length} {t("common.results")}</p>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t("admin.templateKey")}</th>
              <th className="px-4 py-3">{t("common.language")}</th>
              <th className="px-4 py-3">{t("admin.subject")}</th>
              <th className="px-4 py-3">{t("admin.updated")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {templates.map((tp) => (
              <tr key={tp.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-brand">{tp.key}</td>
                <td className="px-4 py-3 uppercase">{tp.locale}</td>
                <td className="px-4 py-3 text-ink">{tp.subject}</td>
                <td className="px-4 py-3 text-ink-soft">{new Date(tp.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <a href={`/admin/emails/${tp.id}`} className="btn-subtle !px-3 !py-2 text-xs">
                    {t("common.edit")}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}