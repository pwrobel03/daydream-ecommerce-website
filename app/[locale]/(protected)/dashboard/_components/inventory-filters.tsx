"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/product";

export interface InventoryFilterState {
  search: string;
  categoryId: string;
  subCategoryId: string;
  stockStatus: string;
}

/**
 * Filtry asortymentu, trzymane w adresie URL — patrz [[voices-filters]].
 * Serwer renderuje listę już zawężoną, więc nie ma tu żadnego pobierania.
 */
export function InventoryFilters({
  categories,
  filters,
}: {
  categories: Category[];
  filters: InventoryFilterState;
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(filters.search);

  const apply = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    params.delete("take");
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Efekt ma reagować wyłącznie na wpisywany tekst; dopisanie `apply`
  // i `filters.search` uruchamiałoby go po każdej nawigacji, czyli po każdym
  // zastosowaniu filtra.
  useEffect(() => {
    if (search === filters.search) return;

    const timer = setTimeout(() => apply({ search: search || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const subCategories =
    categories.find((c) => c.id === filters.categoryId)?.children || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-primary-text transition-colors" />
        <input
          type="text"
          value={search}
          placeholder={t("search.products")}
          className="w-full bg-card/60 border rounded-full py-5 pl-14 pr-8 font-black italic uppercase text-[10px] tracking-widest outline-none focus:ring-2 ring-primary/10 transition-all"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        value={filters.stockStatus}
        onChange={(e) =>
          apply({ stock: e.target.value === "all" ? null : e.target.value })
        }
        className={cn(
          "rounded-full px-6 font-black italic uppercase text-[10px] tracking-widest outline-none h-[62px] cursor-pointer border transition-all",
          filters.stockStatus !== "all" &&
            "bg-primary text-white border-primary shadow-lg shadow-primary/20"
        )}
      >
        <option value="all">Stock: All</option>
        <option value="low">Stock: Low (≤5)</option>
        <option value="empty">Stock: Out</option>
      </select>

      <select
        value={filters.categoryId}
        onChange={(e) =>
          // Podkategoria należy do poprzedniej kategorii, więc znika razem z nią.
          apply({ category: e.target.value || null, sub: null })
        }
        className="border rounded-full px-6 font-black italic uppercase text-[10px] tracking-widest outline-none h-[62px] cursor-pointer transition-colors"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        disabled={!filters.categoryId}
        value={filters.subCategoryId}
        onChange={(e) => apply({ sub: e.target.value || null })}
        className="border rounded-full px-6 font-black italic uppercase text-[10px] tracking-widest outline-none h-[62px] disabled:opacity-40 cursor-pointer"
      >
        <option value="">All Sub-Flows</option>
        {subCategories.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
