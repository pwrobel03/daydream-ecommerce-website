import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env } from "@/lib/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Adres z env ma być z chwili żądania, nie z buildu.
  await connection();
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
