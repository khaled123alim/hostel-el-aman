import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  const visible = pages.filter((p) => {
    return p === 1 || p === pageCount || Math.abs(p - page) <= 1;
  });

  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      <Button variant="outline" size="iconSm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {visible.map((p, idx) => {
        const prev = visible[idx - 1];
        const gapEl = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gapEl && <span className="px-1 text-sm text-ink-soft">…</span>}
            <Button
              variant={p === page ? "default" : "ghost"}
              size="iconSm"
              className={p === page ? "" : "border border-slate-200 bg-white"}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          </span>
        );
      })}
      <Button variant="outline" size="iconSm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}