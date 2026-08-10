import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { reportError } from "@/lib/logger";

const base = env.NEXT_PUBLIC_APP_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/category/all`, changeFrequency: "daily", priority: 0.9 },
  ];

  // Baza bywa nieosiągalna przy budowaniu obrazu — mapa ma wtedy zawierać
  // trasy statyczne zamiast wywracać build.
  try {
    const [products, categories] = await Promise.all([
      db.product.findMany({ select: { slug: true, updatedAt: true } }),
      db.category.findMany({ select: { slug: true } }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((c) => ({
        url: `${base}/category/${c.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...products.map((p) => ({
        url: `${base}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    reportError(error, { area: "sitemap" });
    return staticRoutes;
  }
}
