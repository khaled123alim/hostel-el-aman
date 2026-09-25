import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Star,
  MapPin,
  Phone,
  Mail,
  BedDouble,
  ShowerHead,
  CheckCircle2,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { formatMoney } from "@/lib/currency";
import { AMENITY_ICONS } from "@/lib/constants";
import { IMG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { RatingStars } from "@/components/ui/rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

const NO_BACK_ITEMS = ["No prepayment", "Pay at the hostel", "Free Wi-Fi", "Shared kitchen", "Parking", "Clean rooms", "24h reception", "Near public transport"];

export default async function HomePage() {
  const [settings, prefs] = await Promise.all([getSettings(), getPreferences()]);
  const locale = prefs.locale;
  const currency = prefs.currency ?? "DZD";
  const site = settings.site ?? {};

  const hostel = await prisma.hostel.findFirst({
    where: { status: "ACTIVE" },
    include: {
      rooms: {
        where: { status: "ACTIVE" },
        orderBy: { pricePerNight: "asc" },
      },
      amenities: true,
      _count: { select: { reviews: { where: { status: "APPROVED" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const reviews = hostel
    ? await prisma.review.findMany({
        where: { hostelId: hostel.id, status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true, country: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : [];

  const card = "rounded-2xl border border-[#020101]/6 bg-white shadow-[0_1px_3px_rgba(2,1,1,0.08),0_12px_32px_rgba(2,1,1,0.06)]";

  return (
    <div className="pb-4">
      {/* ===================== HERO ===================== */}
      <section className="relative isolate overflow-hidden bg-[#020101] text-white">
        <Image src={(hostel?.images as string[] | null)?.[0] ?? IMG.hero3} alt="" fill priority className="object-cover opacity-35" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020101]/85 via-[#020101]/70 to-[#020101]" />

        <div className="container-x relative flex min-h-[92vh] flex-col items-center justify-center py-24 text-center">
          <Reveal>
            <Image
              src="/logo.png"
              alt="Hostel El Aman logo"
              width={120}
              height={120}
              className="mx-auto h-28 w-28 rounded-3xl bg-white/10 object-contain p-2 shadow-2xl ring-1 ring-[#F4C24B]/40"
              priority
            />
          </Reveal>

          <Reveal delay={90}>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#F4C24B]/40 bg-[#F4C24B]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#F4C24B]">
              <MapPin className="h-3.5 w-3.5" /> Douera · Alger · Algeria
            </p>
          </Reveal>

          <Reveal delay={160}>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              <span className="text-[#F4C24B]">مرقد الأمان</span>
              <span className="mt-2 block text-2xl font-semibold tracking-wide text-white/85 sm:text-3xl">Hostel El Aman</span>
            </h1>
          </Reveal>

          <Reveal delay={230}>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-white/70">
              A comfortable, safe and friendly hostel in Douera — clean beds, free Wi-Fi and a
              shared kitchen. Reserve online in seconds, pay when you arrive. No card. No prepayment.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/rooms">
                  Book a room <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-[#F4C24B]">
                <Link href="#rooms">View rooms</Link>
              </Button>
            </div>
          </Reveal>

          {hostel && (
            <Reveal delay={380}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
                <span className="inline-flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-[#F4C24B]" /> {hostel.rooms.length} room types
                </span>
                <span className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4 fill-[#F4C24B] text-[#F4C24B]" /> {hostel.ratingAvg > 0 ? hostel.ratingAvg.toFixed(1) : "5.0"} ({hostel._count.reviews} reviews)
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShowerHead className="h-4 w-4 text-[#F4C24B]" /> No prepayment
                </span>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ===================== MARQUEE ===================== */}
      <section className="border-y border-[#C1811C]/30 bg-[#F4C24B] py-3.5">
        <div className="flex overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)" }}>
          <div className="flex min-w-max animate-marquee items-center gap-10 pr-10">
            {[...NO_BACK_ITEMS, ...NO_BACK_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#020101]">
                <CheckCircle2 className="h-4 w-4" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== ABOUT / WHY US ===================== */}
      {hostel && (
        <section className="section-pad">
          <div className="container-x grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="relative">
                <div className="absolute -left-4 -top-4 h-24 w-24 rounded-2xl bg-[#F4C24B]/25" />
                <div className="absolute -bottom-5 -right-5 h-32 w-32 rounded-full bg-[#C1811C]/15" />
                <div className="relative overflow-hidden rounded-3xl">
                  <Image src={(hostel.images as string[] | null)?.[1] ?? IMG.rooms[1]} alt="Hostel El Aman" width={1200} height={900} className="aspect-[4/3] w-full object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
                </div>
                <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-[#020101] px-5 py-4 text-white shadow-2xl">
                  <Star className="h-8 w-8 fill-[#F4C24B] text-[#F4C24B]" />
                  <div>
                    <p className="font-display text-xl font-extrabold text-[#F4C24B]">
                      {hostel.ratingAvg > 0 ? hostel.ratingAvg.toFixed(1) : "5.0"}
                    </p>
                    <p className="text-xs text-white/60">Loved by guests</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C1811C]">About us</p>
                <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-[#020101] sm:text-4xl">
                  مرقد الأمان — <span className="text-[#C1811C]">your home in Douera</span>
                </h2>
                <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-[#020101]/70">
                  {hostel.description}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {hostel.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a.name] ?? CheckCircle2;
                    return (
                      <span key={a.id} className="inline-flex items-center gap-2 rounded-full border border-[#C1811C]/25 bg-[#F9EBA8]/60 px-3.5 py-1.5 text-xs font-semibold text-[#020101]">
                        <Icon className="h-3.5 w-3.5 text-[#C1811C]" /> {a.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ===================== ROOMS ===================== */}
      {hostel && (
        <section id="rooms" className="section-pad bg-[#020101]">
          <div className="container-x">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F4C24B]">Rooms &amp; prices</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">Choose your room</h2>
              <p className="mt-3 text-white/60">
                Every room includes a comfy bed, fresh linen and free Wi-Fi. Prices below are per night —
                you pay in cash or by card when you check in.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hostel.rooms.map((room, i) => (
                <Reveal key={room.id} delay={(i % 3) * 90}>
                  <div className="group flex h-full flex-col overflow-hidden rounded-3xl bg-[#F9EBA8]/95 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={Array.isArray(room.images) && room.images[0] ? String(room.images[0]) : IMG.rooms[0]}
                        alt={room.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(min-width:1024px) 33vw, 100vw"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-[#020101] px-3 py-1 text-xs font-bold text-[#F4C24B]">
                        {room.capacity} guests
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg font-bold text-[#020101]">{room.name}</h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-[#020101]/55">
                            <BedDouble className="h-3.5 w-3.5" /> {room.beds} bed{room.beds > 1 ? "s" : ""} ·{" "}
                            <ShowerHead className="h-3.5 w-3.5" /> {room.bathroomType.toLowerCase()} bath
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-[#020101]/65">{room.description}</p>
                      <div className="mt-5 flex items-end justify-between border-t border-[#C1811C]/20 pt-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C1811C]">per night</p>
                          <p className="font-display text-2xl font-extrabold text-[#020101]">
                            {formatMoney(room.pricePerNight, currency, locale)}
                          </p>
                        </div>
                        <Button asChild size="sm">
                          <Link href={`/book/${hostel.slug}?room=${room.id}`}>Book</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-10 text-center">
              <Button asChild variant="accent" size="lg">
                <Link href={`/book/${hostel.slug}`}>
                  Reserve now — pay on arrival <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>
      )}

      {/* ===================== REVIEWS ===================== */}
      {reviews.length > 0 && (
        <section className="section-pad">
          <div className="container-x">
            <Reveal className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C1811C]">Guest reviews</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-[#020101] sm:text-4xl">What guests say</h2>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 90}>
                  <figure className={`${card} flex h-full flex-col p-6`}>
                    <div className="flex items-center justify-between">
                      <RatingStars value={r.rating} />
                      <span className="text-xs font-medium text-[#020101]/45">{r.createdAt.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-GB")}</span>
                    </div>
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[#020101]/70">“{r.comment}”</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-[#020101]/8 pt-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{r.user.firstName.charAt(0)}{r.user.lastName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-[#020101]">{r.user.firstName} {r.user.lastName}</p>
                        <p className="text-xs text-[#020101]/50">{r.user.country ?? "—"}</p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== LOCATION ===================== */}
      <section className="section-pad bg-[#F9EBA8]/45">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C1811C]">Find us</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-[#020101] sm:text-4xl">In the heart of Douera</h2>
            <p className="mt-3 text-[15px] text-[#020101]/65">{site.address ?? "Douera, Alger, Algeria"}</p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="map-frame relative h-72 overflow-hidden rounded-3xl md:h-full">
                <iframe
                  title="Hostel El Aman — Google Maps"
                  src={`https://www.google.com/maps?q=Hostel+El+Aman+Douera&z=16&hl=${locale}&output=embed`}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex h-full flex-col justify-center gap-5">
                <a
                  href="https://share.google/Fxe6xMjPReKrkFu1R"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${card} flex items-start gap-4 p-6 transition hover:-translate-y-0.5`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#020101] text-[#F4C24B]">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#020101]">Address</p>
                    <p className="mt-1 text-sm text-[#020101]/65">{site.address ?? "Douera, Alger, Algeria"}</p>
                  </div>
                </a>
                <a href={`tel:${site.phone ?? ""}`} className={`${card} flex items-start gap-4 p-6 transition hover:-translate-y-0.5`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#020101] text-[#F4C24B]">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#020101]">Phone / WhatsApp</p>
                    <p className="mt-1 text-sm text-[#020101]/65" dir="ltr">{site.phone ?? "—"}</p>
                  </div>
                </a>
                <a href={`mailto:${site.contactEmail ?? ""}`} className={`${card} flex items-start gap-4 p-6 transition hover:-translate-y-0.5`}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#020101] text-[#F4C24B]">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#020101]">Email</p>
                    <p className="mt-1 text-sm text-[#020101]/65" dir="ltr">{site.contactEmail ?? "—"}</p>
                  </div>
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="container-x pb-10 pt-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#020101] px-6 py-14 text-center text-white sm:px-12">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#F4C24B]/20 blur-2xl" />
            <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-[#C1811C]/25 blur-2xl" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
                Ready to stay with us? <span className="text-[#F4C24B]">مرقد الأمان</span>
              </h2>
              <p className="mt-3 text-white/70">
                No prepayment. No hidden fees. Book your bed in under a minute and pay when you arrive.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="accent" size="lg">
                  <Link href="/rooms">Book a room now</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-[#F4C24B]">
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}