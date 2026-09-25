"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { ROOM_TYPES } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RoomFilters({
  initial,
  cities,
}: {
  initial: { city?: string; roomType?: string; guests?: string; sort?: string };
  cities: string[];
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [city, setCity] = useState(initial.city ?? "all");
  const [roomType, setRoomType] = useState(initial.roomType ?? "any");
  const [guests, setGuests] = useState(initial.guests ?? "1");
  const [sort, setSort] = useState(initial.sort ?? "recommended");

  const push = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const current = initial as Record<string, string>;
    for (const [k, v] of Object.entries(current)) {
      if (v && !(k in overrides)) params.set(k, v);
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v && v !== "all" && v !== "any") params.set(k, v);
    }
    router.push(`/rooms?${params.toString()}`);
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city && city !== "all") params.set("city", city);
    if (roomType && roomType !== "any") params.set("roomType", roomType);
    if (guests) params.set("guests", guests);
    if (sort) params.set("sort", sort);
    router.push(`/rooms?${params.toString()}`);
  };

  const fieldCls = "h-11";
  const sortOptions = [
    { value: "recommended", label: t("common.recommended") },
    { value: "cheapest", label: t("common.cheapest") },
    { value: "price_desc", label: t("common.priceDesc") },
    { value: "best_rated", label: t("common.bestRated") },
  ];

  return (
    <form onSubmit={apply} className="card-surface grid gap-3 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">{t("filters.location")}</p>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className={fieldCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("hero.any")}</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">{t("filters.roomType")}</p>
        <Select value={roomType} onValueChange={setRoomType}>
          <SelectTrigger className={fieldCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("hero.any")}</SelectItem>
            {Object.keys(ROOM_TYPES).map((rt) => (
              <SelectItem key={rt} value={rt}>
                {t(`roomType.${rt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">{t("filters.guests")}</p>
        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger className={fieldCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}+ {t("common.guests")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-soft">{t("filters.sortBy")}</p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className={fieldCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark md:w-auto"
        >
          {t("common.apply")}
        </button>
      </div>
    </form>
  );
}