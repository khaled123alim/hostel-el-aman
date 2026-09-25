import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, string> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CHECKED_IN: "info",
  CHECKED_OUT: "neutral",
  CANCELLED: "danger",
  NO_SHOW: "neutral",
  PAID: "success",
  PARTIALLY_REFUNDED: "info",
  REFUNDED: "info",
  FAILED: "danger",
  ACTIVE: "success",
  INACTIVE: "neutral",
  APPROVED: "success",
  HIDDEN: "neutral",
  OPEN: "success",
  CLOSED: "neutral",
  BLOCKED: "danger",
  CLEAN: "success",
  DIRTY: "danger",
  CLEANING: "warning",
  INSPECTED: "info",
  OUT_OF_ORDER: "neutral",
  DISABLED: "danger",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const variant = (STATUS_MAP[status] ?? "neutral") as "warning" | "success" | "info" | "neutral" | "danger";
  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? status.toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
}