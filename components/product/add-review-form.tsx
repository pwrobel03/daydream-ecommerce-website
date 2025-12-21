"use client";

import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star, SendHorizontal, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { UserType, ReviewType } from "@/types/product";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { createReview } from "@/actions/create-review";
import { updateReview } from "@/actions/review-actions"; // Zakładamy, że tu jest akcja update

// Schemat walidacji
const formSchema = z.object({
  productId: z.string(),
  userId: z.string(),
  rating: z.number().min(1, "Proszę wybrać ocenę").max(5),
  content: z.string().min(3, "Twoja historia jest nieco za krótka..."),
});

interface AddReviewFormProps {
  productId: string;
  productSlug: string; // Dodane dla rewalidacji w akcji update
  user: UserType;
  initialData?: ReviewType | null; // Dane do edycji
  onSuccess: (review: any) => void;
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
  const [isPending, startTransition] = useTransition();
  const [hoverRating, setHoverRating] = useState(0);

  const isEditing = !!initialData;

  // 1. Inicjalizacja formularza z wartościami początkowymi (jeśli edytujemy)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: productId,
      userId: user.id,
      rating: initialData?.rating || 0,
      content: initialData?.content || "",
    },
  });

  useEffect(() => {
    if (initialData) {
      // Jeśli wchodzimy w tryb edycji, ładujemy dane
      form.reset({
        productId: productId,
        userId: user.id,
        rating: initialData.rating,
        content: initialData.content,
      });
    } else {
      // Jeśli wychodzimy z edycji, czyścimy formularz do wartości domyślnych
      form.reset({
        productId: productId,
        userId: user.id,
        rating: 0,
        content: "",
      });
    }
  }, [initialData, form, productId, user.id]);

  // 2. Obsługa wysyłki
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateReview(initialData.id, values, productSlug)
        : await createReview(values);

      if (result.success && result.review) {
        toast.success(result.success);
        onSuccess(result.review);

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
      } else {
        toast.error(result.error || "Coś poszło nie tak");
      }
    });
  };

  return (
    <div
      className={cn(
        "bg-accent/10 border p-8 md:p-12 rounded-[3rem] shadow-2xl mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700 relative",
        isEditing && "border-primary/30 bg-primary/[0.02]"
      )}
    >
      {/* Cancel button only in edit mode */}
      {isEditing && (
        <button
          onClick={onCancel}
          className="absolute top-8 right-8 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-6 h-6 opacity-40" />
        </button>
      )}

      <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-12 text-foreground/80">
        {isEditing ? "Refine your" : "Share your"}{" "}
        <span className="text-primary underline decoration-primary/20 underline-offset-8">
          Voice
        </span>
      </h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          {/* SEKCJA GWIAZDEK */}
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-foreground/60 font-black capitalize tracking-[0.4em] ml-1">
                  Your Impression
                </FormLabel>
                <FormControl>
                  <div className="flex gap-3">
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
                          className="relative transition-all duration-500 hover:scale-125 active:scale-90 outline-none disabled:opacity-50"
                        >
                          <div
                            className={cn(
                              "absolute inset-0 bg-primary/20 blur-xl rounded-full transition-opacity duration-700",
                              isFilled ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Star
                            className={cn(
                              "w-10 h-10 transition-all duration-500 ease-in-out relative z-10",
                              isFilled
                                ? "fill-primary text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]"
                                : "text-foreground/20"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage className="font-bold uppercase tracking-widest text-destructive ml-1" />
              </FormItem>
            )}
          />

          {/* TEXT SECTION */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-foreground/60 font-black capitalize tracking-[0.4em] ml-1">
                  Your story
                </FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    disabled={isPending}
                    placeholder="How did this daydream taste?..."
                    className="w-full bg-input/20 border-none rounded-[2rem] p-8 text-lg focus:ring-4 focus:ring-primary/5 transition-all min-h-[180px] resize-none outline-none placeholder:italic placeholder:opacity-30"
                  />
                </FormControl>
                <FormMessage className="font-bold uppercase tracking-widest text-destructive ml-4" />
              </FormItem>
            )}
          />

          {/* UPDATE BUTTON */}
          <div className="flex flex-col md:flex-row gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full md:w-fit px-16 h-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full overflow-hidden transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />

              <div className="relative z-10 flex items-center justify-center gap-4 text-xl font-black uppercase italic tracking-tighter">
                {isPending ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>{isEditing ? "Updating..." : "Recording..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? "Update Voice" : "Publish Voice"}</span>
                    <SendHorizontal className="h-5 w-5 group-hover:translate-x-3 transition-transform duration-500" />
                  </>
                )}
              </div>
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className="px-8 h-20 rounded-full border border-black/10 dark:border-white/10 font-black uppercase italic tracking-widest text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
