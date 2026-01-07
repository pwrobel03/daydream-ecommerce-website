// app/admin/_components/pagination-controls.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  searchQuery,
}: PaginationProps) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    params.set("page", page.toString());
    return `/dashboard/manage-orders?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-12 border-t border-black/5 dark:border-white/5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">
          Navigator Mode:
        </span>
        <span className="text-xl font-black italic tracking-tighter">
          {currentPage} <span className="opacity-20">/</span> {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* PREVIOUS PAGE */}
        <Link
          href={createPageUrl(currentPage - 1)}
          className={cn(
            "group flex items-center gap-3 px-8 py-4 border rounded-2xl transition-all hover:bg-primary hover:border-primary hover:text-white",
            currentPage <= 1 && "pointer-events-none opacity-10"
          )}
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-black italic uppercase tracking-tighter">
            Prev Log
          </span>
        </Link>

        {/* NEXT PAGE */}
        <Link
          href={createPageUrl(currentPage + 1)}
          className={cn(
            "group flex items-center gap-3 px-8 py-4 border rounded-2xl transition-all hover:bg-primary hover:border-primary hover:text-white",
            currentPage >= totalPages && "pointer-events-none opacity-10"
          )}
        >
          <span className="font-black italic uppercase tracking-tighter">
            Next Log
          </span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
