import { NextResponse } from "next/server";
import type { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/permissions";
import { updateSetting, hexToRgbTriplet } from "@/lib/settings";
import { auditAdmin } from "@/lib/services/audit";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";
import {
  settingsSiteSchema,
  settingsBrandSchema,
  settingsGeneralSchema,
  settingsReservationsSchema,
  settingsPaymentsSchema,
  settingsTaxSchema,
  settingsCancellationSchema,
} from "@/lib/validations";
import { badRequest, forbidden, unauthorized } from "@/lib/api-errors";

export const runtime = "nodejs";

type AnySchema = z.ZodTypeAny;

const SCHEMAS: Record<string, AnySchema> = {
  site: settingsSiteSchema,
  brand: settingsBrandSchema,
  general: settingsGeneralSchema,
  reservations: settingsReservationsSchema,
  payments: settingsPaymentsSchema,
  tax: settingsTaxSchema,
  cancellation: settingsCancellationSchema,
};

function normalize(group: string, raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  if (group === "brand") {
    for (const k of ["primary", "primaryDark", "accent", "accentDark"]) {
      if (typeof out[k] === "string") out[k] = hexToRgbTriplet(out[k] as string);
    }
  }
  if (group === "general") {
    const toArray = (v: unknown) =>
      typeof v === "string"
        ? v.split(",").map((x) => x.trim()).filter(Boolean)
        : Array.isArray(v)
          ? v
          : [];
    out.supportedCurrencies = toArray(out.supportedCurrencies);
    out.supportedLocales = toArray(out.supportedLocales) as string[];
  }
  return out;
}

export async function PUT(req: Request) {
  const admin = await requireApiAdmin();
  if (!admin) return unauthorized();
  if (!can(admin.roleName as never, "settings.manage")) return forbidden();

  const limited = await rateLimit(`admin-settings:${admin.userId}`, 30, 60_000);
  if (!limited.ok) return NextResponse.json({ error: "errors.tooManyAttempts" }, { status: 429 });

  let body: { key?: string; value?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (!body.key || !body.value || typeof body.value !== "object") return badRequest();

  const raw = normalize(body.key, body.value);
  const schema = SCHEMAS[body.key];
  if (schema) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return badRequest();
  }
  const coerced = SCHEMAS[body.key]?.parse(raw) ?? raw;

  await updateSetting(body.key, coerced);
  await auditAdmin(admin.userId, "SETTINGS_UPDATED", "settings", body.key, undefined, ipFromRequest(req));

  return NextResponse.json({ ok: true });
}