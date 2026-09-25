"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  content?: string;
  type: string;
  link?: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const markRead = async (id: string) => {
    setPendingId(id);
    try {
      const res = await fetch(`/api/account/notifications/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setPendingId(null);
    }
  };

  const markAll = async () => {
    setBusyAll(true);
    try {
      const res = await fetch("/api/account/notifications/read-all", { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast({ title: t("errors.generic"), variant: "error" });
    } finally {
      setBusyAll(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-subtle">
          <Bell className="h-7 w-7 text-brand" />
        </span>
        <p className="text-sm font-semibold text-ink">{t("notif.noNotifications")}</p>
      </div>
    );
  }

  return (
    <div className="card-surface divide-y divide-slate-100 p-2">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display font-bold text-ink">{t("account.notifications")}</p>
        <button
          type="button"
          onClick={markAll}
          disabled={busyAll || items.every((i) => i.readAt)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busyAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
          {t("notif.markAllRead")}
        </button>
      </div>
      {items.map((n) => {
        const unread = !n.readAt;
        const inner = (
          <div
            className={cn(
              "flex items-start gap-3 px-4 py-4 transition",
              unread && "bg-brand-subtle/40",
              !n.link && "cursor-default"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                unread ? "bg-accent text-white" : "bg-slate-100 text-ink-soft"
              )}
            >
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{n.title}</p>
              {n.content && <p className="mt-0.5 text-sm text-ink-soft">{n.content}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {!n.readAt && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markRead(n.id);
                  }}
                  disabled={pendingId === n.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {pendingId === n.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  {t("account.read") ?? "Read"}
                </button>
              )}
            </div>
          </div>
        );
        return n.link ? (
          <Link key={n.id} href={n.link} className="block">
            {inner}
          </Link>
        ) : (
          <div key={n.id}>{inner}</div>
        );
      })}
    </div>
  );
}