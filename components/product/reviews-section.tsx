"use client";

import { useState, useMemo } from "react";
import { Star, Plus, Loader2 } from "lucide-react";
import { getMoreReviews } from "@/actions/get-more-reviews";
import { cn } from "@/lib/utils";
import Image from "next/image";
import AddReviewForm from "./add-review-form";
import { UserType, ReviewType } from "@/types/product";

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  userReview: ReviewType | null;
  initialReviews: ReviewType[];
  totalCount: number;
  user: UserType | null;
}

import UserReviewCard from "./user-review-card";

export default function ReviewsSection({
  productId,
  productSlug,
  userReview,
  initialReviews,
  totalCount,
  user,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewType[]>(initialReviews);
  const [currentUserReview, setCurrentUserReview] = useState<ReviewType | null>(
    userReview
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bezpieczne obliczanie średniej - używamy useMemo, żeby uniknąć błędów przy pustej liście
  const averageRating = useMemo(() => {
    const allReviews = [...reviews];
    if (currentUserReview) allReviews.push(currentUserReview);

    if (allReviews.length === 0) return 0;
    const sum = allReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / allReviews.length).toFixed(1);
  }, [reviews, currentUserReview]);

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
    setReviews((prev) => [...prev, ...(nextReviews as ReviewType[])]);
    setLoading(false);
  };

  const handleAddOptimisticReview = (newReview: any) => {
    setCurrentUserReview(newReview);
  };

  return (
    <div className="border-t border-black/5 pt-20 mt-20">
      <div className="flex justify-between items-end mb-16">
        <div className="space-y-1">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">
            Voices
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
            Stories ({totalCount})
          </p>
        </div>

        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-2">
            <Star className="fill-primary text-primary h-6 w-6" />
            <span className="text-4xl font-black">{averageRating}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
            Showing {displayedCount} of {totalCount}
          </span>
        </div>
      </div>

      {/* <div className="mb-24">
        {user ? (
          currentUserReview ? (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <div className="bg-white dark:bg-zinc-900 border border-primary/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                    Your Voice
                  </span>
                  <div className="flex gap-1 text-primary">
                    {[...Array(currentUserReview.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-3xl font-medium italic leading-tight">
                  "{currentUserReview.content}"
                </p>
                <div className="mt-8 flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-accent overflow-hidden relative">
                    {user.image && (
                      <Image
                        src={user.image}
                        alt="U"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {user.name}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <AddReviewForm
              productId={productId}
              user={user}
              onSuccess={handleAddOptimisticReview}
            />
          )
        ) : (
          <div className="p-12 border-2 border-dashed rounded-[3rem] text-center opacity-50">
            <p className="italic uppercase tracking-widest text-sm font-bold">
              Log in to add review
            </p>
          </div>
        )}
      </div> */}
      <div className="mb-24">
        {user ? (
          currentUserReview && !isEditing ? (
            <UserReviewCard
              review={currentUserReview}
              productSlug={productSlug}
              onEdit={() => setIsEditing(true)}
              onDelete={() => setCurrentUserReview(null)}
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
              }}
              onCancel={isEditing ? () => setIsEditing(false) : undefined}
            />
          )
        ) : (
          <>Login</>
        )}
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="break-inside-avoid bg-card/60 p-10 rounded-[2.5rem] border border-black/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent overflow-hidden relative">
                {rev.user.image ? (
                  <Image
                    src={rev.user.image}
                    alt="U"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                    U
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-[10px] tracking-widest uppercase">
                  {rev.user.name}
                </span>
                <div className="flex gap-0.5 text-primary">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="h-2.5 w-2.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xl leading-snug font-medium italic">
              "{rev.content}"
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-20 flex flex-col items-center gap-6">
          <div className="h-20 w-px bg-gradient-to-b from-border to-transparent" />
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="group flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full border flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-xl">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60">
              {loading ? "Searching..." : "Reveal More"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
