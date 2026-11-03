"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterX, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Filtry moderacji opinii, trzymane w adresie URL.
 *
 * Stan w komponencie wymagał pobierania danych z efektu po każdej zmianie —
 * stąd waterfall i wyłączona reguła lintera. W searchParams filtry są
 * współdzielone linkiem, przeżywają odświeżenie i pozwalają serwerowi
 * wyrenderować od razu właściwą listę.
 */
export function VoicesFilters({ rating }: { rating: number | null }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const apply = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    // Nowe filtry zawsze od pierwszej porcji wyników.
    params.delete("take");
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Bez opóźnienia każde naciśnięcie klawisza byłoby osobną nawigacją.
  // Efekt ma reagować wyłącznie na wpisywany tekst; dopisanie `apply`
  // i `searchParams` uruchamiałoby go po każdej nawigacji, czyli po każdym
  // zastosowaniu filtra.
  useEffect(() => {
    if (search === (searchParams.get("search") ?? "")) return;

    const timer = setTimeout(() => apply({ search: search || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative min-w-60 max-w-md flex-1">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          aria-label={t("search.comments")}
          placeholder={t("search.comments")}
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div
        role="group"
        aria-label={t("filters.rating")}
        className="flex items-center gap-2"
      >
        {[5, 4, 3, 2, 1].map((star) => (
          <Button
            key={star}
            variant={rating === star ? "default" : "outline"}
            size="sm"
            aria-pressed={rating === star}
            onClick={() =>
              apply({ rating: rating === star ? null : String(star) })
            }
          >
            {star}★
          </Button>
        ))}
        {rating && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("filters.clearRating")}
            onClick={() => apply({ rating: null })}
          >
            <FilterX />
          </Button>
        )}
      </div>
    </div>
  );
}
