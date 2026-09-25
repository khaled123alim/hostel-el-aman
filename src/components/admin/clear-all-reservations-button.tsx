"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eraser, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function ClearAllReservationsButton({ count }: { count: number }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);

  const del = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/admin/reservations", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("admin.reservationsCleared", { count: data.deleted ?? count }), variant: "success" });
      setOpen(false);
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        <Eraser className="h-4 w-4" />
        {t("admin.clearAll")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-bold text-ink">{t("admin.clearAllConfirm")}</h3>
            </div>
            <p className="mt-3 text-sm text-ink-soft">{t("admin.clearAllDesc", { count })}</p>
            <p className="mt-2 text-sm font-semibold text-rose-600">{t("admin.clearAllType")}</p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='DELETE'
              autoComplete="off"
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-subtle">
                {t("common.close")}
              </button>
              <button
                type="button"
                disabled={pending || confirmText !== "DELETE"}
                onClick={del}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}