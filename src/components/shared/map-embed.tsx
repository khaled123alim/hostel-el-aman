"use client";

import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Interactive map embed. Uses OpenStreetMap by default (no API key required).
 * To use Mapbox or Google Maps, set MAP_PROVIDER + the matching token in .env
 * and update the URL construction below — the component itself stays the same.
 */
export function MapEmbed({
  lat,
  lon,
  name,
  address,
  className,
}: {
  lat?: number | null;
  lon?: number | null;
  name?: string;
  address?: string;
  className?: string;
}) {
  if (lat == null || lon == null) {
    return (
      <div className={cn("flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 text-center", className)}>
        <MapPin className="h-8 w-8 text-slate-400" />
        <p className="text-sm text-ink-soft">Location unavailable</p>
      </div>
    );
  }

  const provider = process.env.NEXT_PUBLIC_MAP_PROVIDER ?? process.env.MAP_PROVIDER ?? "osm";

  if (provider === "mapbox") {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? process.env.MAPBOX_TOKEN;
    const url = token
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+ee8b0c(${lon},${lat})/${lon},${lat},15,0/800x400?access_token=${token}`
      : null;
    if (url) {
      return (
        <div className={cn("overflow-hidden rounded-2xl", className)}>
          <img src={url} alt={name ?? "Map"} className="h-full min-h-[260px] w-full object-cover" />
        </div>
      );
    }
  }

  if (provider === "google") {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? process.env.GOOGLE_MAPS_KEY;
    if (key) {
      // Google Maps requires the Maps Embed/JS API; approximate with a static image when no key is set.
      return (
        <div className={cn("overflow-hidden rounded-2xl", className)}>
          <iframe
            title={name ?? "Map"}
            width="100%"
            height="300"
            style={{ border: 0, minHeight: 260 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${lat},${lon}&z=15&output=embed&key=${key}`}
          />
        </div>
      );
    }
  }

  // default: OpenStreetMap embed
  const bbox = `${lon - 0.025},${lat - 0.015},${lon + 0.025},${lat + 0.015}`;
  return (
    <div className={cn("map-frame relative min-h-[260px] overflow-hidden rounded-2xl", className)}>
      <iframe
        title={name ?? "Map"}
        width="100%"
        height="300"
        loading="lazy"
        className="min-h-[260px]"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`}
      />
      {address && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-xl bg-white/90 px-3.5 py-2.5 shadow-soft backdrop-blur">
          <MapPin className="h-4 w-4 shrink-0 text-accent" />
          <p className="truncate text-xs font-medium text-ink">{address}</p>
        </div>
      )}
    </div>
  );
}