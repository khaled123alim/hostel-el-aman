import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ items, className }: { items: Array<{ label: string; href?: string }>; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-ink-soft", className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400 rtl:rotate-180" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="transition hover:text-brand">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-semibold text-ink")}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}