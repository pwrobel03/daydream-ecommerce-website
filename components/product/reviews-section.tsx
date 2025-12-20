// components/product/reviews-section.tsx
"use client";

import { Star, MessageSquareQuote } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// components/product/reviews-section.tsx
export default function ReviewsSection({ reviews }: { reviews: any[] }) {
  return (
    <div className="border-t border-black/5 pt-16">
      <div className="flex justify-between items-end mb-16">
        <h2 className="text-5xl font-black tracking-tight italic uppercase">
          Voices
        </h2>
        <div className="flex items-center gap-2">
          <Star className="fill-primary text-primary" />
          <span className="text-2xl font-bold">
            {(
              reviews.reduce((a, b) => a + b.rating, 0) / reviews.length || 0
            ).toFixed(1)}
          </span>
        </div>
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="break-inside-avoid bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden relative">
                {rev.user.image && <Image src={rev.user.image} alt="U" fill />}
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
        ))}{" "}
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="break-inside-avoid bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden relative">
                {rev.user.image && <Image src={rev.user.image} alt="U" fill />}
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
        ))}{" "}
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="break-inside-avoid bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-black/5 hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden relative">
                {rev.user.image && <Image src={rev.user.image} alt="U" fill />}
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
    </div>
  );
}
