import { requireAdmin } from "@/lib/auth";
import { serverI18n } from "@/lib/i18n-server";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/status-badge";
import { HousekeepingControls } from "@/components/admin/housekeeping-controls";

export const dynamic = "force-dynamic";

const STATUSES = ["CLEAN", "DIRTY", "CLEANING", "INSPECTED", "OUT_OF_ORDER"] as const;

export default async function AdminHousekeepingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t, locale } = await serverI18n();
  const { user } = await requireAdmin();
  const q = await searchParams;
  const hostelId = (Array.isArray(q?.hostel) ? q.hostel[0] : q?.hostel ?? "") as string;
  const status = (Array.isArray(q?.status) ? q.status[0] : q?.status ?? "") as string;
  const validStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : "";

  const [hostels, rooms] = await Promise.all([
    prisma.hostel.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.room.findMany({
      where: {
        ...(hostelId ? { hostelId } : {}),
        ...(validStatus ? { housekeepingStatus: validStatus as never } : {}),
      },
      orderBy: [{ hostelId: "asc" }, { number: "asc" }],
      include: { hostel: { select: { name: true } } },
    }),
  ]);
  const hostelMap = new Map(hostels.map((h) => [h.id, h.name]));

  const counts = await prisma.room.groupBy({ by: ["housekeepingStatus"], _count: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2xl">{t("admin.housekeeping")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("admin.currentRoomStatus")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const c = counts.find((x) => x.housekeepingStatus === s)?._count ?? 0;
          return (
            <a
              key={s}
              href={`/admin/housekeeping${validStatus === s ? "" : `?status=${s}${hostelId ? `&hostel=${hostelId}` : ""}`}`}
              className={
                validStatus === s
                  ? "inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
                  : "inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-slate-200"
              }
            >
              {t(`status.${s}`)}
              <span className="rounded-full bg-white/60 px-1.5 text-[10px]">{c}</span>
            </a>
          );
        })}
      </div>

      <form method="GET" className="card-surface flex flex-wrap items-center gap-3 p-3">
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

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">{t("admin.hostels")}</th>
              <th className="px-4 py-3">{t("admin.rooms")}</th>
              <th className="px-4 py-3">{t("admin.guestsCount")}</th>
              <th className="px-4 py-3">{t("admin.status")}</th>
              <th className="px-4 py-3">{t("admin.housekeepingNote")}</th>
              {can(user.role.name, "housekeeping.manage") && (
                <th className="px-4 py-3 text-right">{t("common.action")}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-soft">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {rooms.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-ink-soft">{hostelMap.get(r.hostelId)}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  {r.name} <span className="text-xs text-ink-soft">({r.number})</span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{r.capacity}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.housekeepingStatus} label={t(`status.${r.housekeepingStatus}`)} />
                </td>
                <td className="px-4 py-3 text-ink-soft">{r.housekeepingNote ?? "—"}</td>
                {can(user.role.name, "housekeeping.manage") && (
                  <td className="px-4 py-3 text-right">
                    <HousekeepingControls roomId={r.id} isRtl={locale === "ar"} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}