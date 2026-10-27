import { Suspense } from "react";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/skeletons";
import {
  getInventoryProducts,
  getMainCategoriesWithChildren,
} from "@/lib/db-inventory";
import { InventoryFilters } from "../../_components/inventory-filters";
import { InventoryList } from "../../_components/inventory-list";

const PAGE_SIZE = 5;

type SearchParams = Promise<{
  search?: string;
  category?: string;
  sub?: string;
  stock?: string;
  take?: string;
}>;

async function InventoryPageContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { search, category, sub, stock, take } = await searchParams;
  const currentTake = Number(take) || PAGE_SIZE;
  const t = await getTranslations("dashboard.inventory");

  const [mainCategories, { products, totalCount }] = await Promise.all([
    getMainCategoriesWithChildren(),
    getInventoryProducts({
      take: currentTake,
      search: search || "",
      categoryId: category || undefined,
      subCategoryId: sub || undefined,
      stockStatus: stock,
    }),
  ]);

  const nextParams = new URLSearchParams();
  if (search) nextParams.set("search", search);
  if (category) nextParams.set("category", category);
  if (sub) nextParams.set("sub", sub);
  if (stock) nextParams.set("stock", stock);
  nextParams.set("take", String(currentTake + PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
        <Button asChild>
          <Link href="/dashboard/inventory/new">
            <PackagePlus aria-hidden />
            {t("addProduct")}
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-6">
        <InventoryFilters
          categories={mainCategories}
          filters={{
            search: search ?? "",
            categoryId: category ?? "",
            subCategoryId: sub ?? "",
            stockStatus: stock ?? "all",
          }}
        />

        <InventoryList products={products} />

        {products.length < totalCount && (
          <Button asChild variant="outline" className="self-center">
            <Link href={`?${nextParams.toString()}`} scroll={false}>
              {t("showMore")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage(props: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <InventoryPageContent {...props} />
    </Suspense>
  );
}
