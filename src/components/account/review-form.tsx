"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stars } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface ReviewTarget {
  reservationId: string;
  hostelName: string;
}

export function ReviewForm({ target, onDone }: { target: ReviewTarget; onDone?: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hovers, setHovers] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  const criteria = [
    { key: "cleanliness", label: t("hd.critCleanliness") },
    { key: "staff", label: t("hd.critStaff") },
    { key: "comfort", label: t("hd.critComfort") },
    { key: "location", label: t("hd.critLocation") },
    { key: "facilities", label: t("hd.critFacilities") },
  ] as const;

  const defaultValues: Record<string, number> = {};
  for (const c of criteria) defaultValues[c.key] = 5;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: Record<string, number | string> = {
      reservationId: target.reservationId,
      rating,
      comment,
      cleanliness: defaultValues.cleanliness,
      staff: defaultValues.staff,
      comfort: defaultValues.comfort,
      location: defaultValues.location,
      facilities: defaultValues.facilities,
    };
    for (const c of criteria) data[c.key] = hovers[c.key] || defaultValues[c.key];
    setPending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: t("account.reviewSubmitted") });
        onDone?.();
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

  const fieldCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">{target.hostelName}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
              className="transition hover:scale-110"
            >
              <Stars
                className={cn("h-6 w-6", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {criteria.map((c) => {
          const val = hovers[c.key] || defaultValues[c.key];
          return (
            <div key={c.key} className="rounded-xl border border-slate-200 p-3 text-center">
              <p className="text-[11px] font-medium text-ink-soft">{c.label}</p>
              <div className="mt-1.5 flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setHovers((p) => ({ ...p, [c.key]: n }))}
                    aria-label={`${c.label} ${n}`}
                  >
                    <Stars
                      className={cn(
                        "h-3.5 w-3.5 transition",
                        n <= val ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <label className="block">
        <span className={labelCls}>{t("account.reviewComment") ?? "Comment"}</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          className={fieldCls}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : null}
        {t("common.send")}
      </button>
    </form>
  );
}