import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  const t = useTranslations("pagination");
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    params.set("page", page.toString());
    return `/dashboard/manage-orders?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
      <span className="text-sm text-muted-foreground tabular-nums">
        {t("page", { current: currentPage, total: totalPages })}
      </span>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          aria-disabled={currentPage <= 1}
          className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
        >
          <Link
            href={createPageUrl(currentPage - 1)}
            tabIndex={currentPage <= 1 ? -1 : undefined}
          >
            <ArrowLeft />
            {t("previous")}
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          aria-disabled={currentPage >= totalPages}
          className={cn(
            currentPage >= totalPages && "pointer-events-none opacity-50"
          )}
        >
          <Link
            href={createPageUrl(currentPage + 1)}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
          >
            {t("next")}
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
