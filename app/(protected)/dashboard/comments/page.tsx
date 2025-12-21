"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getVoices, deleteVoice } from "@/actions/admin/admin-voices";
import { Trash2, Star, Search, Plus, Loader2, FilterX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function AdminCommentsPage() {
  const [voices, setVoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  // State dla filtrów
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const fetchVoices = useCallback(
    async (isInitial = true) => {
      if (isInitial) setLoading(true);
      else setLoadMoreLoading(true);

      const { reviews, totalCount } = await getVoices({
        take: 10,
        skip: isInitial ? 0 : voices.length,
        rating: ratingFilter || undefined,
        search: search || undefined,
      });

      setVoices((prev) => (isInitial ? reviews : [...prev, ...reviews]));
      setTotal(totalCount);
      setLoading(false);
      setLoadMoreLoading(false);
    },
    [voices.length, ratingFilter, search]
  );

  useEffect(() => {
    fetchVoices(true);
  }, [ratingFilter, search]); // Reaguj na zmianę filtrów

  const handleDelete = async (id: string) => {
    const res = await deleteVoice(id);
    if (res.success) {
      setVoices((prev) => prev.filter((v) => v.id !== id));
      toast.success(res.success);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-12">
      {/* HEADER & FILTERS */}
      <header className="space-y-10">
        <div className="flex justify-between items-end border-b">
          <div className="space-y-1">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
              Voices Hub
            </h1>
            <p className="text-md font-black uppercase tracking-[0.4em] opacity-40 ml-1 pb-10">
              Active Monitoring ({voices.length} / {total})
            </p>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Search Bar */}
          <div className="relative flex-grow max-w-md group bg-input/50 rounded-[2rem]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by product or content..."
              className="w-full rounded-full py-5 pl-14 pr-8 font-black italic uppercase text-[10px] tracking-widest focus:ring-2 ring-primary/20 outline-none transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Rating Filters */}
          <div className="flex items-center gap-2 p-2 border rounded-full">
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() =>
                  setRatingFilter(ratingFilter === star ? null : star)
                }
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all font-black text-xs",
                  ratingFilter === star
                    ? "bg-primary text-white"
                    : "hover:bg-primary/40"
                )}
              >
                {star}★
              </button>
            ))}
            {ratingFilter && (
              <button
                onClick={() => setRatingFilter(null)}
                className="p-2 hover:text-destructive"
              >
                <FilterX size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* LISTA */}
      <div className="grid grid-cols-1 gap-6 relative">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-primary w-20 h-20" />
          </div>
        ) : (
          voices.map((voice) => (
            <div
              key={voice.id}
              className="bg-card/60 p-4 rounded-[1rem] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* User & Rating */}
              <div className="flex items-center gap-4 w-64 flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-accent relative overflow-hidden">
                  {voice.user.image && (
                    <Image
                      src={voice.user.image}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-widest leading-none">
                    {voice.user.name}
                  </p>
                  <div className="mt-2 flex gap-1.5 text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < voice.rating ? "fill-primary" : "text-zinc-200"
                        }
                        size={16}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-around w-full gap-2">
                {/* Content */}
                <div className="flex-grow">
                  <p className="text-sm font-black uppercase tracking-widest text-primary mb-1">
                    {voice.product.name}
                  </p>
                  <p className="text-md font-medium italic leading-tight">
                    "{voice.content}"
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() => handleDelete(voice.id)}
                  className="w-14 h-14 rounded-full border flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-500 shrink-0"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* LOAD MORE */}
      {voices.length < total && !loading && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => fetchVoices(false)}
            disabled={loadMoreLoading}
            className="group flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full border border-black/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
              {loadMoreLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus />
              )}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 italic">
              Reveal More Stories
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
