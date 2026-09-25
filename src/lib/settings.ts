import { prisma } from "@/lib/db";

export type SettingsMap = Record<string, any>;

const DEFAULT_SETTINGS: SettingsMap = {
  site: {
    name: "Hostel El Aman",
    tagline: "Your home in Douera",
    logo: "",
    favicon: "",
    contactEmail: "contact@hostelelaman.dz",
    phone: "+213 555 00 00 00",
    address: "Douera, Alger, Algeria",
    facebook: "",
    instagram: "",
    twitter: "",
    font: "jakarta",
  },
  brand: {
    primary: "244 194 75",
    primaryDark: "193 129 28",
    accent: "193 129 28",
    accentDark: "2 1 1",
  },
  general: {
    defaultCurrency: "DZD",
    supportedCurrencies: ["DZD"],
    defaultLocale: "ar",
    supportedLocales: ["ar", "fr", "en"],
    timezone: "Africa/Algiers",
    currencyRates: { base: "EUR", rates: { USD: 1.08, GBP: 0.86, DZD: 145.0 } },
  },
  reservations: {
    autoConfirm: true,
    minNights: 1,
    maxNights: 30,
    maxGuestsPerRoom: 6,
    checkInDefault: "14:00",
    checkOutDefault: "11:00",
  },
  payments: {
    payAtHostelEnabled: true,
    cardEnabled: true,
    stripeEnabled: false,
    taxRate: 10,
    currency: "DZD",
  },
  tax: {
    rate: 10,
    label: "Taxes & fees",
    applyCleaningFee: true,
  },
  cancellation: {
    policy: "Flexible",
    freeUntilDays: 2,
    refundPercentage: 100,
    text: "Free cancellation up to 48 hours before check-in for a full refund.",
  },
  emails: { enabled: false, cc: "" },
  notifications: { bookingCreated: true, paymentReceived: true, checkinReminder: true },
  map: { provider: "osm", token: "" },
  seo: { title: "StayHub — Hostel Booking Platform", description: "Comfortable hostels, great locations." },
};

let cache: SettingsMap | null = null;
let cacheTime = 0;
const TTL = 15_000;

export async function getSettings(force = false): Promise<SettingsMap> {
  if (cache && !force && Date.now() - cacheTime < TTL) return cache;
  const rows = await prisma.setting.findMany();
  const merged: SettingsMap = {};
  for (const row of rows) {
    merged[row.key] = (row.value as any) ?? {};
  }
  const result: SettingsMap = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (merged[key]) Object.assign(result[key], merged[key]);
  }
  cache = result;
  cacheTime = Date.now();
  return result;
}

export async function getSetting(key: string): Promise<any> {
  const all = await getSettings();
  return all[key];
}

export async function updateSetting(key: string, value: any) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as any },
    create: { key, value: value as any, group: "general" },
  });
  cache = null;
}

export async function getAllSettingRows() {
  const rows = await prisma.setting.findMany();
  return rows.map((r) => ({ key: r.key, value: (r.value as any) ?? {} }));
}

export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const n = parseInt(clean, 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  }
  if (/^\d{1,3} \d{1,3} \d{1,3}$/.test(clean)) return clean;
  return "244 194 75";
}

export function brandCssVars(settings: SettingsMap): string {
  const b = settings?.brand ?? {};
  return [
    `--c-brand:${hexToRgbTriplet(b.primary ?? "244 194 75")}`,
    `--c-brand-dark:${hexToRgbTriplet(b.primaryDark ?? "193 129 28")}`,
    `--c-accent:${hexToRgbTriplet(b.accent ?? "193 129 28")}`,
    `--c-accent-dark:${hexToRgbTriplet(b.accentDark ?? "2 1 1")}`,
  ].join(";");
}