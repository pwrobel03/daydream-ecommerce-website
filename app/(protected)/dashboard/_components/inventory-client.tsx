"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import {
  getInventoryProducts,
  deleteProduct,
} from "@/actions/admin/admin-inventory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PriceFormatter from "@/components/PriceFormatter";
import { cn } from "@/lib/utils";
import ProductStatusBadge from "@/components/product-status-badge";
import { PackagePlus } from "lucide-react";
import Link from "next/link";

export default function InventoryClient({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [stockStatus, setStockStatus] = useState("all");

  const fetchProducts = useCallback(
    async (isInitial = true) => {
      if (isInitial) setLoading(true);
      else setLoadMoreLoading(true);

      const res = await getInventoryProducts({
        take: 5,
        skip: isInitial ? 0 : products.length,
        search,
        categoryId: selectedCat || undefined,
        subCategoryId: selectedSub || undefined,
        stockStatus: stockStatus !== "all" ? stockStatus : undefined, // PRZEKAZUJEMY FILTR
      });

      setProducts((prev) =>
        isInitial ? res.products : [...prev, ...res.products]
      );
      setTotal(res.totalCount);
      setLoading(false);
      setLoadMoreLoading(false);
    },
    [products.length, search, selectedCat, selectedSub, stockStatus]
  );

  useEffect(() => {
    fetchProducts(true);
  }, [search, selectedCat, selectedSub, stockStatus]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" forever?`)) return;
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success(res.success);
      router.refresh();
    }
  };

  const availableSubCategories =
    categories.find((c) => c.id === selectedCat)?.children || [];

  return (
    <div className="space-y-12">
      {/* TOOLBAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            disabled={loading}
            placeholder="Search by name..."
            className="w-full bg-card/60 border rounded-full py-5 pl-14 pr-8 font-black italic uppercase text-[10px] tracking-widest outline-none focus:ring-2 ring-primary/10 transition-all"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          onChange={(e) => setStockStatus(e.target.value)}
          className={cn(
            "rounded-full px-6 font-black italic uppercase text-[10px] tracking-widest outline-none h-[62px] cursor-pointer border transition-all",
            stockStatus !== "all" &&
              "bg-primary text-white border-primary shadow-lg shadow-primary/20"
          )}
          disabled={loading}
        >
          <option value="all">Stock: All</option>
          <option value="low">Stock: Low (≤5)</option>
          <option value="empty">Stock: Out</option>
        </select>

        <select
          disabled={loading || !selectedCat}
          onChange={(e) => {
            setSelectedCat(e.target.value);
            setSelectedSub("");
          }}
          className="border rounded-full px-6 font-black italic uppercase text-[10px] tracking-widest outline-none h-[62px] cursor-pointer transition-colors"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          disabled={!selectedCat || loading}
          onChange={(e) => setSelectedSub(e.target.value)}
          value={selectedSub}
          className="border rounded-full px-6 font-black italic uppercase text-[10px] tracking-widest outline-none h-[62px] disabled:opacity-20 cursor-pointer"
        >
          <option value="">All Sub-Flows</option>
          {availableSubCategories.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <Link
        href="/dashboard/inventory/new"
        className="group relative px-10 py-5 rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 border hover:text-white shadow-xl flex items-center gap-3 bg-card/90"
      >
        <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <PackagePlus className="relative z-10 w-4 h-4" />
        <span className="relative z-10 font-black uppercase italic tracking-tighter text-sm">
          Add Product
        </span>
      </Link>

      {/* LISTA PRODUKTÓW */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary w-32 h-32" />
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="group bg-card/60 p-8 rounded-[2.5rem] border border-none flex items-center justify-between hover:shadow-2xl transition-all duration-500 relative overflow-hidden min-h-[140px]"
            >
              {/* OBRAZEK POD NAPISEM (ABSOLUTE) */}
              <div className="absolute left-0 top-0 w-64 h-full pointer-events-none opacity-[0.80] group-hover:opacity-[0.20] transition-opacity duration-700 z-10">
                {product.images?.[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={60} />
                  </div>
                )}
                {/* Gradient zanikający w stronę tekstu */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/60" />
              </div>

              {/* TREŚĆ (Z-INDEX 10) */}
              <div className="relative z-10 flex-grow flex flex-col md:flex-row gap-8 w-full">
                {/* Info o produkcie */}
                <div className="w-full space-y-3">
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-[0.8]">
                    {product.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {product.categories.map((cat: any) => (
                      <ProductStatusBadge
                        key={cat.id}
                        name={cat.name}
                        color={""}
                        className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white/50"
                      />
                    ))}
                    {product.status && (
                      <ProductStatusBadge
                        name={product.status.name}
                        color={product.status.color || ""}
                        className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm"
                      />
                    )}
                  </div>
                </div>

                {/* Sekcja danych: Cena, Stock, Akcje */}
                <div className="flex flex-wrap items-center gap-8 lg:gap-16">
                  {/* Cena */}
                  <div className="space-y-1 mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30">
                      Market Value
                    </p>
                    <div className="text-3xl font-black tracking-tighter text-foreground">
                      {product.promoPrice ? (
                        <PriceFormatter amount={product.promoPrice} />
                      ) : (
                        <PriceFormatter amount={product.price} />
                      )}
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="space-y-1 text-center mx-auto">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30">
                      Stock
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-black italic leading-none",
                        product.stock <= 5 ? "text-primary animate-pulse" : ""
                      )}
                    >
                      {product.stock}
                    </p>
                  </div>

                  {/* Przyciski Akcji */}
                  <div className="flex items-center gap-3 border-l border-black/5 pl-8">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/inventory/${product.id}`)
                      }
                      className="w-12 h-12 rounded-full border bg-card flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 shadow-sm group/btn"
                    >
                      <Edit3
                        size={18}
                        className="group-hover/btn:rotate-12 transition-transform"
                      />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="w-12 h-12 rounded-full border bg-card flex items-center justify-center hover:bg-destructive hover:text-white transition-all duration-500 shadow-sm group/btn"
                    >
                      <Trash2
                        size={18}
                        className="group-hover/btn:scale-110 transition-transform"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {!loading && products.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed rounded-[4rem] opacity-20">
            <p className="font-black italic uppercase tracking-[0.6em] text-sm">
              The Vault is Empty
            </p>
          </div>
        )}
      </div>

      {/* LOAD MORE */}
      {products.length < total && !loading && (
        <div className="flex justify-center pt-10">
          <button
            onClick={() => fetchProducts(false)}
            disabled={loadMoreLoading}
            className="group flex flex-col items-center gap-4"
          >
            {!loadMoreLoading ? (
              <div className="w-16 h-16 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-xl bg-card group-hover:scale-110">
                <Plus size={24} />
              </div>
            ) : (
              <Loader2 className="text-primary animate-spin w-32 h-32" />
            )}
            <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 italic transition-all group-hover:tracking-[0.6em] group-hover:opacity-100">
              Reveal More Artifacts
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
