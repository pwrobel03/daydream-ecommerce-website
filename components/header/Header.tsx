import Link from "next/link";
import { ShoppingBasket, User } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "../ui/button";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./desktop-nav";
import Container from "../Container";
import logo from "@/assets/Brand/logo.jpeg";
import Image from "next/image";
import { db } from "@/lib/db";
import { CartCounter } from "../CartCounter";

const Header = async () => {
  // Pobieramy kategorie bezpośrednio z bazy danych
  const categories = await db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true, slug: true },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary bg-background/80 backdrop-blur-md transition-all">
      <Container className="container mx-auto flex min-h-20 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <Image
              src={logo}
              alt="DayDream Logo"
              className="h-16 w-auto"
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

          <Button
            variant="default"
            size="sm"
            className="hidden sm:flex rounded-full px-6 font-semibold"
          >
            <User className="h-4 w-4 mr-2" />
            Account
          </Button>

          <div className="lg:hidden">
            <MobileNav categories={categories} />
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
