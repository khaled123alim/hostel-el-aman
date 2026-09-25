"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const STATUSES = ["CLEAN", "DIRTY", "CLEANING", "INSPECTED", "OUT_OF_ORDER"];

const COLOR: Record<string, string> = {
  CLEAN: "inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100",
  DIRTY: "inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100",
  CLEANING: "inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100",
  INSPECTED: "inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100",
  OUT_OF_ORDER: "inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-300",
};

export function HousekeepingControls({ roomId, isRtl }: { roomId: string; isRtl: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [status, setStatus] = useState("CLEAN");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  const apply = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/housekeeping/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      setNote("");
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={setStatus} dir={isRtl ? "rtl" : "ltr"}>
        <SelectTrigger className="min-w-36">
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
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("common.optional")}
        className="input-base max-w-40"
      />
      <button
        type="button"
        disabled={pending}
        onClick={apply}
        className={cn(COLOR[status], "disabled:opacity-50")}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {t("common.apply")}
      </button>
    </div>
  );
}