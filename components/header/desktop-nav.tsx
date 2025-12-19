"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string | number;
  name: string;
  slug: string;
}

export function DesktopNav({ categories }: { categories: Category[] }) {
  // Tutaj ustawiamy limit - ile kategorii widać od razu
  const limit = 3;
  const visibleCategories = categories.slice(0, limit);
  const hiddenCategories = categories.slice(limit);

  return (
    <nav className="hidden lg:flex items-center gap-8">
      {/* Kategorie widoczne na sztywno */}
      {visibleCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="text-md font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary whitespace-nowrap"
        >
          {cat.name}
        </Link>
      ))}

      {/* Menu "Więcej" tylko gdy są dodatkowe kategorie */}
      {hiddenCategories.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 text-md font-bold uppercase tracking-widest text-muted-foreground hover:text-primary outline-none cursor-pointer">
            More <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-card border-border p-2"
          >
            {hiddenCategories.map((cat) => (
              <DropdownMenuItem key={cat.id} asChild>
                <Link
                  href={`/category/${cat.slug}`}
                  className="w-full cursor-pointer px-2 py-2 text-sm font-bold uppercase tracking-tight hover:text-primary"
                >
                  {cat.name}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
