import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { sendTemplateEmail } from "@/lib/services/email";
import { fmtDate } from "@/lib/utils";

/**
 * Sends the hostel owner an instant notification on every new reservation
 * and on every cancellation. The recipient is configured in Settings
 * (emails.ownerEmail), falling back to the site contact email.
 * Emails are never allowed to break the booking flow — errors are swallowed.
 */
export async function notifyOwner({
  template,
  reservationId,
  guest = {},
  extras = {},
}: {
  template: "reservation_new_owner" | "reservation_cancelled_owner";
  reservationId: string;
  guest?: Record<string, unknown>;
  extras?: Record<string, unknown>;
}) {
  try {
    const [settings, reservation] = await Promise.all([
      getSettings(),
      prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          room: { select: { name: true } },
          hostel: { select: { name: true } },
        },
      }),
    ]);
    if (!reservation) return;

    const to =
      (settings.emails?.ownerEmail as string) ||
      (settings.site?.contactEmail as string) ||
      "";
    if (!to) return;

    const vars = {
      reservationNumber: reservation.number,
      hostelName: reservation.hostel.name,
      roomName: reservation.room.name,
      checkIn: fmtDate(reservation.checkIn, "en"),
      checkOut: fmtDate(reservation.checkOut, "en"),
      guests: String(reservation.guests),
      total: `${reservation.currency} ${reservation.total}`,
      detailsUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/reservations/${reservation.id}`,
      ...guest,
      ...extras,
    };

    await sendTemplateEmail(template, to, vars, "en");
  } catch {
    // never break the booking / cancellation flow
  }
}