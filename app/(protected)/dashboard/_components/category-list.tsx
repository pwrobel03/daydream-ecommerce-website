"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  ChevronRight,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { deleteCategory } from "@/actions/admin/admin-categories";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CategoryListProps {
  initialCategories: any[];
}

export default function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(initialCategories);
  const router = useRouter();

  // KLUCZOWE: Synchronizacja stanu z nowymi danymi z serwera (router.refresh())
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleDelete = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );
    if (!confirmDelete) return;

    const res = await deleteCategory(id);
    if (res.success) {
      toast.success(res.success);
      // Odświeżamy dane globalnie
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const mainCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-8">
      {mainCategories.length === 0 && (
        <div className="p-20 text-center border-2 border-dashed rounded-[3rem] opacity-20">
          <p className="font-black italic uppercase tracking-widest text-sm text-zinc-900">
            No structures found
          </p>
        </div>
      )}

      {mainCategories.map((main) => {
        const children = categories.filter((c) => c.parentId === main.id);

        return (
          <div key={main.id} className="space-y-4">
            <div className="group bg-card/60 p-6 rounded-[2.5rem] flex items-center gap-6 hover:shadow-xl transition-all duration-500">
              <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden flex-shrink-0 relative border">
                {main.image ? (
                  <Image
                    src={main.image}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>
              <div className="w-full flex flex-col lg:flex-row">
                <div className="flex-grow flex flex-col">
                  <div className="flex gap-2 flex flex-col">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                      {main.name}
                    </h3>
                    <span className="px-3 py-0.5 max-w-32 rounded-full text-[12px] font-black uppercase tracking-widest bg-primary/40">
                      Parent
                    </span>
                  </div>
                </div>
                <div className="flex flex-row mt-2">
                  <div className="flex items-center gap-4 opacity-30 font-black uppercase text-xs tracking-widest">
                    <span className="flex items-center gap-1">
                      <Package size={10} /> {main._count?.products || 0}{" "}
                      Products
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(main.id, main.name)}
                    className="w-8 h-8 ml-4 rounded-full border flex items-center justify-center hover:bg-destructive hover:text-white transition-all flex-shrink-0"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {children.length > 0 && (
              <div className="ml-12 space-y-3 border-l-2 pl-8 relative">
                {children.map((sub) => (
                  <div
                    key={sub.id}
                    className="group bg-card/40 p-4 pr-6 rounded-[1.5rem] border flex items-center gap-4 transition-all duration-300"
                  >
                    <ChevronRight size={14} className="text-primary" />
                    <div className="flex-grow">
                      <p className="text-sm font-black italic uppercase tracking-tight">
                        {sub.name}
                      </p>
                      <p className="text-xs font-black uppercase tracking-widest opacity-20">
                        {sub._count?.products || 0} Products
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(sub.id, sub.name)}
                      className="hover:text-destructive transition-colors p-2 flex-shrink-0"
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
