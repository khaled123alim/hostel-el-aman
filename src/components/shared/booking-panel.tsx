"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Users, CheckCircle2, XCircle, ArrowRight, BedDouble, Bath, Info } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

export interface BookingRoomOption {
  id: string;
  name: string;
  type: string;
  number: string;
  capacity: number;
  beds: number;
  bathroomType: string;
  priceLabel: string;
  available: boolean | null;
}

export function BookingPanel({
  rooms,
  checkIn: initialCheckIn,
  checkOut: initialCheckOut,
  guests: initialGuests,
}: {
  rooms: BookingRoomOption[];
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();

  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(initialGuests ?? "2");
  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);

  const submitDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasDates) return;
    const params = new URLSearchParams();
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
    params.set("guests", guests);
    router.push(`${pathname}?${params.toString()}`);
  };

  const roomHref = (roomId: string) => {
    if (!hasDates) return "#";
    const params = new URLSearchParams();
    params.set("room", roomId);
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
    params.set("guests", guests);
    return `/book/${pathname.split("/").pop()}?${params.toString()}`;
  };

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <div className="card-surface overflow-hidden lg:sticky lg:top-24">
      <div className="bg-brand px-5 py-4 text-white">
        <p className="font-display text-base font-bold">{t("hd.yourStay")}</p>
        <p className="mt-0.5 text-xs text-white/80">
          {locale === "ar" ? "اختر تواريخك للتحقق من التوفر" : locale === "fr" ? "Choisissez vos dates pour vérifier la disponibilité" : "Pick your dates to check availability"}
        </p>
      </div>

      <form onSubmit={submitDates} className="space-y-3 p-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.checkin")}</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <input
                type="date"
                value={checkIn}
                min={TODAY}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) setCheckOut("");
                }}
                className={cn(fieldCls, "pl-9")}
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.checkout")}</span>
            <span className="relative block">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
              <input
                type="date"
                value={checkOut}
                min={checkIn || TODAY}
                onChange={(e) => setCheckOut(e.target.value)}
                className={cn(fieldCls, "pl-9")}
              />
            </span>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.guestsTotal")}</span>
          <span className="relative block">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <select value={guests} onChange={(e) => setGuests(e.target.value)} className={cn(fieldCls, "pl-9")}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {t(n === 1 ? "common.guest" : "common.guests")}
                </option>
              ))}
            </select>
          </span>
        </label>

        <button
          type="submit"
          disabled={!hasDates}
          className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {hasDates ? t("booking.availableRooms") : (locale === "ar" ? "اختر التاريخين" : locale === "fr" ? "Sélectionnez vos dates" : "Select your dates")}
        </button>
      </form>

      <div className="space-y-3 border-t border-slate-100 px-5 py-5">
        {rooms.length === 0 && (
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-ink-soft">
            <Info className="h-4 w-4 shrink-0 text-accent" />
            {t("hd.noRooms")}
          </p>
        )}

        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-brand/40 hover:shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{room.name}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {t(`roomType.${room.type}`)} · #{room.number}
                </p>
              </div>
              <span className="text-xs font-medium text-ink-soft">{room.priceLabel}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-accent" /> {room.capacity}
              </span>
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 text-accent" /> {room.beds}
              </span>
              <span className="inline-flex items-center gap-1">
                <Bath className="h-3.5 w-3.5 text-accent" /> {t(`bath.${room.bathroomType}`)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              {room.available === null ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <Info className="h-3.5 w-3.5" />
                  {t("hd.selectDates")}
                </span>
              ) : room.available ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("hd.available")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                  <XCircle className="h-4 w-4" />
                  {t("hd.unavailable")}
                </span>
              )}

              {room.available !== false ? (
                <Link
                  href={roomHref(room.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition",
                    room.available ? "bg-brand hover:bg-brand-dark" : "bg-slate-400 hover:bg-slate-500"
                  )}
                  onClick={(e) => {
                    if (!hasDates) e.preventDefault();
                  }}
                >
                  {t("booking.confirmReservation")}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}