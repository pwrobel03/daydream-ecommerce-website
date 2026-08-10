"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchInput() {
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
        Search products
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40"
      />
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="SEARCH"
        className="h-11 w-48 rounded-full border bg-transparent pl-11 pr-4 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:w-64 focus:border-primary"
      />
    </form>
  );
}
