"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Users, CalendarDays, BedDouble } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

const ROOM_TYPES = ["", "DORMITORY", "PRIVATE", "DOUBLE", "TWIN", "TRIPLE", "FAMILY", "SUITE"];

export function SearchBox({ variant = "hero", destinations, initial }: { variant?: "hero" | "compact"; destinations?: string[]; initial?: { destination?: string; checkIn?: string; checkOut?: string; guests?: string; roomType?: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();

  const [destination, setDestination] = useState(initial?.destination ?? searchParams.get("destination") ?? "");
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? searchParams.get("checkIn") ?? TODAY);
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? searchParams.get("checkOut") ?? "");
  const [guests, setGuests] = useState(initial?.guests ?? searchParams.get("guests") ?? "2");
  const [roomType, setRoomType] = useState(initial?.roomType ?? searchParams.get("roomType") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guests);
    if (roomType) params.set("roomType", roomType);
    router.push(`/hostels?${params.toString()}`);
  };

  const field =
    "flex w-full items-center gap-3 rounded-xl border border-transparent bg-white px-4 py-3 focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10 transition";

  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-ink-soft";

  return (
    <form
      onSubmit={submit}
      className={cn(
        "w-full rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-lift backdrop-blur",
        variant === "compact" && "shadow-card"
      )}
    >
      <div className="grid gap-2 lg:grid-cols-5">
        <label className={field}>
          <MapPin className="h-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className={labelCls}>{t("hero.destination")}</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              list="hostel-destinations"
              placeholder={t("hero.destinationPh")}
              className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-slate-400"
            />
            <datalist id="hostel-destinations">
              {destinations?.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </span>
        </label>

        <label className={field}>
          <CalendarDays className="h-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className={labelCls}>{t("hero.checkin")}</span>
            <input
              type="date"
              value={checkIn}
              min={TODAY}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  const d = new Date(e.target.value + "T00:00:00");
                  d.setDate(d.getDate() + 1);
                  setCheckOut(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
                }
              }}
              className="w-full bg-transparent text-sm font-medium text-ink outline-none"
            />
          </span>
        </label>

        <label className={field}>
          <CalendarDays className="h-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className={labelCls}>{t("hero.checkout")}</span>
            <input
              type="date"
              value={checkOut}
              min={checkIn || TODAY}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-ink outline-none"
            />
          </span>
        </label>

        <label className={field}>
          <Users className="h-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className={labelCls}>{t("hero.guests")}</span>
            <select value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full bg-transparent text-sm font-medium text-ink outline-none">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} {t(n === 1 ? "common.guest" : "common.guests")}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className={field}>
          <BedDouble className="h-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className={labelCls}>{t("hero.roomType")}</span>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full bg-transparent text-sm font-medium text-ink outline-none">
              <option value="">{t("hero.any")}</option>
              {ROOM_TYPES.filter(Boolean).map((rt) => (
                <option key={rt} value={rt}>
                  {t(`roomType.${rt}`)}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>

      <button
        type="submit"
        className={cn(
          "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-white shadow-sm transition hover:bg-accent-dark active:scale-[0.99] lg:mt-3",
          variant === "hero" ? "h-12 text-base" : "h-10 text-sm"
        )}
      >
        <Search className="h-4 w-4" />
        {t("hero.search")}
      </button>
    </form>
  );
}