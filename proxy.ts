// proxy.ts — następca middleware.ts w Next.js 16.
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";
import { env } from "@/lib/env";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";

const intlMiddleware = createIntlMiddleware(routing);

/** Ścieżka bez prefiksu języka — reguły dostępu operują na jednej postaci. */
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/**
 * Kolejność jest istotna: najpierw decyzja o dostępie, potem warstwa językowa.
 *
 * Opakowanie `auth()` z Auth.js nie nadaje się tutaj — przechwytuje odpowiedź
 * next-intl i zamienia jej wewnętrzne przepisanie ścieżki na przekierowanie,
 * przez co "/" przekierowywało samo na siebie w nieskończoność. Sesję czytamy
 * więc bezpośrednio z tokena, a odpowiedź next-intl zwracamy nietkniętą.
 */
export default async function proxy(req: NextRequest) {
  const path = stripLocale(req.nextUrl.pathname);

  if (path.startsWith(apiAuthPrefix)) return NextResponse.next();

  const isPublicRoute = publicRoutes.some((route) =>
    route === "/" ? path === "/" : path.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(path);

  const token = await getToken({
    req,
    secret: env.AUTH_SECRET,
    secureCookie: req.nextUrl.protocol === "https:",
  });
  const isLoggedIn = !!token;

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.nextUrl));
  }

  if (!isAuthRoute && !isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.nextUrl));
  }

  return intlMiddleware(req);
}

export const config = {
  // Wyklucza pliki statyczne, wewnętrzne trasy Next oraz endpointy maszynowe,
  // które nie mają wersji językowych (webhook, health, cron, sitemap, uploady).
  matcher: [
    "/((?!api|_next|_vercel|uploads|sitemap.xml|robots.txt|opengraph-image|.*\\..*).*)",
  ],
};
