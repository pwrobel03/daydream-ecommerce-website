"use client";

import { Star, Pencil, Trash2 } from "lucide-react";
import type { StoreVoice } from "@/actions/store/reviews";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTransition } from "react";
import { deleteReview } from "@/actions/store/reviews";

interface UserReviewCardProps {
  review: StoreVoice;
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
  const t = useTranslations("reviews");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteReview(review.id, productSlug);
      // Wcześniej nieudane usunięcie nie dawało żadnego sygnału — przycisk
      // po prostu nic nie robił.
      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(t("deleted"));
      onDelete(); // Czyści stan w komponencie nadrzędnym

    });
  };

  return (
    <div className="rounded-lg border border-primary/40 bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("yourReview")}</span>
          <time
            dateTime={new Date(review.createdAt).toISOString()}
            className="text-sm tabular-nums text-muted-foreground"
          >
            {new Date(review.createdAt).toLocaleDateString(locale)}
          </time>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onEdit} aria-label={t("edit")}>
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            aria-label={t("delete")}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      </div>

      <span
        className="mb-3 flex gap-0.5 text-primary-text"
        role="img"
        aria-label={t("rating", { count: review.rating })}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn("size-4", i < review.rating ? "fill-current" : "text-muted-foreground/40")}
            aria-hidden
          />
        ))}
      </span>

      <p className="whitespace-pre-line break-words text-pretty">{review.content}</p>
    </div>
  );
}
