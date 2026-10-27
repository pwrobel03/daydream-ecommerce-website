"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
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
  const t = useTranslations("nav");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden text-foreground">
          <Menu className="size-5" aria-hidden="true" />
          <span className="sr-only">{t("menu")}</span>
        </Button>
      </SheetTrigger>

      {/* ADR 0016 motion: sheet 300ms ease-out in, 200ms ease-in out (the sheet default is 500/300). */}
      <SheetContent
        side="right"
        className="h-full w-screen overflow-auto rounded-none border-none bg-background p-0 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:duration-200 data-[state=closed]:ease-[cubic-bezier(0.4,0,1,1)] data-[state=open]:duration-300 sm:max-w-none"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <SheetTitle asChild>
              <Link href="/">
                <Image src={logo} alt={t("home")} className="h-12 w-auto" />
              </Link>
            </SheetTitle>
            <SheetClose className="flex size-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-accent">
              <X className="size-5 text-foreground" aria-hidden="true" />
              <span className="sr-only">{t("close")}</span>
            </SheetClose>
          </div>

          <nav className="flex flex-1 flex-col items-start gap-1 px-4 py-6">
            {categories.map((cat) => (
              <SheetClose key={cat.id} asChild>
                <Link
                  href={`/category/${cat.slug}`}
                  className="w-full rounded-md px-3 py-3 text-xl font-medium text-foreground transition-colors duration-150 hover:bg-accent hover:text-primary-text"
                >
                  {cat.name}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <p className="p-6 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
