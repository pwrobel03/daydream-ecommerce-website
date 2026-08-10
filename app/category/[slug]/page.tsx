import { ProductGridSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategoryWithProducts,
  getAllProductsAsCategory,
  getTotalProductsCount,
} from "@/lib/db-products";
import ProductCard from "@/components/product-card/ProductCard";
import SubTitle from "@/components/sub-title";
import { ProductType } from "@/types/product";
import { ArrowRight } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ limit?: string }>;
}

async function CategoryPageContent({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { limit } = await searchParams;

  const currentLimit = parseInt(limit || "10", 10);

  // 3. Pobieranie danych w zależności od sluga
  let category;
  if (slug === "all") {
    category = await getAllProductsAsCategory(currentLimit);
  } else {
    category = await getCategoryWithProducts(slug, currentLimit);
  }

  // 4. Jeśli kategoria nie istnieje w bazie (i nie jest to "all")
  if (!category) {
    notFound();
  }

  // 5. Pobranie całkowitej liczby produktów dla tej kategorii/widoku
  const totalArtifacts = await getTotalProductsCount(slug);
  const hasMore = totalArtifacts > category.products.length;

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* --- HEADER SEKCJA --- */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b border-black/5 dark:border-white/5 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <SubTitle
              text="Daydream Archive"
              className="uppercase font-black tracking-[0.2em]"
            />
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter mt-4 mb-6 leading-[0.8]">
              {category.name}
            </h1>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xl">
              {category.description ||
                "System-wide integration of molecular food artifacts."}
            </p>
          </div>

          {/* Licznik zasobów w stylu Nexus */}
          <div className="flex flex-col items-start md:items-end uppercase font-black italic">
            <span className="text-[10px] tracking-widest opacity-40">
              Registry Status
            </span>
            <div className="text-4xl tracking-tighter">
              {category.products.length}
              <span className="opacity-20 mx-1">/</span>
              {totalArtifacts}
            </div>
            <span className="text-[10px] tracking-widest text-primary">
              Artifacts Loaded
            </span>
          </div>
        </div>
      </header>

      {/* --- GRID Z PRODUKTAMI --- */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
          {category.products.length > 0 ? (
            category.products.map((product: ProductType) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={category.name}
              />
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-black/5 rounded-[3rem]">
              <p className="text-muted-foreground font-black italic text-2xl uppercase tracking-tighter">
                Archive is currently empty...
              </p>
            </div>
          )}
        </div>

        {/* --- PRZYCISK LOAD MORE --- */}
        {hasMore && (
          <div className="mt-24 flex flex-col items-center gap-6">
            <Link
              href={`/category/${slug}?limit=${currentLimit + 25}`}
              scroll={false}
              className="group relative px-16 py-8 bg-foreground text-background hover:text-white rounded-[2rem] overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="relative z-10 flex items-center gap-4 text-2xl font-black italic uppercase tracking-tighter">
                Expand Archive
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
              {/* Efekt hover */}
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30 italic">
              Synchronizing with more artifacts...
            </p>
          </div>
        )}
      </section>
    </main>
  );
}


export default function CategoryPage(props: CategoryPageProps) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CategoryPageContent {...props} />
    </Suspense>
  );
}
