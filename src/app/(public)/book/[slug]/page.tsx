import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { translateKey } from "@/lib/i18n";
import { convertAmount, formatMoney } from "@/lib/currency";
import { checkRoomAvailability } from "@/lib/services/reservation";
import { parseDay } from "@/lib/utils";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import type { BookingRoomOption } from "@/components/shared/booking-panel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hostel = await prisma.hostel.findUnique({ where: { slug } });
  return hostel ? { title: `Book — ${hostel.name}`, robots: { index: false } } : { title: "Book" };
}

function sp(q: Record<string, string | string[] | undefined>, key: string): string {
  const v = q[key];
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function BookPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [session, currentUser, settings, prefs] = await Promise.all([
    getSession(),
    getCurrentUser(),
    getSettings(),
    getPreferences(),
  ]);
  const locale = prefs.locale;
  const currency = prefs.currency;
  const base = settings.general?.defaultCurrency ?? "EUR";
  const t = (k: string, vars?: Record<string, string | number>) => translateKey(locale, k, vars);

  if (!session || !currentUser) {
    const next = encodeURIComponent(`/book/${slug}?${new URLSearchParams(query as Record<string, string>).toString()}`);
    redirect(`/login?next=${next}`);
  }

  const hostel = await prisma.hostel.findFirst({
    where: { slug, status: "ACTIVE" },
    include: { rooms: { where: { status: "ACTIVE" } } },
  });
  if (!hostel) notFound();

  const checkIn = sp(query, "checkIn");
  const checkOut = sp(query, "checkOut");
  const guests = Math.max(1, parseInt(sp(query, "guests") || "2", 10) || 2);
  const roomParam = sp(query, "room");
  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);

  const roomOptions: BookingRoomOption[] = await Promise.all(
    hostel.rooms.map(async (room) => {
      const { value } = await convertAmount(room.pricePerNight, base, currency);
      let available: boolean | null = null;
      if (hasDates) {
        try {
          const res = await checkRoomAvailability(room.id, parseDay(checkIn), parseDay(checkOut));
          available = res.available;
        } catch {
          available = false;
        }
      }
      return {
        id: room.id,
        name: room.name,
        type: room.type,
        number: room.number,
        capacity: room.capacity,
        beds: room.beds,
        bathroomType: room.bathroomType,
        priceLabel: formatMoney(value, currency, locale),
        available,
      };
    })
  );

  const roomExists = roomOptions.some((r) => r.id === roomParam);

  return (
    <div className="pb-14">
      <section className="border-b border-slate-100 bg-white pb-6 pt-8">
        <div className="container-x">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: t("nav.hostels"), href: "/hostels" },
              { label: hostel.name, href: `/hostels/${hostel.slug}` },
              { label: t("booking.confirmReservation") },
            ]}
            className="mb-4"
          />
          <h1 className="heading-2xl">{t("booking.confirmReservation")}</h1>
          <p className="mt-1 text-sm text-ink-soft">{hostel.name}</p>
        </div>
      </section>

      <section className="container-x mt-8">
        <BookingWizard
          hostel={{ id: hostel.id, name: hostel.name, checkInTime: hostel.checkInTime, checkOutTime: hostel.checkOutTime }}
          rooms={roomOptions}
          initial={{
            roomId: roomExists ? roomParam : undefined,
            checkIn,
            checkOut,
            guests: String(guests),
          }}
          user={{
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: currentUser.phone,
            country: currentUser.country,
          }}
          currency={currency}
        />
      </section>
    </div>
  );
}