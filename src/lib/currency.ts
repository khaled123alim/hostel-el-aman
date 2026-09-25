import { getSettings } from "@/lib/settings";

export interface ExchangeRateProvider {
  id: string;
  getRates(base: string): Promise<Record<string, number>>;
  isConnected: boolean;
}

/**
 * Placeholder exchange-rate provider.
 * Seeded local rates are used by default (marked as "demo" in the UI).
 * To connect a live API (e.g. exchangerate-api.com, fixer.io or Open Exchange
 * Rates), implement `LiveExchangeRateProvider` with the same shape, point the
 * env var EXCHANGE_RATE_API_KEY at it, and register it below. The rest of the
 * application only depends on this interface — nothing changes elsewhere.
 */
class LocalDemoRates implements ExchangeRateProvider {
  id = "demo";
  isConnected = false;
  async getRates(base: string): Promise<Record<string, number>> {
    const settings = await getSettings();
    const rates = settings?.general?.currencyRates?.rates ?? {};
    return rates;
  }
}

class OpenExchangeRatesProvider implements ExchangeRateProvider {
  id = "openexchangerates";
  get isConnected() {
    return Boolean(process.env.EXCHANGE_RATE_API_KEY);
  }
  async getRates(base: string): Promise<Record<string, number>> {
    const key = process.env.EXCHANGE_RATE_API_KEY;
    if (!key) return {};
    const url = `https://openexchangerates.org/api/latest.json?app_id=${key}&base=${base}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const data = await res.json();
    return data.rates ?? {};
  }
}

const providers: ExchangeRateProvider[] = [
  new OpenExchangeRatesProvider(),
  new LocalDemoRates(),
];

export function getActiveExchangeProvider(): ExchangeRateProvider {
  return providers.find((p) => p.isConnected) ?? providers[providers.length - 1];
}

export async function getCurrencyRates(): Promise<Record<string, number>> {
  const provider = getActiveExchangeProvider();
  return provider.getRates("EUR");
}

const SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  DZD: "DA",
};

export async function convertAmount(
  amount: number,
  from: string,
  to: string
): Promise<{ value: number; rate: number }> {
  if (from === to) return { value: amount, rate: 1 };
  const rates = await getCurrencyRates();
  const rate = rates[to] ?? 1;
  return { value: roundMoney((amount / (rates[from] ?? 1)) * rate), rate };
}

export function roundMoney(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currency: string, locale = "en"): string {
  const symbol = SYMBOLS[currency] ?? currency;
  const arLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-GB";
  const formatted = new Intl.NumberFormat(arLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  if (currency === "DZD") return `${formatted} ${symbol}`;
  if (locale === "ar") return `${formatted} ${symbol}`;
  return `${symbol}${formatted}`;
}

export async function convertAndFormat(amount: number, from: string, to: string, locale = "en") {
  const { value } = await convertAmount(amount, from, to);
  return formatMoney(value, to, locale);
}