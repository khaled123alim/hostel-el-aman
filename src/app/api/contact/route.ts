import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/services/email";
import { getSettings } from "@/lib/settings";
import { rateLimit, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { ok, retryAfter } = await rateLimit(`contact:${ipFromRequest(req)}`, 5, 60_000);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().slice(0, 120);
  const subject = String(body.subject ?? "").trim().slice(0, 150);
  const message = String(body.message ?? "").trim().slice(0, 3000);

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const settings = await getSettings();
  const recipient = settings.site?.contactEmail ?? process.env.CONTACT_EMAIL ?? "hello@stayhub.com";

  await sendEmail({
    to: recipient,
    subject: `${subject} — from ${name}`,
    html: `<h2>${subject}</h2><p><strong>From:</strong> ${name} (${email})</p><hr/><p>${message.replaceAll("\n", "<br/>")}</p>`,
  });

  return NextResponse.json({ ok: true });
}