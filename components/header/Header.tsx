import Link from "next/link";
import { ShoppingBasket, User } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "../ui/button";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./desktop-nav";
import Container from "../Container";
import logo from "@/assets/Brand/logo.jpeg";
import Image from "next/image";

const Header = async () => {
  // Przykładowa lista - może być ich nawet 20
  const allCategories = [
    { id: "1", name: "Granola", slug: "granola" },
    { id: "2", name: "Muesli", slug: "muesli" },
    { id: "3", name: "Płatki owsiane", slug: "oats" },
    { id: "4", name: "Orzechy", slug: "nuts" },
    { id: "5", name: "Owoce", slug: "fruits" },
    { id: "6", name: "Miód", slug: "honey" },
    { id: "7", name: "Superfoods", slug: "superfoods" },
    { id: "8", name: "Płatki owsiane", slug: "oats" },
    { id: "9", name: "Orzechy", slug: "nuts" },
    { id: "10", name: "Owoce", slug: "fruits" },
    { id: "11", name: "Miód", slug: "honey" },
    { id: "12", name: "Superfoods", slug: "superfoods" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60 transition-all">
      <Container className="container mx-auto flex min-h-20 items-center justify-between px-4">
        {/* LEWA STRONA: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2">
            <Image src={logo} alt="DayDream Logo" className="h-16 w-auto" />
            {/* <span className="text-xl sm:text-2xl font-black tracking-tighter text-primary uppercase italic leading-none transition-transform group-hover:scale-105">
              Day
              <span className="text-foreground group-hover:text-primary transition-colors">
                Dream
              </span>
            </span> */}
          </Link>
        </div>

        {/* ŚRODEK: Desktop Nav z Twoim formatowaniem */}
        <DesktopNav categories={allCategories} />

        {/* PRAWA STRONA: Akcje z lepszym hoverem */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ModeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative text-foreground hover:bg-accent hover:text-primary transition-all rounded-full"
          >
            <ShoppingBasket className="h-12 w-12 hoverEffect" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground border-2 border-background shadow-md">
              3
            </span>
          </Button>

          <Button
            variant="default"
            size="sm"
            className="sm:flex rounded-full bg-primary text-primary-foreground px-6 font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            <User className="h-4 w-4 mr-2" />
            Account
          </Button>
          <div className="lg:hidden">
            <MobileNav categories={allCategories} />
          </div>
        </div>
      </Container>
    </header>
  );
};

export default Header;
