import Link from "next/link";
import { ShoppingBasket, User } from "lucide-react";
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

async function getNavCategories() {
  return db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true },
  });
}

const Header = async () => {
  const categories = await getNavCategories();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary bg-background/80 backdrop-blur-md transition-all">
      <Container className="container mx-auto flex min-h-20 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src={logoDark}
              alt="DayDream Logo Light"
              className="h-16 w-auto block dark:hidden group-hover:scale-x-105 transition-transform"
              priority
            />
            {/* Logo dla trybu Ciemnego (widoczne tylko w trybie dark) */}
            <Image
              src={logoLight}
              alt="DayDream Logo Dark"
              className="h-16 w-auto hidden dark:block group-full group-hover:scale-x-105 transition-transform"
              priority
            />
          </Link>
        </div>

        <DesktopNav categories={categories} />

        <div className="flex items-center gap-2 sm:gap-4">
          <ModeToggle />

          <Link href="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground hover:bg-accent transition-all rounded-full"
            >
              <ShoppingBasket className="h-12 w-12" />
              {/* Licznik używa hooka useCart */}
              <CartCounter />
            </Button>
          </Link>

          <SearchInput />
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
