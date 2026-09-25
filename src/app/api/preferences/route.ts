import { NextResponse, type NextRequest } from "next/server";
import { savePreferences } from "@/lib/preferences";
import { normalizeLocale } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(`prefs:${ipFromRequest(req)}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });
  }

  let body: { locale?: string; currency?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  const settings = await getSettings();
  const supportedLocales = (settings.general?.supportedLocales ?? ["en", "fr", "ar"]) as string[];
  const supportedCurrencies = (settings.general?.supportedCurrencies ?? ["DZD"]) as string[];

  const locale = body.locale ? normalizeLocale(body.locale) : undefined;
  if (locale && !supportedLocales.includes(locale)) {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }
  const currency = body.currency;
  if (currency && !supportedCurrencies.includes(currency)) {
    return NextResponse.json({ error: "errors.generic" }, { status: 400 });
  }

  await savePreferences({ locale, currency });
  return NextResponse.json({ ok: true });
}