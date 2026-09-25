import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, CalendarDays, Wallet, KeyRound, Building2, DoorOpen, Mail, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { formatMoney } from "@/lib/currency";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { reservationStatusActions } from "@/lib/services/reservation";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReservationActions } from "@/components/admin/reservation-actions";
import { DeleteReservationButton } from "@/components/admin/reservation-delete-button";
import { AddNoteForm } from "@/components/admin/add-note-form";
import { RecordPaymentForm } from "@/components/admin/record-payment-form";

export const dynamic = "force-dynamic";

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      customer: true,
      hostel: true,
      room: true,
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "desc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      review: true,
      guestsOverride: true,
      promotion: true,
    },
  });

  if (!reservation) notFound();

  const flags = reservationStatusActions(reservation.status);
  const paid = reservation.payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, reservation.total - paid);
  const act = can(user.role.name, "reservations.act") || true;

  const perms = {
    confirm: can(user.role.name, "reservations.edit"),
    checkin: can(user.role.name, "reservations.checkin"),
    checkout: can(user.role.name, "reservations.checkout"),
    cancel: can(user.role.name, "reservations.cancel"),
    noshow: can(user.role.name, "reservations.edit"),
  };

  const roomAndHostel = [
    { icon: Building2, label: t("admin.hostels"), value: reservation.hostel.name },
    { icon: DoorOpen, label: t("admin.rooms"), value: `${reservation.room.name} · ${reservation.room.number}` },
    { icon: KeyRound, label: t("admin.checkInCode"), value: reservation.checkInCode ?? "—" },
    { icon: MapPin, label: t("common.location"), value: `${reservation.hostel.city}, ${reservation.hostel.country}` },
  ];

  const historyLabel = (a: string) => {
    const map: Record<string, string> = {
      CREATED: t("admin.created"),
      CONFIRMED: t("status.CONFIRMED"),
      CANCELLED: t("status.CANCELLED"),
      CHECKED_IN: t("status.CHECKED_IN"),
      CHECKED_OUT: t("status.CHECKED_OUT"),
      NO_SHOW: t("status.NO_SHOW"),
      MODIFIED: t("admin.modified"),
      ROOM_CHANGED: t("admin.roomChange"),
      PAYMENT_RECORDED: t("admin.recordPayment"),
    };
    return map[a] ?? a.replace(/_/g, " ");
  };

  const guestInfo = [
    { icon: Users, label: t("common.guests"), value: String(reservation.guests) },
    { icon: Users, label: t("admin.bookingSource"), value: reservation.bookingSource },
    { icon: CalendarDays, label: t("common.created"), value: fmtDateTime(reservation.createdAt, locale) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="heading-2xl font-mono">{reservation.number}</h1>
            <StatusBadge status={reservation.status} label={t(`status.${reservation.status}`)} />
            <StatusBadge status={reservation.paymentStatus} label={t(`status.${reservation.paymentStatus}`)} />
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">
            {reservation.customer.firstName} {reservation.customer.lastName} · {reservation.hostel.name} ·{" "}
            {fmtDate(reservation.checkIn, locale)} → {fmtDate(reservation.checkOut, locale)}
          </p>
        </div>
        <Link href="/admin/reservations" className="btn-subtle">
          {t("common.back")}
        </Link>
      </div>

      {act && (
        <div className="card-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <ReservationActions id={id} status={reservation.status} flags={flags} perms={perms} />
            {can(user.role.name, "reservations.delete") && (
              <DeleteReservationButton id={id} number={reservation.number} />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.roomDetails")}</h2>
          <dl className="space-y-3">
            {roomAndHostel.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-sm text-ink-soft">
                  <r.icon className="h-4 w-4" />
                  {r.label}
                </dt>
                <dd className="text-sm font-semibold text-ink">{r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">{t("admin.guestDetails")}</h3>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink">
                {reservation.customer.firstName} {reservation.customer.lastName}
              </p>
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${reservation.customer.email}`} className="hover:text-brand">
                  {reservation.customer.email}
                </a>
              </div>
              {reservation.customer.phone && (
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  <Phone className="h-3.5 w-3.5" />
                  {reservation.customer.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-ink-soft">
                <Users className="h-3.5 w-3.5" />
                {reservation.customer.country ?? "—"}
              </div>
              {reservation.guestsOverride.length > 0 && (
                <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-ink-soft">
                  {reservation.guestsOverride.map((g) => (
                    <div key={g.id} className="flex justify-between">
                      <span>{g.fullName}</span>
                      {g.age != null && <span>{g.age} y</span>}
                    </div>
                  ))}
                </div>
              )}
              {reservation.specialRequests && (
                <p className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">
                  {t("admin.specialRequests")}: {reservation.specialRequests}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.priceBreakdown")}</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">
                {reservation.nights} × {t("common.nights")} × {reservation.roomsCount}
              </dt>
              <dd className="font-medium text-ink">{formatMoney(reservation.subtotal, reservation.currency, locale)}</dd>
            </div>
            {reservation.taxes > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t("booking.taxes")}</dt>
                <dd className="font-medium text-ink">{formatMoney(reservation.taxes, reservation.currency, locale)}</dd>
              </div>
            )}
            {reservation.fees > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t("booking.fees")}</dt>
                <dd className="font-medium text-ink">{formatMoney(reservation.fees, reservation.currency, locale)}</dd>
              </div>
            )}
            {reservation.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt className="text-ink-soft">
                  {t("booking.discount")} {reservation.promoCode ? `(${reservation.promoCode})` : ""}
                </dt>
                <dd>-{formatMoney(reservation.discount, reservation.currency, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-ink">
              <dt>{t("common.total")}</dt>
              <dd>{formatMoney(reservation.total, reservation.currency, locale)}</dd>
            </div>
            <div className="flex justify-between text-success">
              <dt>{t("admin.paid")}</dt>
              <dd>{formatMoney(paid, reservation.currency, locale)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>{t("admin.balanceDue")}</dt>
              <dd className={balance > 0 ? "text-amber-700" : "text-emerald-600"}>
                {formatMoney(balance, reservation.currency, locale)}
              </dd>
            </div>
          </dl>

          {can(user.role.name, "payments.manage") && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">{t("admin.recordPayment")}</h3>
              <RecordPaymentForm reservationId={id} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.paymentHistory")}</h2>
          <div className="space-y-2">
            {reservation.payments.length === 0 && <p className="text-sm text-ink-soft">{t("common.noResults")}</p>}
            {reservation.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {formatMoney(p.amount, p.currency, locale)}
                    <span className="ml-2 text-xs text-ink-soft">{p.method}</span>
                  </p>
                  <p className="text-xs text-ink-soft">{fmtDateTime(p.createdAt, locale)}</p>
                </div>
                <StatusBadge status={p.status} label={t(`status.${p.status}`)} />
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.history")}</h2>
          <ol className="relative space-y-4 border-s border-slate-200 ps-5">
            {reservation.history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -start-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-brand bg-white rtl:start-auto rtl:-end-[26px]" />
                <p className="text-sm font-semibold text-ink">{historyLabel(h.action)}</p>
                {h.detail && <p className="text-xs text-ink-soft">{h.detail}</p>}
                <p className="text-[11px] text-slate-400">{fmtDateTime(h.createdAt, locale)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {can(user.role.name, "reservations.edit") && (
        <div className="card-surface p-5">
          <h2 className="mb-4 font-display text-sm font-bold">{t("admin.notes")}</h2>
          <AddNoteForm reservationId={id} />
          <div className="mt-5 space-y-3">
            {reservation.notes.length === 0 && <p className="text-sm text-ink-soft">{t("common.noResults")}</p>}
            {reservation.notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {n.author.firstName} {n.author.lastName}
                    {n.isInternal && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {t("admin.internal")}
                      </span>
                    )}
                  </p>
                  <span className="text-[11px] text-slate-400">{fmtDateTime(n.createdAt, locale)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink-soft">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}