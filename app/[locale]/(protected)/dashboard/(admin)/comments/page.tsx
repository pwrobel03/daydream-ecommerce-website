import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductGridSkeleton } from "@/components/skeletons";
import { getVoices } from "@/lib/db-reviews";
import { VoicesFilters } from "../../_components/voices-filters";
import { VoicesList } from "../../_components/voices-list";
import type { VoiceType } from "@/types/product";

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
    <div className="space-y-12">
      <header className="space-y-10">
        <div className="flex justify-between items-end border-b">
          <div className="space-y-1">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
              Voices Hub
            </h1>
            <p className="text-md font-black uppercase tracking-[0.4em] opacity-70 ml-1 pb-10">
              Active Monitoring ({reviews.length} / {totalCount})
            </p>
          </div>
        </div>

        <VoicesFilters rating={currentRating} />
      </header>

      <VoicesList voices={reviews as VoiceType[]} />

      {reviews.length < totalCount && (
        <div className="flex justify-center pt-6">
          {/* Kolejna porcja to większe `take` w adresie, więc działa też bez
              JavaScriptu i da się do niej wrócić z historii przeglądarki. */}
          <Link
            href={`?${nextParams.toString()}`}
            scroll={false}
            className="group flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full border border-border/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
              <Plus />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-70 italic">
              Reveal More Stories
            </span>
          </Link>
        </div>
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
