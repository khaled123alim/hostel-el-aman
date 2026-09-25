"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";

export interface FieldSpec {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "checkbox" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
}

export function SettingsSection({
  group,
  title,
  description,
  fields,
  values,
}: {
  group: string;
  title: string;
  description?: string;
  fields: FieldSpec[];
  values: Record<string, unknown>;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown>>({ ...values });
  const [pending, setPending] = useState(false);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: group, value: form }),
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

  const label = "mb-1.5 block text-sm font-medium text-ink";

  return (
    <section className="card-surface p-6">
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className={label}>{f.label}</label>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-2 pt-1.5 text-sm text-ink">
                <input type="checkbox" checked={Boolean(form[f.key])} onChange={(e) => set(f.key, e.target.checked)} className="h-4 w-4 accent-brand" />
                {t("common.enabled")}
              </label>
            ) : f.type === "select" ? (
              <select value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} className="input-base">
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} rows={3} className="input-base" />
            ) : (
              <input
                type={f.type}
                value={String(form[f.key] ?? "")}
                placeholder={f.placeholder}
                onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                className="input-base"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-brand-dark hover:text-white disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.save")}
        </button>
      </div>
    </section>
  );
}