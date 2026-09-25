import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PromotionForm } from "@/components/admin/promotion-form";

export const dynamic = "force-dynamic";

export default async function AdminNewOfferPage() {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "offers.manage")) redirect("/admin");

  const hostels = await prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">{t("admin.newOffer")}</h1>
        <Link href="/admin/offers" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>
      <PromotionForm hostels={hostels} isRtl={locale === "ar"} />
    </div>
  );
}