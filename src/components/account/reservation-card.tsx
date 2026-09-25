import Link from "next/link";
import { MapPin, BedDouble, CalendarDays, Users, ArrowRight } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { translateKey } from "@/lib/i18n";
import { fmtDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelReservationButton } from "@/components/account/cancel-button";

export interface ReservationCardData {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  total: number;
  currency: string;
  createdAt: string;
  hostel: { name: string; slug: string; city: string; country: string };
  room: { name: string; number: string; type: string };
}

export function ReservationCard({
  res,
  locale,
  withActions = false,
}: {
  res: ReservationCardData;
  locale: string;
  withActions?: boolean;
}) {
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);
  const canCancel = res.status === "PENDING" || res.status === "CONFIRMED";
  const hostelLink = `/hostels/${res.hostel.slug}`;

  return (
    <div className="card-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-bold text-ink">{res.hostel.name}</p>
            <StatusBadge status={res.status} label={t(`status.${res.status}`)} />
            <StatusBadge status={res.paymentStatus} label={t(`status.${res.paymentStatus}`)} />
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            {res.hostel.city}, {res.hostel.country} · {res.number}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="font-display text-lg font-extrabold text-ink">{formatMoney(res.total, res.currency, locale)}</p>
          <p className="text-xs text-ink-soft">
            {res.nights} {t("booking.nights")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <span className="block">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            <CalendarDays className="h-3.5 w-3.5 text-accent" /> {t("booking.checkin")}
          </span>
          <span className="mt-1 block font-semibold text-ink">{fmtDate(new Date(res.checkIn), locale)}</span>
        </span>
        <span className="block">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            <CalendarDays className="h-3.5 w-3.5 text-accent" /> {t("booking.checkout")}
          </span>
          <span className="mt-1 block font-semibold text-ink">{fmtDate(new Date(res.checkOut), locale)}</span>
        </span>
        <span className="block">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            <BedDouble className="h-3.5 w-3.5 text-accent" /> {t("booking.room")}
          </span>
          <span className="mt-1 block font-semibold text-ink">
            {res.room.name} · #{res.room.number} ·{" "}
            <span className="font-normal text-ink-soft">
              {res.guests} {t("common.guests")}
            </span>
          </span>
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {canCancel && withActions && (
            <CancelReservationButton reservationId={res.id} />
          )}
          <Link
            href={`/account/reservations/${res.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:bg-slate-50"
          >
            {t("booking.step4")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
        <Link href={hostelLink} className="text-xs font-semibold text-brand transition hover:text-brand-dark">
          {t("hd.viewHostel") ?? "View hostel"}
        </Link>
      </div>
    </div>
  );
}