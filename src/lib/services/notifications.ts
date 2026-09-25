import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function notifyUser(input: {
  userId: string;
  type?: NotificationType;
  title: string;
  content?: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "INFO",
      title: input.title,
      content: input.content,
      link: input.link,
    },
  });
}

export async function notifyAdmins(input: {
  type?: NotificationType;
  title: string;
  content?: string;
  link?: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: { name: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST"] } } },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: admins.map((u) => ({
      userId: u.id,
      type: input.type ?? "INFO",
      title: input.title,
      content: input.content,
      link: input.link,
    })),
  });
  return admins.length;
}

export async function onReservationCreated(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { customer: true, hostel: true, room: true },
  });
  if (!reservation) return;
  await notifyAdmins({
    type: "SUCCESS",
    title: "New reservation",
    content: `${reservation.number} — ${reservation.hostel.name} · ${reservation.room.name}`,
    link: `/admin/reservations/${reservation.id}`,
  });
}

export async function onPaymentReceived(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { customer: true },
  });
  if (!reservation) return;
  await notifyUser({
    userId: reservation.customerId,
    type: "SUCCESS",
    title: "Payment received",
    content: `Payment for reservation ${reservation.number} has been received.`,
    link: `/account/reservations/${reservation.id}`,
  });
  await notifyAdmins({
    type: "SUCCESS",
    title: "Payment received",
    content: `${reservation.number} — payment received.`,
    link: `/admin/reservations/${reservation.id}`,
  });
}

export async function onReservationCancelled(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { customer: true },
  });
  if (!reservation) return;
  await notifyUser({
    userId: reservation.customerId,
    type: "WARNING",
    title: "Reservation cancelled",
    content: `Reservation ${reservation.number} was cancelled.`,
    link: `/account/reservations/${reservation.id}`,
  });
}

export async function sendSpecialOfferNotification(title: string, content: string) {
  const customers = await prisma.user.findMany({
    where: { role: { name: "CUSTOMER" } },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: customers.map((u) => ({
      userId: u.id,
      type: "SUCCESS",
      title,
      content,
      link: "/offers",
    })),
  });
}