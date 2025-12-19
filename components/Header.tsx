import Image from "next/image";
import logo from "@/assets/brand/logo.jpeg";

import { db } from "@/lib/db";
import Form from "next/form";
import { ModeToggle } from "./mode-toggle";
import Link from "next/link";
import { Button } from "./ui/button";
import { ShoppingBasket, User } from "lucide-react";

const Header = async () => {
  const categories = [
    { id: "1", name: "Granola", slug: "granola" },
    { id: "2", name: "Muesli", slug: "muesli" },
    { id: "3", name: "Płatki owsiane", slug: "oats" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-primary uppercase">
            Day<span className="text-foreground">Dream</span>
          </span>
        </Link>

        {/* DYNAMICZNE KATEGORIE - Środek */}
        <nav className="hidden md:flex items-center gap-10 relative z-10">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="text-sm font-bold uppercase text-foreground hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* AKCJE - Prawa strona */}
        <div className="flex items-center gap-4">
          <ModeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="relative text-foreground hover:bg-accent"
          >
            <ShoppingBasket className="h-6 w-6" />
            {/* Badge koszyka w kolorze secondary (zieleń) */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground border border-border">
              3
            </span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:flex gap-2 rounded-full px-6"
          >
            <User className="h-4 w-4" />
            Konto
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
