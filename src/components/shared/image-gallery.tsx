"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const imgs = images.length ? images : ["/placeholder-room.jpg"];

  const next = () => setActive((i) => (i + 1) % imgs.length);
  const prev = () => setActive((i) => (i - 1 + imgs.length) % imgs.length);

  return (
    <div>
      <div className="group relative aspect-[16/9] max-h-[520px] w-full overflow-hidden rounded-2xl">
        <Image
          src={imgs[active]}
          alt={`${name} — image ${active + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 75vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 shadow-soft backdrop-blur transition hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2.5 shadow-soft backdrop-blur transition hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </>
        )}
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-lg bg-ink/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-ink/80"
        >
          <Expand className="h-3.5 w-3.5" />
          {active + 1}/{imgs.length}
        </button>
      </div>

      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === active ? "border-brand ring-2 ring-brand/20" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={img} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <div className="relative h-[85vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={imgs[active]} alt={name} fill className="object-contain" />
          </div>
          {imgs.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="Previous">
                <ChevronLeft className="h-6 w-6 rtl:rotate-180" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="Next">
                <ChevronRight className="h-6 w-6 rtl:rotate-180" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}