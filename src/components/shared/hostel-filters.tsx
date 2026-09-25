"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, MapPin, Users, BedDouble, X } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { ROOM_TYPES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface HostelFilterValue {
  destination?: string;
  guests?: string;
  roomType?: string;
  sort?: string;
  minRating?: string;
  maxPrice?: string;
  ensuite?: string;
  privateRoom?: string;
  sharedRoom?: string;
  wifi?: string;
  ac?: string;
  parking?: string;
  breakfast?: string;
  checkIn?: string;
  checkOut?: string;
}

interface HostelFiltersProps {
  initial: HostelFilterValue;
  destinations: string[];
  currency: string;
  resultCount: number;
}

const BOOLEAN_KEYS = [
  "ensuite",
  "privateRoom",
  "sharedRoom",
  "wifi",
  "ac",
  "parking",
  "breakfast",
] as const;

export function HostelFilters({ initial, destinations, currency, resultCount }: HostelFiltersProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);

  const [destination, setDestination] = useState(initial.destination ?? "");
  const [guests, setGuests] = useState(initial.guests ?? "2");
  const [roomType, setRoomType] = useState(initial.roomType ?? "any");
  const [minRating, setMinRating] = useState(initial.minRating ?? "any");
  const [maxPrice, setMaxPrice] = useState(Number(initial.maxPrice ?? 0));
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const k of BOOLEAN_KEYS) out[k] = initial[k] === "1";
    return out;
  });

  const push = (overrides?: Record<string, string>) => {
    const params = new URLSearchParams();
    const current = initial as Record<string, string>;
    for (const [k, v] of Object.entries(current)) {
      if (v && !(overrides && k in overrides)) params.set(k, v);
    }
    if (overrides) {
      for (const [k, v] of Object.entries(overrides)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
    }
    dropEmpty(params);
    router.push(`/hostels?${params.toString()}`);
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const overrides: Record<string, string> = {
      destination,
      guests,
      roomType: roomType === "any" ? "" : roomType,
      minRating: minRating === "any" ? "" : minRating,
      maxPrice: maxPrice > 0 ? String(maxPrice) : "",
    };
    for (const k of BOOLEAN_KEYS) overrides[k] = toggles[k] ? "1" : "";
    push(overrides);
  };

  const clearAll = () => {
    setDestination("");
    setGuests("2");
    setRoomType("any");
    setMinRating("any");
    setMaxPrice(0);
    setToggles(Object.fromEntries(BOOLEAN_KEYS.map((k) => [k, false])));
    push({ destination: "", guests: "2" });
  };

  const toggle = (k: string) => setToggles((prev) => ({ ...prev, [k]: !prev[k] }));

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  const checkboxRowCls =
    "flex items-center gap-2.5 rounded-lg px-1.5 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 cursor-pointer select-none";

  const filtersEl = (
    <form onSubmit={apply} className="space-y-6">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
          {t("filters.location")}
        </label>
        <div className="relative mt-2">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            list="hostels-destinations"
            placeholder={t("hero.destinationPh")}
            className={cn(fieldCls, "pl-9")}
          />
          <datalist id="hostels-destinations">
            {destinations.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
            {t("filters.guests")}
          </label>
          <div className="relative mt-2">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <select value={guests} onChange={(e) => setGuests(e.target.value)} className={cn(fieldCls, "pl-9")}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
            {t("filters.roomType")}
          </label>
          <div className="relative mt-2">
            <BedDouble className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className={cn(fieldCls, "pl-9")}>
              <option value="any">{t("hero.any")}</option>
              {Object.keys(ROOM_TYPES).map((rt) => (
                <option key={rt} value={rt}>
                  {t(`roomType.${rt}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-soft">
          <span>{t("filters.priceRange")}</span>
          {maxPrice > 0 && <span className="text-brand">{maxPrice} {currency}</span>}
        </label>
        <input
          type="range"
          min={0}
          max={200}
          step={5}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--brand-rgb)]"
          style={{ accentColor: "rgb(var(--brand-rgb))" }}
          aria-label={t("filters.priceRange")}
        />
        <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
          <span>0</span><span>200</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
          {t("filters.rating")}
        </label>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className={cn(fieldCls, "mt-2")}>
          <option value="any">{t("hero.any")}</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
          <option value="45">4.5+</option>
        </select>
      </div>

      <div>
        <p className="block text-xs font-bold uppercase tracking-wider text-ink-soft"> {t("common.amenities")}</p>
        <div className="mt-1 space-y-0.5">
          {[
            { k: "privateRoom", label: t("filters.privateRoom") },
            { k: "sharedRoom", label: t("filters.sharedRoom") },
            { k: "ensuite", label: t("filters.ensuite") },
            { k: "wifi", label: t("filters.wifi") },
            { k: "ac", label: t("filters.ac") },
            { k: "parking", label: t("filters.parking") },
            { k: "breakfast", label: t("filters.breakfast") },
          ].map(({ k, label }) => (
            <label key={k} className={checkboxRowCls}>
              <input
                type="checkbox"
                checked={toggles[k] ?? false}
                onChange={() => toggle(k)}
                className="h-4 w-4 rounded-md border-slate-300 text-brand accent-[var(--brand-rgb)]"
                style={{ accentColor: "rgb(var(--brand-rgb))" }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2.5 pt-1">
        <button type="submit" className="flex-1 rounded-xl bg-brand font-semibold text-white py-2.5 transition hover:bg-brand-dark">
          {t("filters.apply")}
        </button>
        <button type="button" onClick={clearAll} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-slate-50">
          {t("filters.clearAll")}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-ink lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t("filters.filters")}
        <X className={cn("h-4 w-4 transition-transform", open ? "rotate-0" : "rotate-45")} />
      </button>

      <div className={cn("card-surface p-5 lg:sticky lg:top-24", open ? "block" : "hidden lg:block")}>
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="font-display text-base font-bold">{t("filters.filters")}</p>
          <span className="text-sm font-semibold text-brand">{resultCount} {t("common.results")}</span>
        </div>
        {filtersEl}
      </div>
    </div>
  );
}

export function HostelSortBar({ initial, resultCount }: { initial: HostelFilterValue; resultCount: number }) {
  const router = useRouter();
  const { t } = useI18n();
  const options = [
    { value: "recommended", label: t("common.recommended") },
    { value: "cheapest", label: t("common.cheapest") },
    { value: "price_desc", label: t("common.priceDesc") },
    { value: "best_rated", label: t("common.bestRated") },
  ];

  const push = (overrides?: Record<string, string>) => {
    const params = new URLSearchParams();
    const current = initial as Record<string, string>;
    for (const [k, v] of Object.entries(current)) {
      if (v && !(overrides && k in overrides)) params.set(k, v);
    }
    if (overrides) {
      for (const [k, v] of Object.entries(overrides)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
    }
    dropEmpty(params);
    router.push(`/hostels?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-soft">
        <strong className="font-semibold text-ink">{resultCount}</strong> {t("common.results")}
      </p>
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        <span className="hidden sm:inline">{t("filters.sortBy")}:</span>
        <Select value={initial.sort ?? "recommended"} onValueChange={(v) => push({ sort: v })}>
          <SelectTrigger className="h-9 w-[190px] rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function dropEmpty(params: URLSearchParams) {
  for (const key of [...params.keys()]) {
    if (!params.get(key)) params.delete(key);
  }
}