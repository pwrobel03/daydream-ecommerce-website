"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import type { MainCategoryWithChildren } from "@/lib/db-inventory";

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
  categories: MainCategoryWithChildren[];
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="relative md:col-span-2">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          aria-label={t("search.products")}
          placeholder={t("search.products")}
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        aria-label={t("filters.stock")}
        value={filters.stockStatus}
        onChange={(e) =>
          apply({ stock: e.target.value === "all" ? null : e.target.value })
        }
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
      >
        <option value="all">{t("filters.stockAll")}</option>
        <option value="low">{t("filters.stockLow")}</option>
        <option value="empty">{t("filters.stockEmpty")}</option>
      </select>

      <select
        aria-label={t("filters.category")}
        value={filters.categoryId}
        onChange={(e) =>
          // Podkategoria należy do poprzedniej kategorii, więc znika razem z nią.
          apply({ category: e.target.value || null, sub: null })
        }
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
      >
        <option value="">{t("inventory.allCategories")}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        aria-label={t("filters.subCategory")}
        disabled={!filters.categoryId}
        value={filters.subCategoryId}
        onChange={(e) => apply({ sub: e.target.value || null })}
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{t("inventory.allSubFlows")}</option>
        {subCategories.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
