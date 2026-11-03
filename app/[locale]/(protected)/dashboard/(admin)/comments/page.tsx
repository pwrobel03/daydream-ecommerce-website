import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ProductGridSkeleton } from "@/components/skeletons";
import { getVoices } from "@/lib/db-reviews";
import { VoicesFilters } from "../../_components/voices-filters";
import { VoicesList } from "../../_components/voices-list";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  search?: string;
  rating?: string;
  take?: string;
}>;

async function CommentsPageContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { search, rating, take } = await searchParams;

  const t = await getTranslations("dashboard.reviews");
  const currentTake = Number(take) || PAGE_SIZE;
  const currentRating = Number(rating) || null;

  const { reviews, totalCount } = await getVoices({
    take: currentTake,
    rating: currentRating ?? undefined,
    search: search || undefined,
  });

  const nextParams = new URLSearchParams();
  if (search) nextParams.set("search", search);
  if (currentRating) nextParams.set("rating", String(currentRating));
  nextParams.set("take", String(currentTake + PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-col gap-1 border-b pb-6">
        <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("count", { shown: reviews.length, total: totalCount })}
        </p>
      </header>

      <VoicesFilters rating={currentRating} />

      <VoicesList voices={reviews} />

      {reviews.length < totalCount && (
        // Kolejna porcja to większe `take` w adresie, więc działa też bez
        // JavaScriptu i da się do niej wrócić z historii przeglądarki.
        <Button asChild variant="outline" className="self-center">
          <Link href={`?${nextParams.toString()}`} scroll={false}>
            {t("showMore")}
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function AdminCommentsPage(props: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CommentsPageContent {...props} />
    </Suspense>
  );
}
