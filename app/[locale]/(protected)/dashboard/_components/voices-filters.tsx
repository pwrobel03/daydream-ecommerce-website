"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterX, Search } from "lucide-react";
import { cn } from "@/lib/utils";

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
  useEffect(() => {
    if (search === (searchParams.get("search") ?? "")) return;

    const timer = setTimeout(() => apply({ search: search || null }), 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative flex-grow max-w-md group bg-input/50 rounded-[2rem]">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={search}
          placeholder={t("search.comments")}
          className="w-full rounded-full py-5 pl-14 pr-8 font-black italic uppercase text-[10px] tracking-widest focus:ring-2 ring-primary/20 outline-none transition-all"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 p-2 border rounded-full">
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() =>
              apply({ rating: rating === star ? null : String(star) })
            }
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all font-black text-xs",
              rating === star ? "bg-primary text-white" : "hover:bg-primary/40"
            )}
          >
            {star}★
          </button>
        ))}
        {rating && (
          <button
            onClick={() => apply({ rating: null })}
            className="p-2 hover:text-destructive"
          >
            <FilterX size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
