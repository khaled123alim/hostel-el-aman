import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { RoomForm } from "@/components/admin/room-form";
import { AvailabilityManager } from "@/components/admin/availability-manager";

export const dynamic = "force-dynamic";

export default async function AdminEditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  if (!can(user.role.name, "rooms.manage")) redirect("/admin");
  const { id } = await params;

  const [room, hostels] = await Promise.all([
    prisma.room.findUnique({
      where: { id },
      include: { hostel: { select: { id: true, name: true, city: true, slug: true } }, amenities: true },
    }),
    prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
  ]);
  if (!room) notFound();

  const overrides = await prisma.roomAvailability.findMany({
    where: { roomId: id, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 60,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="heading-2xl">
          {t("common.edit")} — {room.name}
        </h1>
        <Link href="/admin/rooms" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>

      <div className="card-surface p-6">
        <h2 className="mb-5 font-display text-base font-bold">{t("admin.availability")}</h2>
        <AvailabilityManager
          roomId={id}
          isRtl={locale === "ar"}
          overrides={overrides.map((o) => ({
            id: o.id,
            date: o.date.toISOString().slice(0, 10),
            status: o.status,
            reason: o.reason ?? "",
            priceOverride: o.priceOverride ?? undefined,
          }))}
        />
      </div>

      <RoomForm
        id={room.id}
        hostels={hostels.map((h) => ({ id: h.id, label: `${h.name} · ${h.city}` }))}
        isRtl={locale === "ar"}
        initial={{
          hostelId: room.hostelId,
          name: room.name,
          number: room.number,
          type: room.type,
          description: room.description ?? "",
          capacity: String(room.capacity),
          beds: String(room.beds),
          bedType: room.bedType,
          bathroomType: room.bathroomType,
          pricePerNight: String(room.pricePerNight),
          cleaningFee: String(room.cleaningFee),
          taxRate: String(room.taxRate),
          minStay: String(room.minStay),
          maxStay: String(room.maxStay),
          amenities: room.amenities.map((a) => a.name).join("\n"),
          images: Array.isArray(room.images) ? (room.images as string[]).join("\n") : "",
          status: room.status,
        }}
      />
    </div>
  );
}