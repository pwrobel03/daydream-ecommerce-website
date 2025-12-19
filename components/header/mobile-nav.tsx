"use client";

import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/Brand/logo.jpeg";

interface Category {
  id: string | number;
  name: string;
  slug: string;
}

export const MobileNav = ({ categories }: { categories: Category[] }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden text-foreground"
        >
          <Menu className="h-7 w-7" />
        </Button>
      </SheetTrigger>

      {/* side="top" lub side="left" + w-full h-full sprawi, że zajmiemy cały ekran */}
      <SheetContent
        side="right"
        className="w-screen sm:max-w-none h-full border-none bg-background p-0 overflow-auto"
      >
        <div className="flex flex-col h-full">
          {/* NAGŁÓWEK MENU - z przyciskiem zamknięcia w rogu */}
          <div className="flex items-center justify-between p-2 px-4 border-b border-secondary">
            <SheetTitle className="text-2xl font-black text-primary italic uppercase tracking-tighter">
              <Link href="/" className="group flex items-center gap-2">
                <Image src={logo} alt="DayDream Logo" className="h-16 w-auto" />
              </Link>
            </SheetTitle>
            <SheetClose className="absolute right-4 rounded-full hover:bg-accent transition-colors">
              <X className="h-7 w-7 text-foreground" />
            </SheetClose>
          </div>

          {/* CENTRUM: KATEGORIE */}
          <nav className="flex-1 flex flex-col items-center justify-center mt-4 gap-4 md:gap-8">
            {categories.map((cat, index) => (
              <SheetClose key={cat.id} asChild>
                <Link
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col items-center gap-1"
                >
                  <span className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] text-foreground transition-all group-hover:text-primary group-hover:scale-110">
                    {cat.name}
                  </span>
                  {/* Subtelna linia pod nazwą pojawiająca się przy hoverze */}
                  <div className="h-1 w-0 bg-primary transition-all group-hover:w-full rounded-full" />
                </Link>
              </SheetClose>
            ))}

            {/* DODATKOWE AKCJE NA ŚRODKU */}
            {/* <div className="mt-12 flex flex-col items-center gap-6">
              <SheetClose asChild>
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-lg font-semibold text-muted-foreground hover:text-foreground"
                >
                  Twoje Konto
                </Link>
              </SheetClose>
            </div> */}
          </nav>

          {/* STOPKA MENU - opcjonalnie social media lub info */}
          <div className="p-8 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Natural. Health. With passion.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
