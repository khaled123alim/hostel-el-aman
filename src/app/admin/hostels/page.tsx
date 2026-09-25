import Link from "next/link";
import { Plus, MapPin, DoorOpen, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const dynamic = "force-dynamic";

export default async function AdminHostelsPage() {
  const { t } = await serverI18n();
  const { user } = await requireAdmin();
  const manage = can(user.role.name, "hostels.manage");

  const hostels = await prisma.hostel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { rooms: true, reservations: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.hostels")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{hostels.length} {t("common.results")}</p>
        </div>
        {manage && (
          <Link
            href="/admin/hostels/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            {t("admin.newHostel")}
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hostels.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-ink-soft md:col-span-2 xl:col-span-3">
            {t("common.noResults")}
          </div>
        )}
        {hostels.map((h) => (
          <div key={h.id} className="card-surface overflow-hidden">
            <div className="relative h-36 bg-brand-subtle">
              {h.imageCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={h.imageCover} alt={h.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <MapPin className="h-8 w-8 text-brand/40" />
                </div>
              )}
              <div className="absolute right-3 top-3">
                <StatusBadge status={h.status} label={t(`status.${h.status}`)} />
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/55 px-2 py-1 text-xs font-semibold text-white">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {h.ratingAvg.toFixed(1)}
              </div>
            </div>
            <div className="p-4">
              <h2 className="font-display text-base font-bold text-ink">{h.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                <MapPin className="h-3.5 w-3.5" />
                {h.city}, {h.country}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
                <span className="inline-flex items-center gap-1">
                  <DoorOpen className="h-3.5 w-3.5" />
                  {h._count.rooms} {t("common.rooms")}
                </span>
                <span>{h._count.reservations} {t("admin.reservations")}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Link href={`/admin/hostels/${h.id}/edit`} className="btn-subtle flex-1 !px-3 !py-2 text-xs">
                  {t("common.edit")}
                </Link>
                <Link href={`/admin/rooms?hostel=${h.id}`} className="btn-subtle flex-1 !px-3 !py-2 text-xs">
                  {t("admin.rooms")}
                </Link>
                <Link href={`/hostels/${h.slug}`} target="_blank" className="btn-subtle flex-1 !px-3 !py-2 text-xs">
                  {t("common.view")}
                </Link>
                {manage && (
                  <ConfirmButton
                    id={h.id}
                    slug={h.slug}
                    name={h.name}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}