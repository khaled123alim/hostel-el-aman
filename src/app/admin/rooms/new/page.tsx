import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { RoomForm } from "@/components/admin/room-form";

export const dynamic = "force-dynamic";

export default async function AdminNewRoomPage() {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "rooms.manage")) redirect("/admin");

  const hostels = await prisma.hostel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, city: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">{t("admin.newRoom")}</h1>
        <Link href="/admin/rooms" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>
      <RoomForm
        hostels={hostels.map((h) => ({ id: h.id, label: `${h.name} · ${h.city}` }))}
        isRtl={locale === "ar"}
      />
    </div>
  );
}