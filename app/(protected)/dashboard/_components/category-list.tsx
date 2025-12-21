"use client";

import React, { useState } from "react";
import {
  Trash2,
  ChevronRight,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { deleteCategory } from "@/actions/admin/admin-categories";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CategoryListProps {
  initialCategories: any[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(initialCategories);

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );
    if (!confirmDelete) return;

    const res = await deleteCategory(id);
    if (res.success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      toast.success(res.success);
    } else {
      toast.error(res.error);
    }
  };

  // Grupowanie: Wyciągamy główne kategorie
  const mainCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-8">
      {mainCategories.length === 0 && (
        <div className="p-20 text-center border-2 border-dashed rounded-[3rem] opacity-20">
          <p className="font-black italic uppercase tracking-widest text-sm">
            No structures found
          </p>
        </div>
      )}

      {mainCategories.map((main) => {
        // Znajdujemy dzieci dla tej konkretnej kategorii głównej
        const children = categories.filter((c) => c.parentId === main.id);

        return (
          <div key={main.id} className="space-y-4">
            {/* KARTA KATEGORII GŁÓWNEJ */}
            <div className="group bg-white border border-black/5 p-6 rounded-[2.5rem] flex items-center gap-6 hover:shadow-xl transition-all duration-500">
              {/* Miniatura zdjęcia */}
              <div className="w-16 h-16 bg-zinc-100 rounded-[1.5rem] overflow-hidden flex-shrink-0 relative border border-black/5">
                {main.image ? (
                  <Image
                    src={main.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                    {main.name}
                  </h3>
                  <span className="px-3 py-0.5 bg-zinc-100 rounded-full text-[8px] font-black uppercase tracking-widest opacity-40">
                    Parent
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 opacity-30 font-black uppercase text-[9px] tracking-widest">
                  <span className="flex items-center gap-1">
                    <Package size={10} /> {main._count?.products || 0} Products
                  </span>
                  <span>/category/{main.slug}</span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleDelete(main.id, main.name)}
                className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-destructive hover:text-white transition-all flex-shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* SUBKATEGORIE (Jeśli istnieją) */}
            {children.length > 0 && (
              <div className="ml-12 space-y-3 border-l-2 border-black/5 pl-8 relative">
                {children.map((sub) => (
                  <div
                    key={sub.id}
                    className="group bg-card/40 p-4 pr-6 rounded-[1.5rem] border border-black/5 flex items-center gap-4 hover:bg-white transition-all duration-300"
                  >
                    <ChevronRight size={14} className="text-primary" />
                    <div className="flex-grow">
                      <p className="text-sm font-black italic uppercase tracking-tight">
                        {sub.name}
                      </p>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-20">
                        {sub._count?.products || 0} Products
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(sub.id, sub.name)}
                      className="text-zinc-300 hover:text-destructive transition-colors p-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
