// app/admin/_components/search-orders.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

export function SearchOrders({ defaultValue }: { defaultValue: string }) {
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
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
      <input
        type="text"
        placeholder="SEARCH BY ID OR CLIENT..."
        defaultValue={defaultValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full bg-transparent border-2 border-black/10 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-black italic uppercase tracking-tighter focus:border-primary outline-none transition-all"
      />
    </div>
  );
}
