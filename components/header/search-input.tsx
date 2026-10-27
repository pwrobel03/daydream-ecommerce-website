"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

export function SearchInput() {
  const t = useTranslations("nav");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // Nawigacja zamiast pobierania w locie: wynik ma własny URL, więc da się go
  // udostępnić, odświeżyć i cofnąć do niego przyciskiem wstecz.
  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (query.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative hidden md:block" role="search">
      <label htmlFor="site-search" className="sr-only">
        {t("searchLabel")}
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-10 w-40 rounded-full border bg-transparent pl-11 pr-4 text-sm outline-none transition-[width,border-color] duration-200 focus:w-56 focus:border-primary xl:w-48 xl:focus:w-64"
      />
    </form>
  );
}
