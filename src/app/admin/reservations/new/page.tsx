import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { isRtl } from "@/lib/i18n";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { NewReservationForm } from "@/components/admin/new-reservation-form";

export const dynamic = "force-dynamic";

export default async function AdminNewReservationPage() {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "reservations.create")) redirect("/admin");

  const [customers, hostels, rooms] = await Promise.all([
    prisma.user.findMany({
      where: { role: { name: "CUSTOMER" }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
    prisma.room.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ hostelId: "asc" }, { name: "asc" }],
      select: { id: true, name: true, number: true, hostelId: true, pricePerNight: true },
    }),
  ]);

  void locale;

  return (
    <div className="space-y-6">
      <h1 className="heading-2xl">{t("admin.newReservation")}</h1>
      <NewReservationForm
        customers={customers.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName} · ${c.email}` }))}
        hostels={hostels.map((h) => ({ id: h.id, label: `${h.name} · ${h.city}` }))}
        rooms={rooms.map((r) => ({ id: r.id, hostelId: r.hostelId, label: `${r.name} (${r.number})` }))}
        isRtl={isRtl(locale)}
      />
    </div>
  );
}