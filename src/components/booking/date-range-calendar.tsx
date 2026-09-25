"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { addDays, isoDay } from "@/lib/utils";

interface DateRangeCalendarProps {
  checkIn: string;
  checkOut: string;
  minDate?: string;
  onChange: (checkIn: string, checkOut: string) => void;
}

const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function todayString(): string {
  return isoDay(new Date());
}

export function DateRangeCalendar({ checkIn, checkOut, minDate, onChange }: DateRangeCalendarProps) {
  const { t, locale } = useI18n();
  const min = minDate ?? todayString();
  const [view, setView] = useState<Date>(() =>
    startOfMonth(checkIn ? new Date(`${checkIn}T00:00:00`) : new Date())
  );

  const cells = useMemo(() => {
    const first = startOfMonth(view);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    const out: { date: Date; inMonth: boolean; day: string }[] = [];
    for (let i = 0; i < total; i++) {
      const date = addDays(first, i - offset);
      out.push({ date, inMonth: date.getMonth() === first.getMonth(), day: isoDay(date) });
    }
    return out;
  }, [view]);

  const minView = startOfMonth(new Date(`${min}T00:00:00`));
  const canPrev = view > minView;

  const shiftMonth = (delta: number) => {
    setView((v) => startOfMonth(new Date(v.getFullYear(), v.getMonth() + delta, 1)));
  };

  const selectDay = (day: string) => {
    if (day < min) return;
    if (!checkIn || day <= checkIn) {
      onChange(day, "");
      return;
    }
    onChange(checkIn, day);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canPrev}
          onClick={() => shiftMonth(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <p className="text-sm font-bold text-ink">
          {view.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-ink transition hover:border-brand hover:text-brand"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>

      <div dir="ltr" className="mt-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <span key={d} className="pb-2 text-center text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              {t(`days.${d}`)}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ inMonth, day }) => {
            const disabled = day < min;
            const isIn = day === checkIn;
            const isOut = day === checkOut;
            const isToday = day === todayString();
            const inRange = Boolean(checkIn && checkOut && day > checkIn && day < checkOut);
            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                onClick={() => selectDay(day)}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-full text-sm transition",
                  disabled && "cursor-not-allowed text-ink-soft/40",
                  !disabled && !isIn && !isOut && !inRange && inMonth && "text-ink hover:bg-brand/15",
                  !disabled && !isIn && !isOut && !inRange && !inMonth && "text-ink-soft/40 hover:bg-brand/10",
                  inRange && "rounded-none bg-brand-subtle text-ink",
                  (isIn || isOut) && "bg-brand font-bold text-accent-dark shadow-sm",
                  isToday && !isIn && !isOut && "font-bold text-accent"
                )}
              >
                {day.slice(8)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}