"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, BedDouble } from "lucide-react";
import { RatingPill } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export interface HostelCardData {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  imageCover: string;
  description: string;
  ratingAvg: number;
  reviewCount: number;
  roomTypes: string[];
  minPrice: number;
  currency: string;
}

export function HostelCard({ hostel, priceLabel }: { hostel: HostelCardData; priceLabel?: string }) {
  const { t, locale } = useI18n();

  return (
    <Link
      href={`/hostels/${hostel.slug}`}
      className="group card-surface block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={hostel.imageCover}
          alt={hostel.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-70" />
        <div className="absolute left-4 top-4">
          <RatingPill value={hostel.ratingAvg} count={hostel.reviewCount} className="shadow-soft" />
        </div>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <p className="flex items-center gap-1.5 text-xs font-medium text-white/85">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            {hostel.city}, {hostel.country}
          </p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-ink transition-colors group-hover:text-brand line-clamp-1">
          {hostel.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{hostel.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {hostel.roomTypes.slice(0, 3).map((rt) => (
            <Badge key={rt} variant="neutral" className="capitalize">
              <BedDouble className="h-3 w-3" />
              {t(`roomType.${rt}`)}
            </Badge>
          ))}
          {hostel.roomTypes.length > 3 && <Badge variant="neutral">+{hostel.roomTypes.length - 3}</Badge>}
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-ink-soft">{t("common.from")}</p>
            <p className="font-display text-xl font-extrabold text-ink">
              {priceLabel ?? `${hostel.minPrice} ${hostel.currency}`}
              <span className="text-sm font-medium text-ink-soft"> / {t("common.night")}</span>
            </p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-all duration-300 group-hover:gap-2.5")}>
            {t("common.viewDetails")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HostelCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
        </div>
        <div className="skeleton h-6 w-32" />
      </div>
    </div>
  );
}