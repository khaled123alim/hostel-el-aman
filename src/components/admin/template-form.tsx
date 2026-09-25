"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function TemplateForm({ id, subject, body }: { id: string; subject: string; body: string }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [subj, setSubj] = useState(subject);
  const [html, setHtml] = useState(body);
  const [pending, setPending] = useState(false);

  const save = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subj, body: html }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: t(data.error ?? "errors.generic"), variant: "error" });
        return;
      }
      toast({ title: t("common.saved"), variant: "success" });
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-surface space-y-5 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">{t("admin.subject")}</label>
          <input value={subj} onChange={(e) => setSubj(e.target.value)} className="input-base" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            {t("admin.templateBody")} <span className="font-normal text-ink-soft">({t("admin.htmlAllowed")})</span>
          </label>
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={16} className="input-base font-mono text-xs" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.back()} className="btn-subtle">
            {t("common.cancel")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            )}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </button>
        </div>
        <p className="rounded-xl bg-brand-subtle p-3 text-xs text-ink-soft">{t("admin.templateVarsHint")}</p>
      </div>
      <div className="card-surface p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("admin.preview")}</p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-ink">{subj}</p>
          <div
            className="prose-sm prose mt-3 max-w-none text-sm text-ink"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}