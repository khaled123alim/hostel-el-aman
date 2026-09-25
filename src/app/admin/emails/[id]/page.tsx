import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { TemplateForm } from "@/components/admin/template-form";

export const dynamic = "force-dynamic";

export default async function AdminEditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await serverI18n();
  await requireAdmin();
  const { id } = await params;

  const tpl = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!tpl) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">
          {t("common.edit")} — <span className="font-mono text-lg">{tpl.key}</span>
        </h1>
        <Link href="/admin/emails" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>
      <TemplateForm id={tpl.id} subject={tpl.subject} body={tpl.body} />
    </div>
  );
}