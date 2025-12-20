// app/category/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getCategoryWithProducts } from "@/lib/db-products";
// Importuj Twój komponent ProductCard, jeśli już go masz
import ProductCard from "@/components/product-card/ProductCard";

import { ProductType } from "@/types/product";
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Definiujemy params jako Promise
}) {
  // KLUCZOWA POPRAWKA: Rozpakowanie parametrów
  const { slug } = await params;

  const category = await getCategoryWithProducts(slug);

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-12">
        <div className="max-w-2xl">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">
            DayDream World
          </span>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-6">
            {category.name}
          </h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed">
            {category.description ||
              "Discover our unique selection of hand-crafted blends."}
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {category.products.length > 0 ? (
            category.products.map((product: ProductType) => (
              /* Tu wstawimy naszą kartę produktu "bilet" */
              <ProductCard
                key={product.id}
                product={product}
                categoryName={category.name}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-accent/20 rounded-[3rem]">
              <p className="text-muted-foreground font-medium italic text-xl">
                Soon, more products will arrive in this world...
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
