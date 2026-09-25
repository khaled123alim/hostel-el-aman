"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AddNoteForm({ reservationId, showVisibility = true }: { reservationId: string; showVisibility?: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [internal, setInternal] = useState(true);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal: internal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      setContent("");
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        required
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
        placeholder={t("admin.notePh")}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {showVisibility && (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            {t("admin.internalNote")}
          </label>
        )}
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t("common.send")}
        </button>
      </div>
    </form>
  );
}