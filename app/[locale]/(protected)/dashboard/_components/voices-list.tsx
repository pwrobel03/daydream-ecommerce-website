"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVoice } from "@/actions/admin/reviews";
import type { VoiceType } from "@/types/product";

export function VoicesList({ voices }: { voices: VoiceType[] }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
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

  return (
    <div className="grid grid-cols-1 gap-6 relative">
      {voices.map((voice) => (
        <div
          key={voice.id}
          className="bg-card/60 p-4 rounded-[1rem] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="flex items-center gap-4 w-64 flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-accent relative overflow-hidden">
              {voice.user.image && (
                <Image src={voice.user.image} alt="" fill className="object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest leading-none">
                {voice.user.name}
              </p>
              <div className="mt-2 flex gap-1.5 text-primary-text">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={i < voice.rating ? "fill-primary" : "text-zinc-200"}
                    size={16}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around w-full gap-2">
            <div className="flex-grow">
              <p className="text-sm font-black uppercase tracking-widest text-primary-text mb-1">
                {voice.product.name}
              </p>
              <p className="text-md font-medium italic leading-tight">
                &ldquo;{voice.content}&rdquo;
              </p>
            </div>

            <button
              onClick={() => handleDelete(voice.id)}
              disabled={isPending}
              aria-label={t("actions.delete", { name: voice.product.name })}
              className="w-14 h-14 rounded-full border flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-500 shrink-0 disabled:opacity-40"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
