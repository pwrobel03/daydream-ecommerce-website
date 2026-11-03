"use client";

import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

import * as z from "zod";
import { useState, useTransition, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { StoreVoice } from "@/actions/store/reviews";
import type { Session } from "next-auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { updateReview } from "@/actions/store/reviews";
import { createReview } from "@/actions/store/reviews";

const createSchema = (msg: (key: string) => string) =>
  z.object({
    productId: z.string(),
    rating: z.number().int().min(1, msg("ratingRequired")).max(5),
    content: z.string().min(3, msg("tooShort")).max(2000, msg("tooLong")),
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

interface AddReviewFormProps {
  productId: string;
  productSlug: string; // Dodane dla rewalidacji w akcji update
  user: Session["user"];
  initialData?: StoreVoice | null; // Dane do edycji
  onSuccess: (review: StoreVoice) => void;
  onCancel?: () => void; // Funkcja do wyjścia z trybu edycji
}

export default function AddReviewForm({
  productId,
  productSlug,
  user,
  initialData,
  onSuccess,
  onCancel,
}: AddReviewFormProps) {
  const t = useTranslations("errors");
  const readOnlyReason = useReadOnlyReason();
  const tReviews = useTranslations("reviews");
  const [isPending, startTransition] = useTransition();
  const [hoverRating, setHoverRating] = useState(0);
  const formSchema = useMemo(() => createSchema(tReviews), [tReviews]);

  const isEditing = !!initialData;

  // 1. Inicjalizacja formularza z wartościami początkowymi (jeśli edytujemy)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: productId,
      rating: initialData?.rating || 0,
      content: initialData?.content || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      // Jeśli wchodzimy w tryb edycji, ładujemy dane
      form.reset({
        productId: productId,
        rating: initialData.rating,
        content: initialData.content,
      });
    } else {
      // Jeśli wychodzimy z edycji, czyścimy formularz do wartości domyślnych
      form.reset({
        productId: productId,
        rating: 0,
        content: "",
      });
    }
  }, [initialData, form, productId, user.id]);

  // 2. Obsługa wysyłki
  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateReview(initialData.id, values, productSlug)
        : await createReview(values);

      if (!result.ok) {
        toast.error(result.message || t("generic"));
        return;
      }

      toast.success(isEditing ? tReviews("updated") : tReviews("shared"));
      onSuccess(result.data.review);

      if (!isEditing) {
        form.reset({
          ...form.getValues(),
          content: "",
          rating: 0,
        });

        window.scrollTo({
          top: document.getElementById("voices-top")?.offsetTop
            ? document.getElementById("voices-top")!.offsetTop - 100
            : 0,
          behavior: "smooth",
        });
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="mb-6 font-display text-xl leading-[1.2] text-balance">
        {isEditing ? tReviews("formTitleEdit") : tReviews("formTitleNew")}
      </h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tReviews("ratingLabel")}</FormLabel>
                <FormControl>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoverRating || field.value);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => field.onChange(star)}
                          disabled={isPending}
                          aria-label={tReviews("setRating", { count: star })}
                          aria-pressed={star === field.value}
                          className="rounded-md p-1 outline-none transition-transform active:scale-[0.92] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                        >
                          <Star
                            className={cn(
                              "size-8",
                              isFilled
                                ? "fill-primary text-primary-text"
                                : "text-muted-foreground"
                            )}
                            aria-hidden
                          />
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tReviews("contentLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    disabled={isPending}
                    placeholder={tReviews("placeholder")}
                    className="min-h-32 resize-y"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending || !!readOnlyReason} title={readOnlyReason}>
              {isPending && <Loader2 className="animate-spin" aria-hidden />}
              {isPending
                ? isEditing ? tReviews("updating") : tReviews("publishing")
                : isEditing ? tReviews("update") : tReviews("publish")}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                {tReviews("cancelEdit")}
              </Button>
            )}
            {readOnlyReason && (
              <p className="text-sm text-muted-foreground">{readOnlyReason}</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
