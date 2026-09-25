"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  Bath,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Home,
  CalendarDays,
  Tag,
  AlertTriangle,
  PartyPopper,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { DateRangeCalendar } from "@/components/booking/date-range-calendar";
import type { BookingRoomOption } from "@/components/shared/booking-panel";

interface WizardUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  country?: string | null;
}

interface PriceBreakdown {
  nights: number;
  subtotal: number;
  taxes: number;
  taxesRate: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  pricePerNight: number;
  available?: boolean;
}

interface QuoteResult {
  available: boolean;
  blockedDates?: string[];
  price?: PriceBreakdown;
}

type Step = 0 | 1 | 2 | 3;

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

export function BookingWizard({
  hostel,
  rooms,
  initial,
  user,
  currency,
}: {
  hostel: { id: string; name: string; checkInTime: string; checkOutTime: string };
  rooms: BookingRoomOption[];
  initial: { roomId?: string; checkIn: string; checkOut: string; guests: string };
  user: WizardUser;
  currency: string;
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const clamp = (n: number) => Math.max(1, Math.min(8, isNaN(n) ? 2 : n));
  const clampGuests = clamp;

  const [step, setStep] = useState<Step>(0);
  const [checkIn, setCheckIn] = useState(initial.checkIn ?? "");
  const [checkOut, setCheckOut] = useState(initial.checkOut ?? "");
  const [roomId, setRoomId] = useState(initial.roomId ?? "");
  const [guestsCount, setGuestsCount] = useState(() => clampGuests(parseInt(initial.guests, 10)));
  const [lead, setLead] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    country: user.country ?? "",
  });
  const [guestRows, setGuestRows] = useState<{ fullName: string; age: string }[]>(() =>
    Array.from({ length: clampGuests(parseInt(initial.guests, 10)) }, () => ({ fullName: "", age: "" }))
  );
  const [specialRequests, setSpecialRequests] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; number: string } | null>(null);
  const [roomAvailable, setRoomAvailable] = useState<Record<string, boolean | null>>(() =>
    Object.fromEntries(rooms.map((r) => [r.id, r.available ?? null]))
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === roomId) ?? null, [rooms, roomId]);
  const nights = hasDates ? nightsBetween(checkIn, checkOut) : 0;

  const refreshAvailability = useCallback(async () => {
    if (!hasDates || rooms.length === 0) return;
    setAvailabilityLoading(true);
    const entries = await Promise.all(
      rooms.map(async (room) => {
        try {
          const res = await fetch("/api/reservations/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hostelId: hostel.id,
              roomId: room.id,
              checkIn,
              checkOut,
              guests: guestsCount,
              rooms: 1,
              currency,
            }),
          });
          const json = await res.json();
          return [room.id, json.available === true] as const;
        } catch {
          return [room.id, true] as const;
        }
      })
    );
    setRoomAvailable(Object.fromEntries(entries));
    setAvailabilityLoading(false);
  }, [rooms, hasDates, checkIn, checkOut, guestsCount, hostel.id, currency]);

  const loadQuote = useCallback(
    async (promo?: string) => {
      if (!roomId || !hasDates) return;
      setQuoteLoading(true);
      try {
        const res = await fetch("/api/reservations/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostelId: hostel.id,
            roomId,
            checkIn,
            checkOut,
            guests: guestsCount,
            rooms: 1,
            promoCode: promo?.trim() || undefined,
            currency,
          }),
        });
        const json = await res.json();
        setQuote(json);
        if (!json.ok || json.available === false) {
          toast({ title: t("booking.roomUnavailable"), variant: "error" });
        }
      } catch {
        toast({ title: t("errors.generic"), variant: "error" });
      } finally {
        setQuoteLoading(false);
      }
    },
    [roomId, hasDates, checkIn, checkOut, guestsCount, hostel.id, currency, t, toast]
  );

  useEffect(() => {
    if (step === 3) {
      loadQuote(promoCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === 1) {
      refreshAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const submitReservation = async () => {
    if (!selectedRoom || !hasDates) return;
    setSubmitting(true);
    const guestNames = guestRows
      .filter((g) => g.fullName.trim().length > 0)
      .map((g) => ({
        fullName: g.fullName.trim(),
        age: g.age ? parseInt(g.age, 10) : null,
      }));
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostelId: hostel.id,
          roomId,
          checkIn,
          checkOut,
          guests: guestsCount,
          rooms: 1,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          country: lead.country,
          specialRequests,
          paymentMethod: "PAY_AT_HOSTEL",
          promoCode: promoCode.trim() || undefined,
          guestNames,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setDone(json.reservation);
      } else {
        toast({ title: json.error ?? t("errors.generic"), variant: "error" });
      }
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft";

  if (done) {
    return (
      <div className="card-surface mx-auto max-w-lg p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <PartyPopper className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="heading-xl mt-5">{t("booking.thanks")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("booking.confirmationMessage")}</p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {t("booking.reservationNumber")} · {done.number}
        </p>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("booking.payAtHostelNote")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/account/reservations/${done.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            {t("booking.step4")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <Link
            href="/account/reservations"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-ink transition hover:bg-slate-50"
          >
            {locale === "ar" ? "حجوزاتي" : locale === "fr" ? "Mes réservations" : "My reservations"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        {/* Stepper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: 0, label: t("booking.dates") },
            { key: 1, label: t("booking.step1") },
            { key: 2, label: t("booking.step2") },
            { key: 3, label: t("booking.reviewAndConfirm") },
          ].map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              {s.key > 0 && <span className="h-px w-6 shrink-0 bg-slate-200" />}
              <span
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold",
                  step === s.key
                    ? "bg-brand text-ink"
                    : step > s.key
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-ink-soft"
                )}
              >
                {step > s.key ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px]">{s.key + 1}</span>}
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 0 — dates */}
        {step === 0 && (
          <div className="card-surface p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-subtle">
                <CalendarDays className="h-5 w-5 text-accent" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">{t("booking.pickDates")}</h2>
                <p className="mt-1 text-sm text-ink-soft">{t("booking.pickDatesSub")}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_230px]">
              <DateRangeCalendar
                checkIn={checkIn}
                checkOut={checkOut}
                minDate={TODAY}
                onChange={(inDate, outDate) => {
                  setCheckIn(inDate);
                  setCheckOut(outDate);
                  setQuote(null);
                }}
              />

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
                    <CalendarDays className="h-3.5 w-3.5 text-accent" /> {t("booking.checkin")}
                  </p>
                  <p className={cn("mt-1 text-sm font-semibold", checkIn ? "text-ink" : "text-ink-soft")}>
                    {checkIn ? displayDate(checkIn, locale) : t("booking.selectCheckInFirst")}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-soft">{hostel.checkInTime}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">
                    <CalendarDays className="h-3.5 w-3.5 text-accent" /> {t("booking.checkout")}
                  </p>
                  <p className={cn("mt-1 text-sm font-semibold", checkOut ? "text-ink" : "text-ink-soft")}>
                    {checkOut ? displayDate(checkOut, locale) : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-soft">{hostel.checkOutTime}</p>
                </div>

                {hasDates && (
                  <div className="flex items-center justify-between rounded-xl bg-brand-subtle px-4 py-3">
                    <p className="text-sm font-semibold text-accent-dark">
                      {nights} {t(nights === 1 ? "booking.night" : "booking.nights")}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckIn("");
                        setCheckOut("");
                        setQuote(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t("booking.clearDates")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              {hasDates && (
                <p className="mr-auto inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  {nights} {t(nights === 1 ? "booking.night" : "booking.nights")} · {checkIn} → {checkOut}
                </p>
              )}
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={!hasDates}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("booking.continue")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — room selection */}
        {step === 1 && (
          <div className="card-surface p-6">
            <h2 className="font-display text-lg font-bold">{t("booking.selectRoom")}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {hostel.name} · {displayDate(checkIn, locale)} → {displayDate(checkOut, locale)} · {nights}{" "}
              {t(nights === 1 ? "booking.night" : "booking.nights")}
            </p>
            {availabilityLoading && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-ink-soft">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" /> {t("booking.lookingUp")}
              </p>
            )}
            <div className="mt-5 space-y-3">
              {rooms.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-ink-soft">{t("hd.noRooms")}</p>
              )}
              {rooms.map((room) => {
                const availability = roomAvailable[room.id];
                const unavailable = hasDates && availability === false;
                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => {
                      setRoomId(room.id);
                      setQuote(null);
                      setStep(2);
                    }}
                    className={cn(
                      "w-full rounded-2xl border p-5 text-left transition",
                      room.id === roomId
                        ? "border-brand bg-brand-subtle ring-4 ring-brand/10"
                        : "border-slate-200 hover:border-brand/40",
                      unavailable && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {room.name} <span className="text-xs font-normal text-ink-soft">· #{room.number}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-ink-soft">{t(`roomType.${room.type}`)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-sm font-bold text-ink">{room.priceLabel}</p>
                        <p className="text-[11px] text-ink-soft">{t("booking.ratePerNight")}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-accent" /> {room.capacity}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3.5 w-3.5 text-accent" /> {room.beds}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bath className="h-3.5 w-3.5 text-accent" /> {t(`bath.${room.bathroomType}`)}
                      </span>
                      {unavailable && (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <AlertTriangle className="h-3.5 w-3.5" /> {t("booking.roomUnavailable")}
                        </span>
                      )}
                      {hasDates && availability === true && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("hd.available")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-ink transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("common.back")}
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — guest info */}
        {step === 2 && (
          <div className="card-surface space-y-5 p-6">
            <div>
              <h2 className="font-display text-lg font-bold">{t("booking.guestInfo")}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t("booking.leadGuest")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>{t("auth.firstName")}</span>
                <input
                  value={lead.firstName}
                  onChange={(e) => setLead({ ...lead, firstName: e.target.value })}
                  required
                  minLength={2}
                  maxLength={60}
                  className={fieldCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>{t("auth.lastName")}</span>
                <input
                  value={lead.lastName}
                  onChange={(e) => setLead({ ...lead, lastName: e.target.value })}
                  required
                  minLength={2}
                  maxLength={60}
                  className={fieldCls}
                />
              </label>
            </div>
            <label className="block">
              <span className={labelCls}>{t("auth.email")}</span>
              <input
                value={lead.email}
                onChange={(e) => setLead({ ...lead, email: e.target.value })}
                type="email"
                required
                maxLength={120}
                className={fieldCls}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>{t("auth.phone")}</span>
                <input
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  maxLength={30}
                  className={fieldCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>{t("auth.country")}</span>
                <input
                  value={lead.country}
                  onChange={(e) => setLead({ ...lead, country: e.target.value })}
                  maxLength={60}
                  className={fieldCls}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">
                  {t("booking.guestNames")} ({guestsCount})
                </p>
                <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                  {t("booking.guestsTotal")}
                  <select
                    value={guestsCount}
                    onChange={(e) => {
                      const n = clamp(parseInt(e.target.value, 10));
                      setGuestsCount(n);
                      setGuestRows((prev) =>
                        Array.from({ length: n }, (_, i) => prev[i] ?? { fullName: "", age: "" })
                      );
                    }}
                    className={cn(fieldCls, "w-20 !px-2 py-1.5")}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 space-y-3">
                {guestRows.map((row, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                      {i + 1}
                    </span>
                    <input
                      value={row.fullName}
                      onChange={(e) =>
                        setGuestRows((prev) => prev.map((r, j) => (j === i ? { ...r, fullName: e.target.value } : r)))
                      }
                      placeholder={t("booking.fullName")}
                      maxLength={120}
                      className={cn(fieldCls, "flex-1 min-w-40")}
                    />
                    <input
                      value={row.age}
                      onChange={(e) =>
                        setGuestRows((prev) => prev.map((r, j) => (j === i ? { ...r, age: e.target.value } : r)))
                      }
                      type="number"
                      min={0}
                      max={120}
                      placeholder={t("booking.age")}
                      className={cn(fieldCls, "w-24")}
                    />
                  </div>
                ))}
              </div>
            </div>

            <label className="block">
              <span className={labelCls}>{t("booking.specialRequests")}</span>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={t("booking.specialRequestsPh")}
                className={fieldCls}
              />
            </label>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-ink transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("common.back")}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!selectedRoom}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("booking.continue")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — review & confirm */}
        {step === 3 && (
          <div className="card-surface space-y-5 p-6">
            <div>
              <h2 className="font-display text-lg font-bold">{t("booking.reviewAndConfirm")}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t("booking.payAtHostelDesc")}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{selectedRoom?.name}</p>
                  <p className="text-xs text-ink-soft">
                    {t(`roomType.${selectedRoom?.type}`)} · #{selectedRoom?.number}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  {t("booking.editDates")}
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="flex items-center gap-1 text-xs font-medium text-ink-soft">
                    <CalendarDays className="h-3.5 w-3.5" /> {t("booking.checkin")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{checkIn}</p>
                  <p className="text-[11px] text-ink-soft">{hostel.checkInTime}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs font-medium text-ink-soft">
                    <CalendarDays className="h-3.5 w-3.5" /> {t("booking.checkout")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{checkOut}</p>
                  <p className="text-[11px] text-ink-soft">{hostel.checkOutTime}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs font-medium text-ink-soft">
                    <Users className="h-3.5 w-3.5" /> {t("booking.guestsTotal")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {guestsCount} {t(guestsCount === 1 ? "common.guest" : "common.guests")}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {nights} {t(nights === 1 ? "booking.night" : "booking.nights")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="mt-4 inline-flex items-center gap-1 border-t border-slate-100 pt-4 text-xs font-semibold text-brand hover:text-brand-dark"
              >
                <CalendarDays className="h-3.5 w-3.5" /> {t("booking.pickDates")}
              </button>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.leadGuest")}</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {lead.firstName} {lead.lastName} · {lead.email}
                </p>
              </div>
            </div>

            {hasDates && roomAvailable[selectedRoom?.id ?? ""] === false && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertTriangle className="mr-1 inline h-4 w-4" /> {t("booking.roomUnavailable")}
              </p>
            )}

            <div className="rounded-2xl border border-slate-200 p-1.5">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5">
                <Tag className="h-4 w-4 shrink-0 text-accent" />
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={t("booking.promoCode")}
                  maxLength={30}
                  className="w-full bg-transparent px-1 py-1.5 text-sm font-semibold uppercase text-ink outline-none placeholder:normal-case placeholder:font-normal placeholder:text-ink-soft"
                />
                <button
                  type="button"
                  onClick={() => loadQuote(promoCode)}
                  className="shrink-0 rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                >
                  {t("booking.apply")}
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
              {quoteLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin text-brand" /> {t("booking.lookingUp")}
                </div>
              ) : quote?.price ? (
                <PriceSummary price={quote.price} nights={nights} locale={locale} />
              ) : (
                <p className="py-1 text-sm text-ink-soft">{t("booking.lookingUp")}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-ink transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("common.back")}
              </button>
              <button
                type="button"
                onClick={submitReservation}
                disabled={submitting || quoteLoading || quote?.available === false}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {t("booking.confirmReservation")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary sidebar */}
      <aside className="space-y-4">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-display font-bold text-ink">{hostel.name}</p>
              <p className="text-xs text-ink-soft">{t("booking.yourStay")}</p>
            </div>
            <Home className="h-5 w-5 text-brand" />
          </div>

          {hasDates ? (
            <div className="mt-4 space-y-2.5 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-soft">{t("booking.checkin")}</span>
                <span className="font-semibold text-ink">{displayDate(checkIn, locale)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-soft">{t("booking.checkout")}</span>
                <span className="font-semibold text-ink">{displayDate(checkOut, locale)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-soft">{t("booking.nights")}</span>
                <span className="font-semibold text-ink">
                  {nights} {t(nights === 1 ? "booking.night" : "booking.nights")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-dark"
              >
                <CalendarDays className="h-3.5 w-3.5" /> {t("booking.editDates")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-4 w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-ink-soft transition hover:border-brand/40 hover:text-brand"
            >
              <CalendarDays className="mr-1.5 inline h-4 w-4" /> {t("booking.pickDates")}
            </button>
          )}
        </div>

        {step >= 1 && selectedRoom && (
          <div className="card-surface p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">{t("booking.room")}</p>
            <p className="mt-1 text-sm font-semibold text-ink">{selectedRoom.name}</p>
            <p className="text-xs text-ink-soft">
              {t(`roomType.${selectedRoom.type}`)} · {selectedRoom.priceLabel}
            </p>
          </div>
        )}

        <div className="card-surface p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
            <Home className="h-4 w-4 text-accent" /> {t("booking.youPayAtHostel")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("booking.payAtHostelNote")}</p>
        </div>
      </aside>
    </div>
  );
}

function PriceSummary({
  price,
  nights,
  locale,
}: {
  price: PriceBreakdown;
  nights: number;
  locale: string;
}) {
  const { t } = useI18n();
  const f = (n: number) => formatMoney(n, price.currency, locale);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-ink-soft">
          {f(price.pricePerNight)} × {nights} {t("booking.nights")}
        </span>
        <span className="font-semibold text-ink">{f(price.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ink-soft">
          {t("booking.taxes")} ({price.taxesRate}%)
        </span>
        <span className="font-semibold text-ink">{f(price.taxes)}</span>
      </div>
      {price.fees > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">{t("booking.cleaningFee")}</span>
          <span className="font-semibold text-ink">{f(price.fees)}</span>
        </div>
      )}
      {price.discount > 0 && (
        <div className="flex items-center justify-between text-emerald-600">
          <span className="font-medium">{t("booking.discount")}</span>
          <span className="font-semibold">−{f(price.discount)}</span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
        <span className="font-bold text-ink">{t("booking.total")}</span>
        <span className="font-display text-xl font-extrabold text-ink">{f(price.total)}</span>
      </div>
    </div>
  );
}