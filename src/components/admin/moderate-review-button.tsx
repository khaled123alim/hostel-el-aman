"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const COLOR: Record<string, string> = {
  brand: "bg-brand text-ink hover:bg-brand-dark",
  slate: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  rose: "bg-rose-50 text-rose-600 hover:bg-rose-100",
};

export function ModerateReviewButton({
  id,
  status,
  label,
  color,
}: {
  id: string;
  status: string;
  label: string;
  color: string;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const act = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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
    <button
      type="button"
      disabled={pending}
      onClick={act}
      className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:opacity-50", COLOR[color])}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );
}