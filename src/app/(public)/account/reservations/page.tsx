import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { ReservationCard, type ReservationCardData } from "@/components/account/reservation-card";

export const dynamic = "force-dynamic";

export default async function AccountReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user } = await requireAuth();
  const [{ tab }, prefs] = await Promise.all([searchParams, getPreferences()]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);

  const filter = tab === "past" ? "past" : tab === "cancelled" ? "cancelled" : "all";
  const now = new Date();

  const where = { customerId: user.id } as Record<string, unknown>;
  if (filter === "past") {
    where.status = { not: "CANCELLED" } as never;
    where.checkOut = { lt: now } as never;
  } else if (filter === "cancelled") {
    where.status = "CANCELLED" as never;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { hostel: { select: { name: true, slug: true, city: true, country: true } }, room: { select: { name: true, number: true, type: true } } },
  });

  const cards: ReservationCardData[] = reservations.map((r) => ({
    id: r.id,
    number: r.number,
    status: r.status,
    paymentStatus: r.paymentStatus,
    checkIn: r.checkIn.toISOString(),
    checkOut: r.checkOut.toISOString(),
    nights: r.nights,
    guests: r.guests,
    total: r.total,
    currency: r.currency,
    createdAt: r.createdAt.toISOString(),
    hostel: { name: r.hostel.name, slug: r.hostel.slug, city: r.hostel.city, country: r.hostel.country },
    room: { name: r.room.name, number: r.room.number, type: r.room.type },
  }));

  const tabs = [
    { key: "all", label: t("account.upcoming") },
    { key: "past", label: t("account.past") },
    { key: "cancelled", label: t("account.cancelled") },
  ];

  return (
    <div className="space-y-5">
      <h1 className="heading-xl">{t("account.myReservations")}</h1>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tb) => (
          <Link
            key={tb.key}
            href={tb.key === "all" ? "/account/reservations" : `/account/reservations?tab=${tb.key}`}
            className={
              "rounded-full px-4 py-2 text-sm font-semibold transition " +
              (filter === tb.key ? "bg-brand text-ink" : "bg-slate-100 text-ink-soft hover:bg-slate-200")
            }
          >
            {tb.label}
          </Link>
        ))}
      </div>

      {cards.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-sm text-ink-soft">
            {filter === "all"
              ? t("account.noReservationsHint")
              : t("account.noReservations")}
          </p>
          {filter === "all" && (
            <Link
              href="/hostels"
              className="mt-4 inline-flex rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
            >
              {t("nav.hostels")}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((r) => (
            <ReservationCard key={r.id} res={r} locale={locale} withActions />
          ))}
        </div>
      )}
    </div>
  );
}