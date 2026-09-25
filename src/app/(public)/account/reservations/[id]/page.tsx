import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, BedDouble, CalendarDays, Users, KeyRound, History } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency";
import { fmtDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CancelReservationButton } from "@/components/account/cancel-button";
import { ReviewDialog } from "@/components/account/review-dialog";

export const dynamic = "force-dynamic";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireAuth();
  const { id } = await params;
  const prefs = await getPreferences();
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      hostel: { select: { name: true, slug: true, city: true, country: true, address: true } },
      room: { select: { name: true, number: true, type: true, capacity: true, beds: true } },
      history: { orderBy: { createdAt: "asc" } },
      guestsOverride: true,
      review: { select: { id: true } },
    },
  });

  if (!reservation || reservation.customerId !== user.id) notFound();

  const canCancel = reservation.status === "PENDING" || reservation.status === "CONFIRMED";
  const canReview = reservation.status === "CHECKED_OUT" && !reservation.review;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t("account.myReservations"), href: "/account/reservations" },
          { label: reservation.number },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="heading-2xl">{reservation.hostel.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <MapPin className="h-4 w-4 text-accent" />
            {reservation.hostel.address}, {reservation.hostel.city}, {reservation.hostel.country}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={reservation.status} label={t(`status.${reservation.status}`)} />
          <StatusBadge status={reservation.paymentStatus} label={t(`status.${reservation.paymentStatus}`)} />
        </div>
      </div>

      <div className="card-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.reservationNumber")}</p>
            <p className="font-display text-lg font-bold text-ink">{reservation.number}</p>
          </div>
          <p className="font-display text-2xl font-extrabold text-ink">
            {formatMoney(reservation.total, reservation.currency, locale)}
          </p>
        </div>

        <Separator className="my-5" />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <CalendarDays className="h-3.5 w-3.5 text-accent" /> {t("booking.checkin")}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{fmtDate(reservation.checkIn, locale)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <CalendarDays className="h-3.5 w-3.5 text-accent" /> {t("booking.checkout")}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{fmtDate(reservation.checkOut, locale)}</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <BedDouble className="h-3.5 w-3.5 text-accent" /> {t("booking.room")}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {reservation.room.name} · #{reservation.room.number}
            </p>
            <p className="text-xs text-ink-soft">
              {t(`roomType.${reservation.room.type}`)} · {reservation.nights} {t("booking.nights")}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
              <Users className="h-3.5 w-3.5 text-accent" /> {t("booking.guestsTotal")}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {reservation.guests} {t("common.guests")}
            </p>
            {reservation.checkInCode && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-brand">
                <KeyRound className="h-3.5 w-3.5" /> {reservation.checkInCode}
              </p>
            )}
          </div>
        </div>

        {reservation.guestsOverride.length > 0 && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.guestNames")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {reservation.guestsOverride.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink shadow-soft"
                >
                  {g.fullName}
                  {g.age != null && <span className="text-ink-soft"> · {g.age}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {reservation.specialRequests && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.specialRequests")}</p>
            <p className="mt-1 text-sm text-ink-soft">{reservation.specialRequests}</p>
          </div>
        )}

        {reservation.cancellationPolicy && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
            <p className="text-xs font-bold uppercase tracking-wider">Cancellation policy</p>
            <p className="mt-1">{reservation.cancellationPolicy}</p>
          </div>
        )}

        <Separator className="my-5" />

        <div className="flex flex-wrap items-center gap-3">
          {canCancel && <CancelReservationButton reservationId={reservation.id} />}
          {canReview && (
            <ReviewDialog
              triggerLabel={t("account.reviewStay")}
              target={{ reservationId: reservation.id, hostelName: reservation.hostel.name }}
            />
          )}
          <Link
            href={`/hostels/${reservation.hostel.slug}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            {t("hd.viewHostel")}
          </Link>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="card-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("booking.priceBreakdown")}</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">
              {formatMoney(reservation.pricePerNight, reservation.currency, locale)} × {reservation.nights}{" "}
              {t("booking.nights")}
            </span>
            <span className="font-semibold text-ink">
              {formatMoney(reservation.subtotal + reservation.discount, reservation.currency, locale)}
            </span>
          </div>
          {reservation.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>{t("booking.discount")}</span>
              <span>−{formatMoney(reservation.discount, reservation.currency, locale)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-soft">{t("booking.taxes")}</span>
            <span className="font-semibold text-ink">
              {formatMoney(reservation.taxes, reservation.currency, locale)}
            </span>
          </div>
          {reservation.fees > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-soft">{t("booking.cleaningFee")}</span>
              <span className="font-semibold text-ink">
                {formatMoney(reservation.fees, reservation.currency, locale)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-200 pt-3">
            <span className="font-bold text-ink">{t("booking.total")}</span>
            <span className="font-display text-lg font-extrabold text-ink">
              {formatMoney(reservation.total, reservation.currency, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card-surface p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <History className="h-5 w-5 text-accent" /> {t("account.overview")}
        </h2>
        <ol className="relative mt-5 space-y-5 before:absolute before:left-[7px] before:top-2 before:h-full before:w-px before:bg-slate-200">
          {reservation.history.map((h, i) => (
            <li key={h.id} className="relative pl-8">
              <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand shadow-soft" />
              <p className="text-sm font-semibold text-ink">{h.action.replace(/_/g, " ").toLowerCase()}</p>
              {h.detail && <p className="mt-0.5 text-xs text-ink-soft">{h.detail}</p>}
              <p className="mt-0.5 text-[11px] text-ink-soft">{fmtDate(h.createdAt, locale)}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}