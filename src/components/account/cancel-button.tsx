"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function CancelReservationButton({
  reservationId,
  done,
  className,
}: {
  reservationId: string;
  done?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const cancel = async () => {
    if (!window.confirm(t("account.cancelConfirm"))) return;
    setPending(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("account.cancelSuccess") });
        done?.();
        router.refresh();
      } else {
        toast({ title: json.error ?? t("errors.generic"), variant: "error" });
      }
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={cancel}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
      {t("account.cancelReservation")}
    </button>
  );
}