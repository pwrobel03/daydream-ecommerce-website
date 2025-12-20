"use client";

import { Star } from "lucide-react";
import { ReviewType } from "@/types/product";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ReviewsSectionProps {
  reviews: any[]; // Możesz tu użyć swojego interfejsu ReviewType
  productId: string;
}

const ReviewsSection = ({ reviews, productId }: ReviewsSectionProps) => {
  // 1. Obliczanie średniej oceny
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  // 2. Formatowanie daty
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="border-t pt-16">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
        <div>
          <h2 className="text-3xl font-bold mb-2">Opinie klientów</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-5 w-5",
                    star <= Number(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <p className="text-lg font-medium">
              {averageRating}{" "}
              <span className="text-muted-foreground text-base">
                ({reviews.length} opinii)
              </span>
            </p>
          </div>
        </div>

        {/* Przycisk dodawania - na razie tylko wizualny placeholder */}
        <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-full font-semibold transition-colors">
          Wystaw opinię
        </button>
      </div>

      {/* LISTA OPINII */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-secondary/10 p-6 rounded-2xl border border-secondary/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Avatar Użytkownika */}
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary">
                    {review.user?.image ? (
                      <Image
                        src={review.user.image}
                        alt={review.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold uppercase">
                        {review.user?.name?.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold leading-none">
                      {review.user?.name || "Anonimowy klient"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Ocena gwiazdkowa danej recenzji */}
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed italic">
                "{review.content}"
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-secondary/10 rounded-3xl border-2 border-dashed border-secondary/30">
          <p className="text-muted-foreground">
            Ten produkt nie ma jeszcze opinii. Bądź pierwszy!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
