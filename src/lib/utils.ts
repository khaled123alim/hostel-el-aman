import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, type Locale } from "date-fns";
import { enGB, fr, ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function genId(prefix: string, length = 6): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${out}`;
}

export function genNumericId(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 10);
  return out;
}

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDay(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = parseDay(isoDay(checkOut)).getTime() - parseDay(isoDay(checkIn)).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function rangeDates(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(start); d < end; d = addDays(d, 1)) {
    out.push(new Date(d));
  }
  return out;
}

const dateLocales: Record<string, Locale> = { en: enGB, fr, ar };

export function fmtDate(d: Date | string, locale = "en", pattern = "MMM d, yyyy"): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, pattern, { locale: dateLocales[locale] ?? enGB });
}

export function fmtDateTime(d: Date | string, locale = "en"): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMM d, yyyy '·' HH:mm", { locale: dateLocales[locale] ?? enGB });
}

export function timeAgo(d: Date | string, locale = "en"): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function initials(firstName?: string, lastName?: string): string {
  return `${(firstName ?? "?").charAt(0)}${(lastName ?? "").charAt(0)}`.toUpperCase();
}

export function truncate(str: string, len = 80): string {
  if (str.length <= len) return str;
  return `${str.slice(0, len - 3)}...`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function uniqueArray<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function classColors(className?: string) {
  return className ?? "";
}

export function hashStringToNumber(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}