"use client";

import { useState } from "react";
import { X, Star } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReviewForm } from "@/components/account/review-form";
import { cn } from "@/lib/utils";

export function ReviewDialog({
  target,
  triggerLabel,
}: {
  target: { reservationId: string; hostelName: string };
  triggerLabel: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-dark"
      >
        <Star className="h-3.5 w-3.5" /> {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{t("account.reviewStay")}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className={cn("rounded-lg p-1.5 text-ink-soft transition hover:bg-slate-100 hover:text-ink")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReviewForm
              target={target}
              onDone={() => {
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}