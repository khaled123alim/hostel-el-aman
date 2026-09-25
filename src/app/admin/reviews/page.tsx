import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { ModerateReviewButton } from "@/components/admin/moderate-review-button";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "APPROVED", "HIDDEN", "REJECTED"] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const status = (Array.isArray(q?.status) ? q.status[0] : q?.status ?? "PENDING") as (typeof STATUSES)[number];
  const valid = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : "PENDING";

  const reviews = await prisma.review.findMany({
    where: { status: valid },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      hostel: { select: { name: true, slug: true } },
      user: { select: { firstName: true, lastName: true, email: true } },
      reservation: { select: { checkIn: true, checkOut: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{t("admin.reviews")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{reviews.length} {t("common.results")}</p>
        </div>
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-2 p-3">
        {STATUSES.map((s) => (
          <button
            key={s}
            name="status"
            value={s}
            className={
              valid === s
                ? "rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
                : "rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-slate-200"
            }
          >
            {t(`status.${s}`)}
          </button>
        ))}
      </form>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-ink-soft">{t("common.noResults")}</div>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="card-surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-ink">
                    {r.user.firstName} {r.user.lastName}
                  </span>
                  <span className="text-xs text-ink-soft">{r.user.email}</span>
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                    {r.rating}/10
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {r.hostel.name} · {new Date(r.reservation.checkIn).toLocaleDateString()} →{" "}
                  {new Date(r.reservation.checkOut).toLocaleDateString()} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-soft">
                {t(`status.${r.status}`)}
              </span>
            </div>

            <p className="mt-3 text-sm text-ink">{r.comment || t("reviews.noComment")}</p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-soft">
              {(
                [
                  ["hd.critCleanliness", r.cleanliness],
                  ["hd.critLocation", r.location],
                  ["hd.critStaff", r.staff],
                  ["hd.critComfort", r.comfort],
                  ["hd.critFacilities", r.facilities],
                ] as const
              ).map(([k, v]) => (
                <span key={k}>
                  {t(k)}: <span className="font-semibold text-ink">{v}/10</span>
                </span>
              ))}
            </div>

            {can(user.role.name, "reviews.moderate") && (
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <ModerateReviewButton id={r.id} status="APPROVED" label={t("admin.approve")} color="brand" />
                <ModerateReviewButton id={r.id} status="HIDDEN" label={t("admin.hideReview")} color="slate" />
                <ModerateReviewButton id={r.id} status="REJECTED" label={t("admin.rejectReview")} color="rose" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}