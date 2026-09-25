import Image from "next/image";
import { ShieldCheck, Coins, Users, Home, Clock, KeyRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getPreferences } from "@/lib/preferences";
import { IMG } from "@/lib/constants";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [settings, prefs] = await Promise.all([getSettings(), getPreferences()]);
  const hostel = await prisma.hostel.findFirst({ where: { status: "ACTIVE" }, include: { amenities: true }, orderBy: { createdAt: "asc" } });

  const highlights = [
    { icon: Coins, title: "No prepayment", desc: "Reserve online in seconds. You pay when you arrive — cash or card, all in DZD." },
    { icon: ShieldCheck, title: "Safe & quiet", desc: "A calm, family-friendly space in Douera with 24h reception and secure rooms." },
    { icon: Users, title: "For everyone", desc: "Dorms, private rooms and family rooms — solo travellers, couples and groups." },
    { icon: Home, title: "Home comforts", desc: "Shared kitchen, fresh linen, hot showers and free Wi-Fi throughout." },
    { icon: Clock, title: "Flexible stays", desc: "Short city breaks or longer stays — the longer you stay, the better the rate." },
    { icon: KeyRound, title: "Easy check-in", desc: "Check-in from 14:00, check-out by 12:00. Just show your ID." },
  ];

  return (
    <div className="pb-14">
      <section className="relative isolate overflow-hidden bg-[#020101] pb-14 pt-20 text-white">
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#F4C24B]/15 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[#C1811C]/20 blur-3xl" />
        <div className="container-x relative">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F4C24B]">About us</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold sm:text-5xl">
            مرقد الأمان <span className="text-[#F4C24B]">·</span> Hostel El Aman
          </h1>
          <p className="mt-4 max-w-xl text-white/70">
            A small, friendly hostel in Douera, Algiers. We built it to feel like home —
            clean beds, warm welcome, and honest prices with no hidden fees.
          </p>
        </div>
      </section>

      <section className="container-x py-14">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="grid grid-cols-2 gap-4">
              <Image src={(hostel?.images as string[] | null)?.[0] ?? IMG.hostels[0]} alt="Hostel El Aman" width={600} height={800} className="aspect-[3/4] w-full rounded-3xl object-cover" />
              <div className="mt-10 space-y-4">
                <Image src={(hostel?.images as string[] | null)?.[1] ?? IMG.rooms[2]} alt="Rooms at Hostel El Aman" width={600} height={400} className="aspect-[4/3] w-full rounded-3xl object-cover" />
                <Image src={(hostel?.images as string[] | null)?.[2] ?? IMG.rooms[7]} alt="Hostel El Aman lounge" width={600} height={400} className="aspect-[4/3] w-full rounded-3xl object-cover" />
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C1811C]">Our story</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-[#020101] sm:text-4xl">
                A home away from home in <span className="text-[#C1811C]">Douera</span>
              </h2>
              <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-[#020101]/70">
                {hostel?.description ?? "Hostel El Aman is a family-run hostel in Douera, Algiers. Clean, comfortable and affordable — with online reservations and payment only on arrival."}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {(hostel?.amenities ?? []).map((a) => (
                  <span key={a.id} className="inline-flex items-center rounded-full border border-[#C1811C]/25 bg-[#F9EBA8]/60 px-3.5 py-1.5 text-xs font-semibold text-[#020101]">
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#020101] py-14">
        <div className="container-x">
          <Reveal className="mx-auto max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F4C24B]">Why stay with us</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">Everything you need, nothing you don't</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h, i) => (
              <Reveal key={h.title} delay={(i % 3) * 90}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F4C24B]/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4C24B] text-[#020101]">
                    <h.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold text-white">{h.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{h.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {(hostel?.houseRules as string[] | null)?.length ? (
        <section className="container-x py-14">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C1811C]">Good to know</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-[#020101] sm:text-4xl">House rules</h2>
            </Reveal>
            <Reveal delay={100}>
              <ul className="mt-8 divide-y divide-[#020101]/8 rounded-3xl border border-[#020101]/8 bg-white px-8 py-4">
                {(hostel?.houseRules as string[] | null)?.map((rule) => (
                  <li key={rule} className="flex items-center gap-3 py-3.5 text-sm text-[#020101]/75">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#F4C24B]" /> {rule}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="container-x pb-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-[#F4C24B] px-6 py-12 text-center text-[#020101] sm:px-12">
            <p className="font-display text-2xl font-extrabold sm:text-3xl">Ready to book your stay?</p>
            <p className="mt-2 text-sm font-medium text-[#020101]/75">Reserve in under a minute — no prepayment required.</p>
            <a href="/rooms" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#020101] px-6 py-3 text-sm font-semibold text-[#F4C24B] transition hover:bg-[#020101]/90">
              See rooms &amp; prices
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}