"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("nav");
  // Tutaj ustawiamy limit - ile kategorii widać od razu
  const limit = 3;
  const visibleCategories = categories.slice(0, limit);
  visibleCategories.push({ id: "all", name: t("allProducts"), slug: "all" });
  const hiddenCategories = categories.slice(limit);

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {/* Kategorie widoczne na sztywno */}
      {visibleCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-primary-text whitespace-nowrap"
        >
          {cat.name}
        </Link>
      ))}

      {/* Menu "Więcej" tylko gdy są dodatkowe kategorie */}
      {hiddenCategories.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-primary-text outline-none cursor-pointer">
            {t("more")} <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="bg-card border-border p-2"
          >
            {hiddenCategories.map((cat) => (
              <DropdownMenuItem key={cat.id} asChild>
                <Link
                  href={`/category/${cat.slug}`}
                  className="w-full cursor-pointer px-2 py-2 text-sm font-medium hover:text-primary-text"
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
