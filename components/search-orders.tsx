"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export function SearchOrders({ defaultValue }: { defaultValue: string }) {
  const t = useTranslations("dashboard.orders");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Zawsze wracamy do 1 strony przy nowym szukaniu
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative w-full max-w-md">
      <Search
        aria-hidden
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        aria-label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}
