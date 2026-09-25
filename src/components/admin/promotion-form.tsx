"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface Values {
  name: string;
  code: string;
  type: string;
  value: string;
  fixedDiscount: string;
  minNights: string;
  minAmount: string;
  maxUses: string;
  startDate: string;
  endDate: string;
  hostelIds: string;
  status: string;
}

const empty: Values = {
  name: "",
  code: "",
  type: "PERCENTAGE",
  value: "10",
  fixedDiscount: "",
  minNights: "1",
  minAmount: "",
  maxUses: "",
  startDate: "",
  endDate: "",
  hostelIds: "",
  status: "ACTIVE",
};

export function PromotionForm({
  id,
  hostels,
  initial,
  isRtl,
}: {
  id?: string;
  hostels: { id: string; name: string }[];
  initial?: Partial<Values>;
  isRtl: boolean;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<Values>({ ...empty, ...initial });

  const set = (k: keyof Values, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.startDate || !form.endDate) return;
    setPending(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        type: form.type,
        value: Number(form.value) || undefined,
        fixedDiscount: Number(form.fixedDiscount) || undefined,
        minNights: Number(form.minNights),
        minAmount: Number(form.minAmount) || undefined,
        maxUses: Number(form.maxUses) || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        applicableHostels: form.hostelIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        status: form.status,
      };
      const res = await fetch(id ? `/api/admin/offers/${id}` : "/api/admin/offers", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      router.push("/admin/offers");
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  const label = "mb-1.5 block text-sm font-medium text-ink";

  return (
    <form onSubmit={submit} className="card-surface max-w-3xl space-y-5 p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={label}>{t("offers.nameTitle")} *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("offers.copy")} *</label>
          <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required className="input-base font-mono" />
        </div>
        <div>
          <label className={label}>{t("common.type")} *</label>
          <Select value={form.type} onValueChange={(v) => set("type", v)} dir={isRtl ? "rtl" : "ltr"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">% {t("admin.percentage")}</SelectItem>
              <SelectItem value="FIXED">{t("admin.fixedAmount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={label}>{form.type === "PERCENTAGE" ? "% Value" : t("common.amount")}</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.type === "PERCENTAGE" ? form.value : form.fixedDiscount}
            onChange={(e) => set(form.type === "PERCENTAGE" ? "value" : "fixedDiscount", e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className={label}>{t("admin.minNights")}</label>
          <input type="number" min={0} value={form.minNights} onChange={(e) => set("minNights", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.minAmount")}</label>
          <input type="number" min={0} step="0.01" value={form.minAmount} onChange={(e) => set("minAmount", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.maxUses")}</label>
          <input type="number" min={1} value={form.maxUses} onChange={(e) => set("maxUses", e.target.value)} className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.status")}</label>
          <Select value={form.status} onValueChange={(v) => set("status", v)} dir={isRtl ? "rtl" : "ltr"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">{t("admin.active")}</SelectItem>
              <SelectItem value="INACTIVE">{t("admin.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className={label}>{t("admin.startDate")} *</label>
          <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required className="input-base" />
        </div>
        <div>
          <label className={label}>{t("admin.endDate")} *</label>
          <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required className="input-base" />
        </div>
        <div className="md:col-span-2">
          <label className={label}>{t("admin.applicableHostels")} — {t("common.optional")}</label>
          <select
            value={form.hostelIds}
            onChange={(e) => set("hostelIds", Array.from(e.target.selectedOptions, (o) => o.value).join(","))}
            multiple
            size={Math.min(hostels.length + 1, 6)}
            className="input-base h-auto"
          >
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-soft">{t("admin.applicableHostelsHint")}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
        <button type="button" onClick={() => router.back()} className="btn-subtle">
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
          )}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {id ? t("common.update") : t("admin.create")}
        </button>
      </div>
    </form>
  );
}