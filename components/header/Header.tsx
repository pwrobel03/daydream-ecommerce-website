import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "../ui/button";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./desktop-nav";
import Container from "../Container";
import logoLight from "@/public/static/logo-light.png";
import logoDark from "@/public/static/logo-dark.png";
import Image from "next/image";
import { db } from "@/lib/db";
import { CartCounter } from "../CartCounter";
import { UserButton } from "../auth/user-button";
import { SearchInput } from "./search-input";
import { LanguageSwitcher } from "./language-switcher";
import { getTranslations } from "next-intl/server";

async function getNavCategories() {
  return db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true },
  });
}

const Header = async () => {
  const t = await getTranslations("nav");
  const categories = await getNavCategories();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <Container className="container mx-auto flex min-h-20 items-center justify-between gap-2 px-4">
        <div className="flex shrink-0 items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={logoDark}
              alt={t("home")}
              className="h-12 w-auto block dark:hidden sm:h-16"
              priority
            />
            <Image
              src={logoLight}
              alt={t("home")}
              className="h-12 w-auto hidden dark:block sm:h-16"
              priority
            />
          </Link>
        </div>

        <DesktopNav categories={categories} />

        <div className="flex items-center gap-1 sm:gap-3">
          <ModeToggle />

          {/* `asChild` daje jeden element <a> zamiast <button> w <a> —
              interaktywny element w linku to niepoprawny HTML i to on
              odbierał nazwę dostępną i linkowi, i przyciskowi. */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative text-foreground"
          >
            <Link href="/cart">
              <ShoppingBasket className="size-5" aria-hidden="true" />
              <span className="sr-only">{t("cart")}</span>
              {/* Licznik używa hooka useCart */}
              <CartCounter />
            </Link>
          </Button>

          <SearchInput />
          <LanguageSwitcher />
          <UserButton />

          <div className="lg:hidden">
            <MobileNav categories={categories} />
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
