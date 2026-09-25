"use client";

import { useParams, usePathname } from "next/navigation";

export function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const key = pathname + JSON.stringify(params ?? {});
  return (
    <div key={key} style={{ animation: "fade-in 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
      {children}
    </div>
  );
}