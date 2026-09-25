import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ value, size = "sm", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const scale = size === "sm" ? 14 : size === "md" ? 18 : 24;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = value >= i - 0.25;
    const half = !filled && value >= i - 0.75;
    stars.push(
      <span key={i} className="relative inline-flex">
        <Star size={scale} className={cn("text-slate-300", half && "text-amber-400", filled && "text-amber-400", filled && "fill-amber-400")} strokeWidth={1.5} />
        {half && !filled && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Star size={scale} className="fill-amber-400 text-amber-400" strokeWidth={1.5} />
          </span>
        )}
      </span>
    );
  }
  return <span className={cn("inline-flex items-center gap-0.5", className)}>{stars}</span>;
}

export function RatingPill({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg bg-brand px-2 py-0.5 text-sm font-bold text-white", className)}>
      {value.toFixed(1)}
      <Star size={13} className="fill-amber-300 text-amber-300" />
      {typeof count === "number" && <span className="font-medium text-white/70">({count})</span>}
    </span>
  );
}