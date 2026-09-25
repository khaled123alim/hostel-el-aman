import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { parseDay } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function shiftMonth(ref: string, delta: number): string {
  const [y, m] = ref.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const sp = (k: string) => (Array.isArray(q?.[k]) ? q[k][0] : q?.[k] ?? "");

  const hostelId = sp("hostel");
  const month = /^\d{4}-\d{2}$/.test(sp("month")) ? sp("month") : new Date().toISOString().slice(0, 7);
  void locale;

  const hostels = await prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  let rooms: Awaited<ReturnType<typeof prisma.room.findMany>> = [];
  if (hostelId) {
    rooms = await prisma.room.findMany({ where: { hostelId }, orderBy: { number: "asc" } });
  } else {
    rooms = await prisma.room.findMany({ orderBy: [{ hostelId: "asc" }, { number: "asc" }] });
  }
  const hostelMap = new Map(hostels.map((h) => [h.id, h.name]));

  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // 0 = Monday
  const now = parseDay(new Date().toISOString().slice(0, 10));
  const todayDay = new Date().getDate();

  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0);
  monthEnd.setHours(23, 59, 59, 999);
  const monthStartPadded = new Date(monthStart);
  monthStartPadded.setDate(1 - offset);

  const [overrides, reservations] = await Promise.all([
    prisma.roomAvailability.findMany({
      where: { roomId: { in: rooms.map((r) => r.id) }, date: { gte: monthStartPadded, lte: monthEnd } },
    }),
    prisma.reservation.findMany({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "NO_SHOW"] },
        AND: [{ checkIn: { lte: monthEnd } }, { checkOut: { gte: monthStartPadded } }],
      },
      select: { id: true, number: true, roomId: true, checkIn: true, checkOut: true, status: true },
    }),
  ]);

  const overrideMap = new Map<string, { status: string; reason?: string | null }>();
  for (const o of overrides) {
    const key = `${o.roomId}|${o.date.toISOString().slice(0, 10)}`;
    overrideMap.set(key, { status: o.status, reason: o.reason });
  }

  const reservationMap = new Map<string, { number: string; id: string; status: string; checkIn: Date; checkOut: Date }[]>();
  for (const r of reservations) {
    const reservationsByRoom = reservationMap.get(r.roomId) ?? [];
    reservationsByRoom.push(r);
    reservationMap.set(r.roomId, reservationsByRoom);
  }

  const dayCell = (roomId: string, date: Date): { kind: "open" | "blocked" | "closed" | "reserved" | "past"; label?: string } => {
    const key = `${roomId}|${date.toISOString().slice(0, 10)}`;
    const ov = overrideMap.get(key);
    const dayStart = new Date(date);
    const dayEnd = new Date(date.getTime() + 86400000);
    const res = (reservationMap.get(roomId) ?? []).find((r) => r.checkIn < dayEnd && r.checkOut > dayStart);
    if (ov?.status === "BLOCKED") return { kind: "blocked" };
    if (ov?.status === "CLOSED") return { kind: "closed" };
    if (res) return { kind: "reserved", label: res.number };
    return { kind: date < now ? "past" : "open" };
  };

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => t(`days.${d.toLowerCase()}`) ?? d);
  void dayNames;

  const legend = [
    { key: "open", label: t("admin.availOpen"), cls: "bg-emerald-100 text-emerald-700" },
    { key: "reserved", label: t("admin.availReserved"), cls: "bg-brand-subtle text-brand" },
    { key: "closed", label: t("admin.availClosed"), cls: "bg-slate-200 text-slate-500" },
    { key: "blocked", label: t("admin.availBlocked"), cls: "bg-rose-100 text-rose-700" },
    { key: "past", label: t("admin.availPast"), cls: "bg-slate-100 text-slate-400" },
  ];

  const canView = can(user.role.name, "calendar.view") || can(user.role.name, "dashboard.view");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="heading-2xl">{t("admin.calendar")}</h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendar?month=${shiftMonth(month, -1)}${hostelId ? `&hostel=${hostelId}` : ""}`}
            className="rounded-xl border border-slate-300 bg-white p-2 text-ink transition hover:border-brand hover:text-brand"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/admin/calendar?month=${shiftMonth(month, 1)}${hostelId ? `&hostel=${hostelId}` : ""}`}
            className="rounded-xl border border-slate-300 bg-white p-2 text-ink transition hover:border-brand hover:text-brand"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <span className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm ring-1 ring-slate-200">
            {first.toLocaleDateString(locale, { month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-3 p-3">
        <input type="hidden" name="month" value={month} />
        <select name="hostel" defaultValue={hostelId} className="input-base max-w-64">
          <option value="">{t("admin.allHostels")}</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-subtle">
          {t("common.apply")}
        </button>
      </form>

      {!canView ? (
        <p className="card-surface p-6 text-sm text-ink-soft">{t("admin.permissionDenied")}</p>
      ) : (
        <div className="card-surface overflow-x-auto">
          <div className="grid min-w-max grid-cols-[200px_repeat(35,44px)]">
            <div className="sticky left-0 z-10 border-b border-slate-100 bg-white p-3 text-xs font-bold uppercase tracking-wider text-ink-soft">
              {t("admin.rooms")}
            </div>
            {Array.from({ length: daysInMonth + offset }).map((_, i) => {
              const dayNum = i - offset + 1;
              const isToday = dayNum === todayDay && month === new Date().toISOString().slice(0, 7);
              return (
                <div
                  key={i}
                  className={cn(
                    "border-b border-slate-100 p-1 text-center text-[10px] font-semibold",
                    isToday ? "text-accent" : "text-ink-soft"
                  )}
                >
                  {dayNum > 0 ? dayNum : ""}
                </div>
              );
            })}

            {rooms.map((room) => {
              const dayCells: (ReturnType<typeof dayCell> & { date: Date })[] = [];
              for (let d = 0; d < daysInMonth + offset; d++) {
                const date = new Date(y, m - 1, 1 - offset + d);
                dayCells.push({ ...dayCell(room.id, date), date });
              }
              return (
                <div key={room.id} className="contents">
                  <div className="sticky left-0 z-10 bg-white p-3">
                    <p className="truncate text-sm font-semibold text-ink">{room.name}</p>
                    <p className="truncate text-[10px] text-ink-soft">
                      {hostelMap.get(room.hostelId)} · {room.number}
                    </p>
                  </div>
                  {dayCells.map((c, i) => {
                    const styles: Record<string, string> = {
                      open: "bg-emerald-100 hover:bg-emerald-200",
                      reserved: "bg-brand-subtle",
                      closed: "bg-slate-200",
                      blocked: "bg-rose-100",
                      past: "bg-slate-50",
                    };
                    return (
                      <div
                        key={i}
                        title={c.label ?? c.date.toLocaleDateString(locale)}
                        className={cn("h-11 w-full border-b border-slate-100 transition", styles[c.kind])}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {legend.map((l) => (
          <span key={l.key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <span className={cn("h-3.5 w-3.5 rounded", l.cls)} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}