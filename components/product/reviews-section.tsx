"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Star, Loader2 } from "lucide-react";
import { getMoreReviews } from "@/actions/store/reviews";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import AddReviewForm from "./add-review-form";
import type { StoreVoice } from "@/actions/store/reviews";
import type { Session } from "next-auth";

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  userReview: StoreVoice | null;
  initialReviews: StoreVoice[];
  totalCount: number;
  /** Średnia ze wszystkich opinii, policzona przez bazę. */
  ratingAvg: number;
  user: Session["user"] | null;
}

import UserReviewCard from "./user-review-card";

export default function ReviewsSection({
  productId,
  productSlug,
  userReview,
  initialReviews,
  totalCount,
  ratingAvg,
  user,
}: ReviewsSectionProps) {
  const router = useRouter();
  const t = useTranslations("reviews");
  const locale = useLocale();
  const [reviews, setReviews] = useState<StoreVoice[]>(initialReviews);
  const [currentUserReview, setCurrentUserReview] = useState<StoreVoice | null>(
    userReview
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Średnia przychodzi z serwera; po własnej zmianie odświeżamy trasę, żeby
  // przeliczył ją ten sam agregat, zamiast utrzymywać drugą wersję rachunku
  // po stronie klienta.
  const averageRating = ratingAvg > 0 ? ratingAvg.toFixed(1) : null;

  const displayedCount = reviews.length + (currentUserReview ? 1 : 0);
  const hasMore = displayedCount < totalCount;

  const handleLoadMore = async () => {
    if (loading) return;
    setLoading(true);
    const nextReviews = await getMoreReviews(
      productId,
      reviews.length,
      9,
      user?.id
    );
    setReviews((prev) => [...prev, ...(nextReviews)]);
    setLoading(false);
  };


  return (
    <section id="voices-top" className="border-t py-16 md:py-24">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl leading-[1.2] text-balance">
          {t("title")}
        </h2>
        <p className="flex items-center gap-2 tabular-nums text-muted-foreground">
          {averageRating && (
            <span
              className="flex items-center gap-1 font-medium text-foreground"
              aria-label={t("average", { value: averageRating })}
            >
              <Star className="size-4 fill-primary text-primary-text" aria-hidden />
              {averageRating}
            </span>
          )}
          <span>{t("count", { count: totalCount })}</span>
        </p>
      </div>

      <div className="mt-8 max-w-[65ch]">
        {user ? (
          currentUserReview && !isEditing ? (
            <UserReviewCard
              review={currentUserReview}
              productSlug={productSlug}
              onEdit={() => setIsEditing(true)}
              onDelete={() => {
                setCurrentUserReview(null);
                router.refresh();
              }}
            />
          ) : (
            <AddReviewForm
              productId={productId}
              productSlug={productSlug}
              user={user}
              initialData={isEditing ? currentUserReview : null} // Przekazujemy dane do edycji
              onSuccess={(newReview) => {
                setCurrentUserReview(newReview);
                setIsEditing(false);
                router.refresh();
              }}
              onCancel={isEditing ? () => setIsEditing(false) : undefined}
            />
          )
        ) : (
          <p className="text-pretty text-muted-foreground">{t("loginPrompt")}</p>
        )}
      </div>

      {reviews.length === 0 && !currentUserReview && (
        <p className="mt-8 max-w-[65ch] text-pretty text-muted-foreground">
          {t("empty")}
        </p>
      )}

      <ul className="mt-8 flex max-w-[65ch] flex-col gap-4">
        {reviews.map((rev) => (
          <li key={rev.id} className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-accent">
                {rev.user.image && (
                  <Image src={rev.user.image} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {rev.user.name ?? t("avatarFallback")}
                </span>
                <span
                  className="flex gap-0.5 text-primary-text"
                  role="img"
                  aria-label={t("rating", { count: rev.rating })}
                >
                  {Array.from({ length: rev.rating }, (_, i) => (
                    <Star key={i} className="size-3.5 fill-current" aria-hidden />
                  ))}
                </span>
              </div>
              <time
                dateTime={new Date(rev.createdAt).toISOString()}
                className="ml-auto shrink-0 text-sm tabular-nums text-muted-foreground"
              >
                {new Date(rev.createdAt).toLocaleDateString(locale)}
              </time>
            </div>
            <p className="whitespace-pre-line break-words text-pretty">{rev.content}</p>
          </li>
        ))}
      </ul>

      {hasMore && (
        <div className="mt-8 flex flex-col items-start gap-2">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {loading ? t("loading") : t("showMore")}
          </Button>
          <p className="text-sm tabular-nums text-muted-foreground">
            {t("showing", { shown: displayedCount, total: totalCount })}
          </p>
        </div>
      )}
    </section>
  );
}
