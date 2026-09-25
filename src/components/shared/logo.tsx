import Image from "next/image";

export function Logo({ name, href = "/", className }: { name?: string; href?: string; className?: string }) {
  return (
    <a href={href} className={"group inline-flex items-center gap-2.5 " + (className ?? "")}>
      <Image
        src="/logo.png"
        alt={name ?? "Hostel logo"}
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl object-contain"
        priority
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight text-ink">{name ?? "Hostel El Aman"}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Douera · Alger</span>
      </span>
    </a>
  );
}