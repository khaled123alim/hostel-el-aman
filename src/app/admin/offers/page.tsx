import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const { t } = await serverI18n();
  const { user } = await requireAdmin();

  const now = new Date();
  const offers = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reservations: true } } },
  });

  const live = (o: { status: string; startDate: Date; endDate: Date }) =>
    o.status === "ACTIVE" && o.startDate <= now && o.endDate >= now;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.offers")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{offers.length} {t("common.results")}</p>
        </div>
        {can(user.role.name, "offers.manage") && (
          <Link
            href="/admin/offers/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            {t("admin.newOffer")}
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-ink-soft md:col-span-2 xl:col-span-3">
            {t("common.noResults")}
          </div>
        )}
        {offers.map((o) => {
          const isLive = live(o);
          const hostels =
            (() => {
              try {
                return JSON.parse(o.applicableHostels) as string[];
              } catch {
                return [];
              }
            })();
          return (
            <div key={o.id} className="card-surface flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Tag className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">{o.name}</h2>
                    <p className="font-mono text-xs font-semibold text-brand">{o.code}</p>
                  </div>
                </div>
                <span
                  className={
                    isLive
                      ? "rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-soft"
                  }
                >
                  {isLive ? t("admin.offersLive") : t("admin.offersExpired")}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-display text-lg font-bold text-ink">
                  {o.type === "PERCENTAGE" ? `${o.value}%` : `${o.fixedDiscount}`}{" "}
                    <span className="text-xs font-semibold text-ink-soft">
                      {o.type === "PERCENTAGE" ? t("admin.off") : t("admin.offAmount")}
                    </span>
                </span>
                <span className="text-xs text-ink-soft">
                  {new Date(o.startDate).toLocaleDateString()} → {new Date(o.endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {hostels.length === 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-ink-soft">{t("admin.allHostels")}</span>
                )}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-ink-soft">
                  {o._count.reservations} {t("admin.reservationUses")}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-ink-soft">
                  {o.minNights}+ {t("common.nights")}
                </span>
              </div>

              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={`/admin/offers/${o.id}/edit`}
                  className="btn-subtle !px-3 !py-2 text-xs"
                >
                  {t("common.edit")}
                </Link>
                {can(user.role.name, "offers.manage") && (
                  <ConfirmDeleteButton url={`/api/admin/offers/${o.id}`} title={t("admin.deleteOfferConfirm")} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}