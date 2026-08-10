"use client";

import { Star, Pencil, Trash2 } from "lucide-react";
import { Review } from "@/types/product";
import { toast } from "sonner";
import { useTransition } from "react";
import { deleteReview } from "@/actions/store/reviews";

interface UserReviewCardProps {
  review: Review;
  productSlug: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function UserReviewCard({
  review,
  productSlug,
  onEdit,
  onDelete,
}: UserReviewCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteReview(review.id, productSlug);
      if (res.success) {
        toast.success(res.success);
        onDelete(); // Czyści stan w komponencie nadrzędnym
      }
    });
  };

  return (
    <div className="group relative animate-in fade-in zoom-in-95 duration-700">
      <div className="absolute rounded-[3.5rem] blur-xl opacity-50 transition duration-1000" />

      <div className="relative bg-card/60 border border-primary/20 p-10 rounded-[3rem] shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <div className="flex flex-col gap-2">
            <span className="px-4 py-1.5 w-fit bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20">
              Your Voice
            </span>
            <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest ml-1 gap-4 flex">
              <span>
                {new Date(review.createdAt).toLocaleDateString("pl-PL")}
              </span>
              <span>
                {new Date(review.createdAt).toLocaleTimeString("pl-PL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>

          {/* AKCJE: Edit & Delete */}
          <div className="flex gap-2 transition-opacity">
            <button
              onClick={onEdit}
              className="p-3 rounded-full bg-card border-border border hover:bg-primary hover:text-white transition-all"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-3 rounded-full bg-card border-border border hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <blockquote className="text-3xl font-medium italic leading-tight text-foreground">
          &ldquo;{review.content}&rdquo;
        </blockquote>

        <div className="mt-8 flex gap-1.5 text-primary">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={i < review.rating ? "fill-primary" : "text-zinc-200"}
              size={16}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
