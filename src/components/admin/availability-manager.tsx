"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Ov = {
  id: string;
  date: string;
  status: string;
  reason: string;
  priceOverride?: number;
};

const STATUSES = ["OPEN", "CLOSED", "BLOCKED"] as const;

export function AvailabilityManager({
  roomId,
  isRtl,
  overrides,
}: {
  roomId: string;
  isRtl: boolean;
  overrides: Ov[];
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("CLOSED");
  const [priceOverride, setPriceOverride] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  const byDate = useMemo(() => new Map(overrides.map((o) => [o.date, o])), [overrides]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || endDate < startDate) return;
    setPending(true);
    try {
      const res = await fetch("/api/admin/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          startDate,
          endDate,
          status,
          priceOverride: priceOverride ? Number(priceOverride) : undefined,
          reason: reason || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      setPriceOverride("");
      setReason("");
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("admin.from")}</label>
          <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("admin.to")}</label>
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("admin.status")}</label>
          <Select value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])} dir={isRtl ? "rtl" : "ltr"}>
            <SelectTrigger className="min-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("admin.priceOverride")}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={priceOverride}
            placeholder={t("common.optional")}
            onChange={(e) => setPriceOverride(e.target.value)}
            className="input-base w-32"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">{t("data.reason")}</label>
          <input value={reason} placeholder={t("common.optional")} onChange={(e) => setReason(e.target.value)} className="input-base w-48" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.apply")}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="pb-2 pr-4">{t("common.date")}</th>
              <th className="pb-2 pr-4">{t("admin.status")}</th>
              <th className="pb-2 pr-4">{t("admin.priceOverride")}</th>
              <th className="pb-2">{t("data.reason")}</th>
            </tr>
          </thead>
          <tbody>
            {overrides.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-ink-soft">
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {overrides.map((o) => (
              <tr key={o.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2.5 pr-4 font-medium text-ink">{o.date}</td>
                <td className="py-2.5 pr-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      o.status === "OPEN" && "bg-emerald-50 text-emerald-700",
                      o.status === "CLOSED" && "bg-slate-100 text-slate-600",
                      o.status === "BLOCKED" && "bg-rose-50 text-rose-600"
                    )}
                  >
                    {t(`status.${o.status}`)}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-ink-soft">
                  {o.priceOverride != null ? o.priceOverride : "—"}
                </td>
                <td className="py-2.5 text-ink-soft">{o.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {byDate.size > 0 && (
        <p className="text-xs text-ink-soft">
          {t("admin.showingUpcoming")}: {byDate.size}
        </p>
      )}
    </div>
  );
}