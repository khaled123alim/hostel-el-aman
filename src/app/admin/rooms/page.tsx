import Link from "next/link";
import { Plus, Users, Euro, Bed } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/currency";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const hostelId = Array.isArray(q?.hostel) ? q.hostel[0] : q?.hostel ?? "";

  const [hostels, rooms] = await Promise.all([
    prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.room.findMany({
      where: hostelId ? { hostelId } : {},
      orderBy: [{ hostelId: "asc" }, { number: "asc" }],
      include: { hostel: { select: { name: true, slug: true } } },
    }),
  ]);
  const hostelMap = new Map(hostels.map((h) => [h.id, h.name]));

  const currency = "EUR";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.rooms")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{rooms.length} {t("common.results")}</p>
        </div>
        {can(user.role.name, "rooms.manage") && (
          <Link
            href="/admin/rooms/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            {t("admin.newRoom")}
          </Link>
        )}
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-3 p-3">
        <select name="hostel" defaultValue={hostelId} className="input-base max-w-64">
          <option value="">{t("admin.allHostels")}</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-subtle">
          {t("common.apply")}
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-ink-soft md:col-span-2 xl:col-span-3">
            {t("common.noResults")}
          </div>
        )}
        {rooms.map((r) => (
          <div key={r.id} className="card-surface flex flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink">
                  {r.name} <span className="text-xs font-semibold text-ink-soft">({r.number})</span>
                </h2>
                <p className="mt-0.5 text-xs text-ink-soft">{hostelMap.get(r.hostelId)}</p>
              </div>
              <StatusBadge status={r.status} label={t(`status.${r.status}`)} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {r.capacity}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {t(`bed.${r.bedType}`)}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-ink">
                <Euro className="h-3.5 w-3.5" />
                {formatMoney(r.pricePerNight, currency, locale)}
              </span>
              <span>{t(`roomType.${r.type}`)}</span>
              <span>{t(`bath.${r.bathroomType}`)}</span>
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Link href={`/admin/rooms/${r.id}/edit`} className="btn-subtle !px-3 !py-2 text-xs">
                {t("common.edit")}
              </Link>
              <Link href={`/admin/reservations/new?room=${r.id}`} className="btn-subtle !px-3 !py-2 text-xs">
                {t("admin.newReservation")}
              </Link>
              {can(user.role.name, "rooms.manage") && (
                <ConfirmDeleteButton
                  url={`/api/admin/rooms/${r.id}`}
                  title={t("admin.deleteRoomConfirm")}
                  description={t("admin.deleteRoomDesc")}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}