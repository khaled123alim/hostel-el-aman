"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  error: <XCircle className="h-5 w-5 text-rose-600" />,
  info: <Info className="h-5 w-5 text-sky-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, variant: input.variant ?? "success", title: input.title, description: input.description }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lift"
            style={{ animation: "slide-in-right 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <div className="mt-0.5 shrink-0">{ICONS[t.variant]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-soft">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-ink" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const noop = { title: "", toasts: [] };
    void noop;
    return { toast: () => {} };
  }
  return ctx;
}

export { cn };