"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVoice } from "@/actions/admin/reviews";
import { Button } from "@/components/ui/button";
import type { AdminVoice } from "@/lib/db-reviews";

export function VoicesList({ voices }: { voices: AdminVoice[] }) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!window.confirm(t("reviews.deleteConfirm"))) return;

    startTransition(async () => {
      const res = await deleteVoice(id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(t("feedback.voiceRemoved"));
      // Lista pochodzi z serwera, więc odświeżamy ją zamiast utrzymywać
      // równoległą kopię w stanie komponentu.
      router.refresh();
    });
  };

  if (voices.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        {t("reviews.empty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {voices.map((voice) => (
        <li
          key={voice.id}
          className="flex items-start gap-4 rounded-lg border bg-card p-4"
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
            {voice.user.image && (
              <Image
                src={voice.user.image}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="break-words font-medium">{voice.user.name}</p>
              <div
                role="img"
                aria-label={t("filters.ratingValue", { count: voice.rating })}
                className="flex gap-0.5"
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={
                      i < voice.rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground/40"
                    }
                    size={14}
                  />
                ))}
              </div>
            </div>
            <p className="break-words text-sm text-muted-foreground">
              {voice.product.name}
            </p>
            <p className="whitespace-pre-line break-words">{voice.content}</p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDelete(voice.id)}
            disabled={isPending || !!readOnlyReason}
            title={readOnlyReason}
            aria-label={t("actions.delete", { name: voice.product.name })}
            className="shrink-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 />
          </Button>
        </li>
      ))}
    </ul>
  );
}
