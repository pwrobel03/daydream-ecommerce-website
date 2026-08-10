import { Suspense } from "react";
import { HeaderSkeleton } from "@/components/skeletons";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Header from "@/components/header/Header";
import { ThemeProvider } from "@/components/header/theme-provider"; // importuj swój nowy provider
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DayDeam",
  description: "Ecommerce website for educational purposes",
};

// SessionProvider nie dostaje sesji z serwera i dociąga ją sam po stronie
// klienta. Odczyt sesji w root layoucie blokowałby prerenderowanie każdej trasy
// w aplikacji — nie da się mieć naraz statycznej powłoki i sesji renderowanej
// serwerowo na szczycie drzewa. Kosztem jest krótki błysk stanu niezalogowanego
// w przycisku konta przy pierwszym malowaniu.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en" suppressHydrationWarning data-scrool-behavior="smooth">
        {/* Dodajemy min-h-screen do body, aby tło zawsze wypełniało ekran */}
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster />
            <Suspense fallback={<HeaderSkeleton />}>
              <Header />
            </Suspense>
            {/* Owijamy children w tag main, aby poprawnie zarządzać przestrzenią */}
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
