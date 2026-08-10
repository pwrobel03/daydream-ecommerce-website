import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import PriceFormatter from "@/components/PriceFormatter";
import { searchProducts } from "@/lib/db-search";
import { ProductGridSkeleton } from "@/components/skeletons";

export const metadata = { title: "Search" };

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function Results({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const hits = query.length >= 2 ? await searchProducts(query) : [];

  if (query.length < 2) {
    return (
      <p className="text-sm font-black uppercase tracking-widest opacity-30 italic">
        Type at least two characters.
      </p>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-2xl font-black italic uppercase tracking-tighter">
          Nothing matches &ldquo;{query}&rdquo;
        </p>
        <Link
          href="/category/all"
          className="text-[10px] font-black uppercase tracking-[0.3em] underline opacity-60"
        >
          Browse everything instead
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
        {hits.length} {hits.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {hits.map((hit) => (
          <Link
            key={hit.id}
            href={`/product/${hit.slug}`}
            className="group space-y-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-accent">
              {hit.imageUrl && (
                <Image
                  src={hit.imageUrl}
                  alt={hit.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {hit.stock === 0 && (
                <span className="absolute top-4 left-4 rounded-full bg-destructive px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                  Sold out
                </span>
              )}
            </div>
            <h2 className="text-lg font-black italic uppercase tracking-tighter">
              {hit.name}
            </h2>
            <PriceFormatter amount={hit.promoPrice ?? hit.price} />
          </Link>
        ))}
      </div>
    </>
  );
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <Container className="py-20 space-y-10">
      <h1 className="text-6xl font-black italic uppercase tracking-tighter">
        Search
      </h1>
      {/* searchParams to dane żądania — nie da się ich prerenderować. */}
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <Results {...props} />
      </Suspense>
    </Container>
  );
}
