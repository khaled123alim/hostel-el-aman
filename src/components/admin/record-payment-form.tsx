"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function RecordPaymentForm({ reservationId }: { reservationId: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, method: "PAY_AT_HOSTEL", status: "PAID" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      setAmount("");
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="min-w-40 flex-1">
        <label className="mb-1.5 block text-sm font-medium text-ink">{t("admin.amountReceived")}</label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {t("admin.recordPayment")}
      </button>
    </form>
  );
}