import Link from "next/link";
import { ArrowRight, CalendarRange, MapPin, Sparkles } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { getPreferences } from "@/lib/preferences";
import { getSettings } from "@/lib/settings";
import { translateKey } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency";
import { ReservationCard, type ReservationCardData } from "@/components/account/reservation-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

function iso(d: Date) {
  return d.toISOString();
}

export default async function AccountOverviewPage() {
  const { user } = await requireAuth();
  const [prefs, settings] = await Promise.all([getPreferences(), getSettings()]);
  const locale = prefs.locale;
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);
  const base = settings.general?.defaultCurrency ?? "EUR";

  const now = new Date();
  const upcoming = await prisma.reservation.count({
    where: { customerId: user.id, checkOut: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  const past = await prisma.reservation.count({
    where: { customerId: user.id, status: { in: ["CHECKED_OUT", "CHECKED_IN"] } },
  });
  const spent = await prisma.reservation.aggregate({
    where: { customerId: user.id, status: { notIn: ["CANCELLED"] } },
    _sum: { total: true },
  });

  const reservations = await prisma.reservation.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { hostel: { select: { name: true, slug: true, city: true, country: true } }, room: { select: { name: true, number: true, type: true } } },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const cards: ReservationCardData[] = reservations.map((r) => ({
    id: r.id,
    number: r.number,
    status: r.status,
    paymentStatus: r.paymentStatus,
    checkIn: iso(r.checkIn),
    checkOut: iso(r.checkOut),
    nights: r.nights,
    guests: r.guests,
    total: r.total,
    currency: r.currency,
    createdAt: iso(r.createdAt),
    hostel: { name: r.hostel.name, slug: r.hostel.slug, city: r.hostel.city, country: r.hostel.country },
    room: { name: r.room.name, number: r.room.number, type: r.room.type },
  }));

  const stats = [
    { label: t("account.upcoming"), value: String(upcoming), accent: true },
    { label: t("account.past"), value: String(past) },
    {
      label: t("account.totalSpent"),
      value: formatMoney(spent._sum.total ?? 0, user.currency || base, locale),
      soft: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card-surface p-4 text-center">
            <p className={"font-display text-2xl font-extrabold " + (s.accent ? "text-brand" : "text-ink")}>
              {s.value}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{t("account.upcoming")}</h2>
          <Link href="/account/reservations" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            {t("account.myReservations")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {cards.length === 0 ? (
          <EmptyReservations t={t} />
        ) : (
          <div className="space-y-4">
            {cards.map((r) => (
              <ReservationCard key={r.id} res={r} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">{t("account.notifications")}</h2>
        <div className="card-surface divide-y divide-slate-100 p-2">
          {notifications.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-soft">{t("notif.noNotifications")}</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle">
                <Sparkles className="h-4 w-4 text-brand" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                {n.content && <p className="mt-0.5 text-xs text-ink-soft">{n.content}</p>}
              </div>
              {!n.readAt && <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyReservations({ t }: { t: (k: string) => string }) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle">
        <CalendarRange className="h-7 w-7 text-brand" />
      </span>
      <p className="text-sm font-semibold text-ink">{t("account.noReservations")}</p>
      <p className="text-sm text-ink-soft">{t("account.noReservationsHint")}</p>
      <Link
        href="/hostels"
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
      >
        <MapPin className="h-4 w-4" /> {t("nav.hostels")}
      </Link>
    </div>
  );
}