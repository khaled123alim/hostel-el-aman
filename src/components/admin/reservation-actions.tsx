"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LogIn, LogOut, XCircle, Ban, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface StatusActionFlags {
  canConfirm: boolean;
  canCheckIn: boolean;
  canCheckOut: boolean;
  canCancel: boolean;
  canRefund: boolean;
}

export function ReservationActions({
  id,
  status,
  flags,
  perms,
}: {
  id: string;
  status: string;
  flags: StatusActionFlags;
  perms: { confirm: boolean; checkin: boolean; checkout: boolean; cancel: boolean; noshow: boolean };
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState(true);

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setPending(action);
    try {
      const res = await fetch(`/api/admin/reservations/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      setConfirmOpen(false);
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(null);
    }
  };

  const baseBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const solid = `${baseBtn} bg-brand text-ink hover:bg-brand-dark`;
  const outline = `${baseBtn} border border-slate-300 bg-white text-ink hover:border-brand hover:text-brand`;
  const danger = `${baseBtn} bg-rose-600 text-white hover:bg-rose-700`;

  const canView = status !== "CANCELLED" && status !== "CHECKED_OUT";

  return (
    <div>
      {canView && (
        <div className="flex flex-wrap items-center gap-2">
          {flags.canConfirm && perms.confirm && (
            <button type="button" disabled={pending !== null} onClick={() => run("confirm")} className={solid}>
              {pending === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {t("admin.confirm")}
            </button>
          )}
          {flags.canCheckIn && perms.checkin && (
            <button type="button" disabled={pending !== null} onClick={() => run("checkin")} className={solid}>
              {pending === "checkin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {t("admin.checkIn")}
            </button>
          )}
          {flags.canCheckOut && perms.checkout && (
            <button type="button" disabled={pending !== null} onClick={() => run("checkout")} className={solid}>
              {pending === "checkout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              {t("admin.checkOut")}
            </button>
          )}
          {flags.canCancel && perms.cancel && (
            <button type="button" disabled={pending !== null} onClick={() => setConfirmOpen(true)} className={danger}>
              <XCircle className="h-4 w-4" />
              {t("admin.cancel")}
            </button>
          )}
          {["PENDING", "CONFIRMED"].includes(status) && perms.noshow && (
            <button type="button" disabled={pending !== null} onClick={() => run("noshow")} className={outline}>
              {pending === "noshow" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              {t("admin.noShow")}
            </button>
          )}
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-ink">{t("admin.cancelReservation")}</h3>
            <p className="mt-1 text-sm text-ink-soft">{t("admin.cancelReservationDesc")}</p>
            <label className={cn("mt-4 block text-sm font-medium text-ink")}>
              {t("admin.cancelReason")}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder={t("admin.cancelReasonPh")}
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={refund}
                onChange={(e) => setRefund(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
              />
              {t("admin.refundAmount")}
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className={outline}>
                {t("common.close")}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => run("cancel", { reason, refund })}
                className={danger}
              >
                {pending === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {t("admin.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}