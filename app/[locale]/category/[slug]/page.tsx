import { ProductGridSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  getCategoryWithProducts,
  getAllProductsAsCategory,
  getTotalProductsCount,
  type AllProductsCategory,
  type CategoryWithProducts,
} from "@/lib/db-products";
import ProductCard from "@/components/product-card/ProductCard";
import SubTitle from "@/components/sub-title";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ limit?: string }>;
}

async function CategoryPageContent({
  params,
  searchParams,
}: CategoryPageProps) {
  const t = await getTranslations("catalogue");
  const { slug } = await params;
  const { limit } = await searchParams;

  const currentLimit = parseInt(limit || "10", 10);

  // 3. Pobieranie danych w zależności od sluga
  let category: CategoryWithProducts | AllProductsCategory | null;
  if (slug === "all") {
    category = await getAllProductsAsCategory(currentLimit);
  } else {
    category = await getCategoryWithProducts(slug, currentLimit);
  }

  // 4. Jeśli kategoria nie istnieje w bazie (i nie jest to "all")
  if (!category) {
    notFound();
  }
  const name = slug === "all" ? t("allTitle") : category.name;
  const description =
    slug === "all" ? t("allDescription") : category.description;

  // 5. Pobranie całkowitej liczby produktów dla tej kategorii/widoku
  const totalArtifacts = await getTotalProductsCount(slug);
  const hasMore = totalArtifacts > category.products.length;

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        <SubTitle text={name} className="mb-0" />
        {description && (
          <p className="mt-4 max-w-[65ch] text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </header>

      <section className="mx-auto max-w-7xl px-6">
        {category.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {category.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={name}
              />
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-muted-foreground">
            {t("empty")}
          </p>
        )}

        {category.products.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("count", { shown: category.products.length, total: totalArtifacts })}
            </p>
            {hasMore && (
              <Button asChild variant="outline">
                <Link
                  href={`/category/${slug}?limit=${currentLimit + 25}`}
                  scroll={false}
                >
                  {t("showMore")}
                </Link>
              </Button>
            )}
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
