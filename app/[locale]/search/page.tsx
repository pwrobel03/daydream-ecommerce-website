import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import SubTitle from "@/components/sub-title";
import Container from "@/components/Container";
import PriceFormatter from "@/components/PriceFormatter";
import { searchProducts } from "@/lib/db-search";
import { ProductGridSkeleton } from "@/components/skeletons";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("search");
  return { title: t("title") };
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

interface SearchPageParams {
  params: Promise<{ locale: string }>;
}

async function Results({ searchParams }: SearchPageProps) {
  const t = await getTranslations("search");
  const { q = "" } = await searchParams;
  const query = q.trim();
  const hits = query.length >= 2 ? await searchProducts(query) : [];

  if (query.length < 2) {
    return (
      <p className="text-muted-foreground">{t("tooShort")}</p>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-lg font-medium break-words">
          {t("noMatches", { query })}
        </p>
        <p className="text-muted-foreground">{t("noMatchesHelp")}</p>
        <Link
          href="/category/all"
          className="inline-block text-primary-text underline underline-offset-4"
        >
          {t("browseInstead")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground break-words">
        {t("results", { count: hits.length, query })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {hits.map((hit) => (
          <Link
            key={hit.id}
            href={`/product/${hit.slug}`}
            className="group space-y-3"
          >
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {hit.imageUrl && (
                <Image
                  src={hit.imageUrl}
                  alt={hit.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover"
                />
              )}
              {hit.stock === 0 && (
                <span className="absolute top-3 left-3 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {t("soldOut")}
                </span>
              )}
            </div>
            <h2 className="line-clamp-2 break-words text-base font-medium leading-[1.4]">
              {hit.name}
            </h2>
            <PriceFormatter amount={hit.promoPrice ?? hit.price} className="tabular-nums" />
          </Link>
        ))}
      </div>
    </>
  );
}

export default async function SearchPage(
  props: SearchPageProps & SearchPageParams
) {
  // Bez tego pobranie tłumaczeń liczy się jako dane żądania i blokuje
  // prerenderowanie powłoki strony — a to ona ma wyjść statycznie.
  const { locale } = await props.params;
  setRequestLocale(locale);

  const t = await getTranslations("search");

  return (
    <Container className="py-20 space-y-10">
      <SubTitle text={t("title")} className="mb-0" />
      {/* searchParams to dane żądania — nie da się ich prerenderować. */}
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <Results {...props} />
      </Suspense>
    </Container>
  );
}
