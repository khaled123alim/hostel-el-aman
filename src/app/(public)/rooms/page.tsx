import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RoomsBooker } from "@/components/shared/rooms-booker";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const [settings, prefs] = await Promise.all([getSettings(), getPreferences()]);
  const locale = prefs.locale;
  const currency = prefs.currency ?? "DZD";

  const hostel = await prisma.hostel.findFirst({
    where: { status: "ACTIVE" },
    include: {
      rooms: { where: { status: "ACTIVE" }, orderBy: { pricePerNight: "asc" } },
      _count: { select: { reviews: { where: { status: "APPROVED" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const subtitle = settings.reservations?.checkInDefault
    ? `Check-in from ${settings.reservations.checkInDefault} · Check-out by ${settings.reservations.checkOutDefault}`
    : "Check-in from 14:00 · Check-out by 12:00";

  return (
    <div className="pb-14">
      <section className="border-b border-[#020101]/8 bg-[#020101] pb-10 pt-20 text-center text-white">
        <div className="container-x">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F4C24B]">Rooms &amp; prices</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">مرقد الأمان <span className="text-[#F4C24B]">·</span> Hostel El Aman</h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-white/65">
            All prices in Algerian Dinar, per night. No prepayment — you pay when you arrive.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F4C24B]/15 px-4 py-1.5 text-xs font-semibold text-[#F4C24B]">{subtitle}</p>
        </div>
      </section>

      {hostel?.rooms.length ? (
        <RoomsBooker
          hostelId={hostel.id}
          slug={hostel.slug}
          rooms={hostel.rooms.map((room) => ({
            id: room.id,
            name: room.name,
            type: room.type,
            capacity: room.capacity,
            beds: room.beds,
            bathroomType: room.bathroomType,
            priceLabel: formatMoney(room.pricePerNight, currency, locale),
            images: room.images,
            description: room.description ?? "",
          }))}
        />
      ) : (
        <div className="container-x mt-12">
          <p className="text-center text-sm text-[#020101]/55">Rooms are being added — check back soon.</p>
        </div>
      )}

      {hostel && (
        <div className="container-x mt-12 text-center">
          <Reveal>
            <Button asChild variant="accent" size="lg">
              <Link href={`/book/${hostel.slug}`}>
                Reserve now — no prepayment <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </Reveal>
        </div>
      )}
    </div>
  );
}