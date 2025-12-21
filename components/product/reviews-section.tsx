"use client";

import { useState } from "react";
import { Star, Plus, Loader2 } from "lucide-react";
import { getMoreReviews } from "@/actions/get-more-reviews";
import { cn } from "@/lib/utils";
import Image from "next/image";
import AddReviewForm from "./add-review-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserType } from "@/types/product";

export default function ReviewsSection({
  productId,
  initialReviews,
  totalCount,
}: {
  productId: string;
  initialReviews: any[];
  totalCount: number;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const user = useCurrentUser();
  const hasMore = reviews.length < totalCount;

  const handleLoadMore = async () => {
    if (loading) return;
    setLoading(true);

    // Wywołujemy Server Action
    const nextReviews = await getMoreReviews(productId, reviews.length);

    // Dodajemy nowe opinie do istniejących
    setReviews((prev) => [...prev, ...nextReviews]);
    setLoading(false);
  };

  // function, initialize after success in form
  const handleAddOptimisticReview = (newReview: any) => {
    setReviews((prev) => [newReview, ...prev]);
  };

  return (
    <div className="border-t border-black/5 pt-20 mt-20">
      {/* Nagłówek sekcji */}
      <div className="flex justify-between items-end mb-16">
        <h2 className="text-5xl text-foreground/80 font-extrabold italic uppercase">
          Voices
        </h2>
        <div id="voices-top" className="text-right flex flex-col items-end">
          <div className="flex items-center gap-2">
            <Star className="fill-primary text-primary h-6 w-6" />
            <span className="text-3xl font-black">
              {(
                reviews.reduce((a, b) => a + b.rating, 0) / reviews.length || 0
              ).toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">
            Showing {reviews.length} of {totalCount} reviews
          </span>
        </div>
      </div>

      {/* Masonry Grid (reviews view) */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {reviews.map((rev) => (
          // single review
          <div
            key={rev.id}
            className="break-inside-avoid bg-card/60 p-8 rounded-[2.5rem] border border-black/5 animate-in fade-in zoom-in-95 duration-500"
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
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-[10px] font-black italic">
                    {rev.user.name.substring(0, 2)}
                  </div>
                )}
              </div>
              <span className="font-bold text-sm tracking-tighter uppercase">
                {rev.user.name}
              </span>
            </div>
            <p className="text-xl leading-snug font-medium mb-4">
              "{rev.content}"
            </p>
            <div className="flex gap-1 text-primary">
              {[...Array(rev.rating)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {user && user.id ? (
        <AddReviewForm
          productId={productId}
          user={user as UserType}
          onSuccess={handleAddOptimisticReview}
        />
      ) : (
        <div className="mt-16 p-12 border-2 border-dashed rounded-[3rem] text-center">
          <p className="italic uppercase tracking-widest text-sm font-bold">
            Log in to add review
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-24 flex flex-col items-center gap-8">
          <div className="h-20 w-px bg-linear-to-b from-border to-transparent" />

          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="group flex flex-col items-center gap-4 transition-all active:scale-95"
          >
            <div className="w-16 h-16 rounded-full border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-500 shadow-xl">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic opacity-60 group-hover:opacity-100 transition-opacity">
              {loading ? "Summoning more dreams..." : "Load more stories"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
