import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { PromotionForm } from "@/components/admin/promotion-form";

export const dynamic = "force-dynamic";

export default async function AdminEditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "offers.manage")) redirect("/admin");
  const { id } = await params;

  const [offer, hostels] = await Promise.all([
    prisma.promotion.findUnique({ where: { id } }),
    prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!offer) notFound();

  let applicable: string[] = [];
  try {
    applicable = JSON.parse(offer.applicableHostels) as string[];
  } catch {
    applicable = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">
          {t("common.edit")} — {offer.name}
        </h1>
        <Link href="/admin/offers" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>
      <PromotionForm
        id={offer.id}
        hostels={hostels}
        isRtl={locale === "ar"}
        initial={{
          name: offer.name,
          code: offer.code,
          type: offer.type,
          value: String(offer.value || ""),
          fixedDiscount: String(offer.fixedDiscount || ""),
          minNights: String(offer.minNights),
          minAmount: offer.minAmount != null ? String(offer.minAmount) : "",
          maxUses: offer.maxUses != null ? String(offer.maxUses) : "",
          startDate: offer.startDate.toISOString().slice(0, 10),
          endDate: offer.endDate.toISOString().slice(0, 10),
          hostelIds: applicable.join(","),
          status: offer.status,
        }}
      />
    </div>
  );
}