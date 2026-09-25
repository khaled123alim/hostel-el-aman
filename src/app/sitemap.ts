import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/rooms`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const hostels = await prisma.hostel.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    });
    const hostelRoutes: MetadataRoute.Sitemap = hostels.map((h) => ({
      url: `${base}/rooms`,
      lastModified: h.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));
    return [...staticRoutes, ...hostelRoutes];
  } catch {
    return staticRoutes;
  }
}