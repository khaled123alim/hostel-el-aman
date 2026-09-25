"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export function ConfirmDeleteButton({
  url,
  title,
  description,
  onDeleted,
}: {
  url: string;
  title?: string;
  description?: string;
  onDeleted?: () => void;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const del = async () => {
    setPending(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t(data.deactivated ? "admin.deactivatedMsg" : "common.saved"), variant: "success" });
      setOpen(false);
      onDeleted?.();
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
        className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
        title={t("common.delete")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-ink">{title ?? t("common.delete")}</h3>
            {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-subtle">
                {t("common.close")}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={del}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}