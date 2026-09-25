"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, BedDouble, Bath, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/providers/i18n-provider";

export interface RoomCardData {
  id: string;
  name: string;
  number: string;
  type: string;
  capacity: number;
  beds: number;
  bathroomType: string;
  bedType: string;
  price: number;
  currency: string;
  image: string;
  available: boolean;
}

export function RoomCard({ room, hostelSlug, priceLabel, bookingHref }: { room: RoomCardData; hostelSlug?: string; priceLabel?: string; bookingHref?: string }) {
  const { t, locale } = useI18n();
  const href = bookingHref ?? (hostelSlug ? `/hostels/${hostelSlug}?room=${room.id}` : "#");

  return (
    <div className="group card-surface flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={room.image || "/placeholder-room.jpg"}
          alt={room.name}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge variant="default" className="absolute left-4 top-4 capitalize bg-brand/90 backdrop-blur">
          {t(`roomType.${room.type}`)}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-ink">{room.name}</h3>
          <span className="text-xs font-medium text-ink-soft">#{room.number}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-accent" /> {room.capacity}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-accent" /> {room.beds} · {t(`bed.${room.bedType}`)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-accent" /> {t(`bath.${room.bathroomType}`)}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-ink-soft">{t("common.perNight")}</p>
            <p className="font-display text-xl font-extrabold text-ink">
              {priceLabel ?? `${room.price} ${room.currency}`}
            </p>
          </div>

          {room.available ? (
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-[0.98]"
            >
              {t("common.reserve")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          ) : (
            <Badge variant="neutral">{t("common.noBeds")}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}