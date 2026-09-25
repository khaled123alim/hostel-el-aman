import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { HostelForm } from "@/components/admin/hostel-form";

export const dynamic = "force-dynamic";

export default async function AdminNewHostelPage() {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "hostels.manage")) redirect("/admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">{t("admin.newHostel")}</h1>
        <Link href="/admin/hostels" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>
      <HostelForm isRtl={locale === "ar"} />
    </div>
  );
}