"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BedDouble,
  Users,
  ShowerHead,
  Wifi,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { DateRangeCalendar } from "@/components/booking/date-range-calendar";
import { IMG } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface RoomsBookerRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  beds: number;
  bathroomType: string;
  priceLabel: string;
  images: unknown;
  description: string;
}

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

function displayDate(value: string, locale: string): string {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function RoomsBooker({
  hostelId,
  slug,
  rooms,
}: {
  hostelId: string;
  slug: string;
  rooms: RoomsBookerRoom[];
}) {
  const { t, locale } = useI18n();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [booking, setBooking] = useState(false);
  const [openBar, setOpenBar] = useState(false);
  const [roomAvailable, setRoomAvailable] = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(rooms.map((r) => [r.id, null]))
  );
  const reqRef = useRef(0);

  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);
  const nights = hasDates ? nightsBetween(checkIn, checkOut) : 0;

  const checkAvailability = useCallback(async () => {
    if (!hasDates || rooms.length === 0) return;
    const myReq = ++reqRef.current;
    setBooking(true);
    setRoomAvailable(Object.fromEntries(rooms.map((r) => [r.id, null])));
    const entries = await Promise.all(
      rooms.map(async (room) => {
        try {
          const res = await fetch("/api/reservations/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hostelId,
              roomId: room.id,
              checkIn,
              checkOut,
              guests,
              rooms: 1,
            }),
          });
          const json = await res.json();
          return [room.id, json.available === true] as const;
        } catch {
          return [room.id, true] as const;
        }
      })
    );
    if (myReq !== reqRef.current) return;
    setRoomAvailable(Object.fromEntries(entries));
    setBooking(false);
  }, [hasDates, rooms, hostelId, checkIn, checkOut, guests]);

  useEffect(() => {
    if (hasDates) checkAvailability();
  }, [hasDates, checkAvailability]);

  const roomHref = useCallback(
    (roomId: string) => {
      if (!hasDates) return `/book/${slug}?room=${roomId}`;
      const params = new URLSearchParams();
      params.set("room", roomId);
      params.set("checkIn", checkIn);
      params.set("checkOut", checkOut);
      params.set("guests", String(guests));
      return `/book/${slug}?${params.toString()}`;
    },
    [slug, hasDates, checkIn, checkOut, guests]
  );

  const allBlocked = useMemo(
    () => rooms.length > 0 && Object.values(roomAvailable).every((v) => v === false),
    [rooms, roomAvailable]
  );

  return (
    <div className="container-x mt-10">
      {/* Booking bar */}
      <div className="card-surface overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenBar((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F9EBA8]">
              <CalendarDays className="h-5 w-5 text-[#C1811C]" />
            </span>
            <div>
              <p className="font-display font-bold text-[#020101]">{t("booking.pickDates")}</p>
              <p className="text-xs text-ink-soft">
                {hasDates
                  ? `${displayDate(checkIn, locale)} → ${displayDate(checkOut, locale)} · ${nights} ${t(
                      nights === 1 ? "booking.night" : "booking.nights"
                    )}`
                  : t("booking.pickDatesSub")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-accent-dark">
            <CalendarDays className="h-4 w-4" />
            {hasDates ? t("booking.editDates") : t("booking.continue")}
          </span>
        </button>

        {openBar && (
          <div className="border-t border-slate-200/70 p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
              <DateRangeCalendar
                checkIn={checkIn}
                checkOut={checkOut}
                minDate={TODAY}
                onChange={(inDate, outDate) => {
                  setCheckIn(inDate);
                  setCheckOut(outDate);
                  setRoomAvailable(Object.fromEntries(rooms.map((r) => [r.id, null])));
                }}
              />
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.checkin")}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{checkIn ? displayDate(checkIn, locale) : "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.checkout")}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{checkOut ? displayDate(checkOut, locale) : "—"}</p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    {t("booking.guestsTotal")}
                  </span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {t(n === 1 ? "common.guest" : "common.guests")}
                      </option>
                    ))}
                  </select>
                </label>
                {hasDates ? (
                  <Link
                    href={`/book/${slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
                  >
                    {t("booking.availableRooms")}
                  </Link>
                ) : (
                  <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-ink-soft">
                    {t("booking.selectCheckInFirst")}
                  </span>
                )}
                {hasDates && (
                  <button
                    type="button"
                    onClick={() => {
                      setCheckIn("");
                      setCheckOut("");
                      setRoomAvailable(Object.fromEntries(rooms.map((r) => [r.id, null])));
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft transition hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t("booking.clearDates")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rooms grid */}
      <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room, i) => {
          const availability = hasDates ? roomAvailable[room.id] : null;
          const unavailable = availability === false;
          return (
            <Reveal key={room.id} delay={(i % 3) * 90}>
              <div
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-3xl border bg-white shadow-[0_1px_3px_rgba(2,1,1,0.08),0_14px_36px_rgba(2,1,1,0.07)] transition-all duration-300",
                  unavailable ? "opacity-60" : "hover:-translate-y-1.5"
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={Array.isArray(room.images) && room.images[0] ? String(room.images[0]) : IMG.rooms[0]}
                    alt={room.name}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020101]/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#F4C24B] px-3 py-1 text-xs font-bold text-[#020101]">
                    <Users className="h-3.5 w-3.5" /> Up to {room.capacity}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-[#020101]">{room.name}</h2>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#020101]/55">
                    <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {room.beds} bed{room.beds > 1 ? "s" : ""}</span>
                    <span className="inline-flex items-center gap-1"><ShowerHead className="h-3.5 w-3.5" /> {room.bathroomType.toLowerCase()} bath</span>
                    <span className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> Free Wi-Fi</span>
                  </p>
                  <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-[#020101]/60">{room.description}</p>

                  <div className="mt-4">
                    {hasDates && availability === null && booking && (
                      <p className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C1811C]" /> {t("booking.lookingUp")}
                      </p>
                    )}
                    {hasDates && availability === true && (
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> {t("hd.available")}
                      </p>
                    )}
                    {unavailable && (
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <XCircle className="h-4 w-4" /> {t("hd.unavailable")} — {t("booking.roomUnavailable")}
                      </p>
                    )}
                    {!hasDates && (
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C1811C]">
                        <CalendarDays className="h-3.5 w-3.5" /> {t("booking.selectCheckInFirst")}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#020101]/8 pt-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C1811C]">per night</p>
                      <p className="font-display text-2xl font-extrabold text-[#020101]" dir="ltr">
                        {room.priceLabel}
                      </p>
                    </div>
                    {unavailable ? (
                      <Button size="sm" disabled>
                        {t("hd.unavailable")}
                      </Button>
                    ) : (
                      <Button asChild size="sm">
                        <Link href={roomHref(room.id)}>
                          Book <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>

      {allBlocked && (
        <div className="card-surface mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <XCircle className="h-4 w-4 shrink-0 text-rose-600" /> {t("booking.noAvailability")}
          </p>
          <Button asChild variant="subtle" size="sm">
            <Link href={`/book/${slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}>
              <CalendarDays className="h-4 w-4" /> {t("booking.editDates")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}