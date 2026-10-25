import { Suspense } from "react";
import Link from "next/link";
import { PackagePlus, Plus } from "lucide-react";
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
    <div className="space-y-16 pb-20">
      <header className="flex justify-between items-end border-b pb-10">
        <div className="space-y-1 overflow-hidden">
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter">
            Inventory
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 ml-1">
            Global Artifact Control
          </p>
        </div>
      </header>

      <div className="space-y-12">
        <InventoryFilters
          categories={mainCategories}
          filters={{
            search: search ?? "",
            categoryId: category ?? "",
            subCategoryId: sub ?? "",
            stockStatus: stock ?? "all",
          }}
        />

        <Link
          href="/dashboard/inventory/new"
          className="group relative px-10 py-5 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 border hover:text-white shadow-xl flex items-center gap-3 bg-card/90"
        >
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <PackagePlus className="relative z-10 w-4 h-4" />
          <span className="relative z-10 font-black uppercase italic tracking-tighter text-sm">
            Add Product
          </span>
        </Link>

        <InventoryList products={products} />

        {products.length < totalCount && (
          <div className="flex justify-center pt-10">
            <Link
              href={`?${nextParams.toString()}`}
              scroll={false}
              className="group flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 shadow-xl bg-card group-hover:scale-110">
                <Plus size={24} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-70 italic transition-all group-hover:tracking-[0.6em] group-hover:opacity-100">
                Reveal More Artifacts
              </span>
            </Link>
          </div>
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
