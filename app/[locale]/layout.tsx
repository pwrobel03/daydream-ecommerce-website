import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Suspense } from "react";
import { HeaderSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import "../globals.css";
import Header from "@/components/header/Header";
import { ThemeProvider } from "@/components/header/theme-provider"; // importuj swój nowy provider
import Footer from "@/components/Footer";
import { DemoNotice } from "@/components/demo-notice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase sprawia, że względne URL-e w Open Graph rozwijają się do
  // pełnych adresów — bez tego podgląd linku nie znajdzie obrazka.
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Daydream — handcrafted granola & breakfast bars",
    // Podstrony podają samą nazwę, szablon dokłada markę.
    template: "%s | Daydream",
  },
  description:
    "Small-batch granola, muesli and breakfast bars. Handcrafted from whole ingredients, shipped fresh.",
  openGraph: {
    type: "website",
    siteName: "Daydream",
    title: "Daydream — handcrafted granola & breakfast bars",
    description:
      "Small-batch granola, muesli and breakfast bars. Handcrafted from whole ingredients, shipped fresh.",
    url: env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Daydream — handcrafted granola & breakfast bars",
    description:
      "Small-batch granola, muesli and breakfast bars. Handcrafted from whole ingredients, shipped fresh.",
  },
};

// SessionProvider nie dostaje sesji z serwera i dociąga ją sam po stronie
// klienta. Odczyt sesji w root layoucie blokowałby prerenderowanie każdej trasy
// w aplikacji — nie da się mieć naraz statycznej powłoki i sesji renderowanej
// serwerowo na szczycie drzewa. Kosztem jest krótki błysk stanu niezalogowanego
// w przycisku konta przy pierwszym malowaniu.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Nieznana lokalizacja w URL-u to 404, a nie ciche wpadnięcie na domyślną.
  if (!hasLocale(routing.locales, locale)) notFound();

  // Oznacza lokalizację jako statyczną dla tego renderu. Bez tego każde
  // odwołanie do tłumaczeń liczy się jako dane żądania i blokuje
  // prerenderowanie całej trasy przy włączonym cacheComponents.
  setRequestLocale(locale);

  // Komunikaty przekazujemy do providera jawnie. Bez tego komponenty klienckie
  // sięgają po nie z kontekstu żądania, co czyni każdą stronę z takim
  // komponentem dynamiczną i blokuje prerenderowanie.
  const messages = await getMessages();

  return (
    <SessionProvider>
      <html lang={locale} suppressHydrationWarning data-scrool-behavior="smooth">
        {/* Dodajemy min-h-screen do body, aby tło zawsze wypełniało ekran */}
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        >
          <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            <DemoNotice />
            <Suspense fallback={<HeaderSkeleton />}>
              <Header />
            </Suspense>
            {/* Owijamy children w tag main, aby poprawnie zarządzać przestrzenią */}
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
