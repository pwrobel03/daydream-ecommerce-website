import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel, konto i koszyk nie mają czego szukać w indeksie, a część z nich
      // i tak wymaga sesji. Webhook i cron to endpointy maszynowe.
      disallow: ["/dashboard/", "/cart/", "/order/", "/auth/", "/api/"],
    },
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
