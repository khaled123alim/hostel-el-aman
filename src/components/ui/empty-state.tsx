import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn2("flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center", compact ? "px-6 py-10" : "px-6 py-16")}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft">
        <Icon className="h-7 w-7 text-brand" />
      </div>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {(actionLabel && actionHref) || (actionLabel && action) ? (
        <div className="mt-5">
          {actionHref ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button onClick={action}>{actionLabel}</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function cn2(...args: Array<string | false | undefined>) {
  return args.filter(Boolean).join(" ");
}