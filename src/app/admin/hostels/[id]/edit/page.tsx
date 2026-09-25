import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { HostelForm } from "@/components/admin/hostel-form";

export const dynamic = "force-dynamic";

export default async function AdminEditHostelPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "hostels.manage")) redirect("/admin");
  const { id } = await params;

  const hostel = await prisma.hostel.findUnique({
    where: { id },
    include: { amenities: true },
  });
  if (!hostel) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">{t("common.edit")} — {hostel.name}</h1>
        <Link href="/admin/hostels" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>
      <HostelForm
        id={hostel.id}
        isRtl={locale === "ar"}
        initial={{
          name: hostel.name,
          slug: hostel.slug,
          description: hostel.description,
          address: hostel.address,
          city: hostel.city,
          country: hostel.country,
          latitude: String(hostel.latitude),
          longitude: String(hostel.longitude),
          phone: hostel.phone ?? "",
          email: hostel.email ?? "",
          website: hostel.website ?? "",
          checkInTime: hostel.checkInTime,
          checkOutTime: hostel.checkOutTime,
          imageCover: hostel.imageCover,
          images: Array.isArray(hostel.images) ? (hostel.images as string[]).join("\n") : "",
          amenities: hostel.amenities.map((a) => a.name).join("\n"),
          houseRules: Array.isArray(hostel.houseRules) ? (hostel.houseRules as string[]).join("\n") : "",
          seoTitle: hostel.seoTitle ?? "",
          metaDescription: hostel.metaDescription ?? "",
          featured: hostel.featured,
          status: hostel.status,
        }}
      />
    </div>
  );
}