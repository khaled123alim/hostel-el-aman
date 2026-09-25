import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Mail transport abstraction.
 * - If SMTP_* env vars are configured → real SMTP delivery via Nodemailer.
 * - Otherwise → the email is logged to the console (development mode) so the
 *   full flow works out of the box without a mail server.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; preview?: string }> {
  const host = process.env.SMTP_HOST;
  const settings = await getSettings();
  const enabled = host ? true : settings.emails?.enabled === true;

  if (!enabled || !host) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`\n[email:dev] To: ${payload.to}\n[email:dev] Subject: ${payload.subject}\n[email:dev] ---`);
      return { sent: false, preview: payload.html.slice(0, 500) };
    }
    return { sent: false };
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "StayHub <noreply@example.com>",
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
  return { sent: true };
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function renderTemplate(body: string, vars: Record<string, unknown>): string {
  let out = body;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, esc(v));
  }
  // replace leftover placeholders
  out = out.replace(/\{\{[a-zA-Z0-9_.]+\}\}/g, "");
  return out;
}

const DEFAULT_TEMPLATES: Record<string, { subjectEn: string; bodyEn: string }> = {
  welcome: {
    subjectEn: "Welcome to {{siteName}}!",
    bodyEn: `<h1>Welcome, {{firstName}}!</h1><p>We're thrilled to have you on board. Explore hostels, unlock special offers and manage your bookings in one place.</p><p><a href="{{appUrl}}" style="background:#16325a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Start exploring</a></p>`,
  },
  verify_email: {
    subjectEn: "Verify your email address",
    bodyEn: `<h1>Verify your email</h1><p>Hi {{firstName}}, please confirm your email address to activate your account.</p><p><a href="{{verifyUrl}}" style="background:#16325a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  },
  reset_password: {
    subjectEn: "Reset your password",
    bodyEn: `<h1>Password reset</h1><p>Hi {{firstName}}, we received a request to reset your password.</p><p><a href="{{resetUrl}}" style="background:#16325a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Reset password</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  },
  reservation_confirmed: {
    subjectEn: "Reservation confirmed — {{reservationNumber}}",
    bodyEn: `<h1>You're booked, {{firstName}}!</h1><p>Reservation <strong>{{reservationNumber}}</strong> at <strong>{{hostelName}}</strong> is confirmed.</p><table><tr><td>Room</td><td>{{roomName}}</td></tr><tr><td>Check-in</td><td>{{checkIn}}</td></tr><tr><td>Check-out</td><td>{{checkOut}}</td></tr><tr><td>Guests</td><td>{{guests}}</td></tr><tr><td>Total</td><td>{{total}}</td></tr></table><p><a href="{{detailsUrl}}" style="background:#16325a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">View reservation</a></p>`,
  },
  payment_received: {
    subjectEn: "Payment received — {{reservationNumber}}",
    bodyEn: `<h1>Thank you for your payment!</h1><p>We received your payment of <strong>{{amount}}</strong> for reservation <strong>{{reservationNumber}}</strong>.</p><p>See you soon at {{hostelName}}!</p>`,
  },
  reservation_cancelled: {
    subjectEn: "Reservation cancelled — {{reservationNumber}}",
    bodyEn: `<h1>Reservation cancelled</h1><p>Your reservation <strong>{{reservationNumber}}</strong> at <strong>{{hostelName}}</strong> has been cancelled.</p><p>{{reason}}</p><p>We hope to host you another time.</p>`,
  },
  checkin_reminder: {
    subjectEn: "You check in tomorrow!",
    bodyEn: `<h1>Check-in reminder</h1><p>Hi {{firstName}}, you check in to <strong>{{hostelName}}</strong> tomorrow at {{checkInTime}}.</p><p>Reservation: {{reservationNumber}} · Room: {{roomName}}</p><p>We can't wait to welcome you!</p>`,
  },
  checkout_reminder: {
    subjectEn: "Your stay ends tomorrow",
    bodyEn: `<h1>Check-out reminder</h1><p>Hi {{firstName}}, your stay at <strong>{{hostelName}}</strong> ends tomorrow. Check-out is at {{checkOutTime}}.</p><p>Reservation: {{reservationNumber}}</p>`,
  },
  reservation_new_owner: {
    subjectEn: "New reservation — {{reservationNumber}} · {{firstName}} {{lastName}}",
    bodyEn: `<h1 style="color:#020101">New reservation received</h1><p>A guest just booked <strong>{{roomName}}</strong> at {{hostelName}}.</p><table cellpadding="6"><tr><td>Guest</td><td>{{firstName}} {{lastName}}</td></tr><tr><td>Check-in</td><td>{{checkIn}}</td></tr><tr><td>Check-out</td><td>{{checkOut}}</td></tr><tr><td>Guests</td><td>{{guests}}</td></tr><tr><td>Phone</td><td>{{phone}}</td></tr><tr><td>Total (paid on-site)</td><td>{{total}}</td></tr></table><p>Special requests: {{specialRequests}}</p><p><a href="{{detailsUrl}}" style="display:inline-block;background:#020101;color:#F4C24B;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Open reservation</a></p>`,
  },
  reservation_cancelled_owner: {
    subjectEn: "Reservation cancelled — {{reservationNumber}}",
    bodyEn: `<h1 style="color:#020101">A reservation was cancelled</h1><p><strong>{{firstName}} {{lastName}}</strong> cancelled reservation <strong>{{reservationNumber}}</strong>.</p><table cellpadding="6"><tr><td>Room</td><td>{{roomName}}</td></tr><tr><td>Check-in</td><td>{{checkIn}}</td></tr><tr><td>Check-out</td><td>{{checkOut}}</td></tr><tr><td>Reason</td><td>{{reason}}</td></tr></table><p>Market the room again and update availability if needed.</p>`,
  },
};

export async function ensureDefaultTemplates() {
  for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
    const exists = await prisma.emailTemplate.findUnique({ where: { key_locale: { key, locale: "en" } } });
    if (!exists) {
      await prisma.emailTemplate.create({
        data: { key, locale: "en", subject: tpl.subjectEn, body: tpl.bodyEn },
      });
    }
  }
}

export async function getRenderedEmail(
  key: string,
  vars: Record<string, unknown>,
  locale: string = "en"
): Promise<{ subject: string; html: string }> {
  const tpl = await prisma.emailTemplate.findFirst({
    where: { key, locale },
  });
  const fallback = await prisma.emailTemplate.findFirst({ where: { key, locale: "en" } });
  const active = tpl ?? fallback;
  if (!active) {
    const defaultTpl = DEFAULT_TEMPLATES[key];
    if (!defaultTpl) return { subject: key, html: "" };
    return { subject: defaultTpl.subjectEn, html: renderTemplate(defaultTpl.bodyEn, vars) };
  }
  return {
    subject: renderTemplate(active.subject, vars),
    html: renderTemplate(active.body, vars),
  };
}

async function emailVarsBase(to: string) {
  const settings = await getSettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    siteName: settings.site?.name ?? "StayHub",
    appUrl,
    to,
  };
}

export async function sendTemplateEmail(
  key: string,
  to: string,
  vars: Record<string, unknown>,
  locale = "en"
) {
  const base = await emailVarsBase(to);
  const { subject, html } = await getRenderedEmail(key, { ...base, ...vars }, locale);
  return sendEmail({ to, subject, html });
}