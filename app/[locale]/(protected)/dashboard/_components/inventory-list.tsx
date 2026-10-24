"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";
import { Edit3, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct } from "@/actions/admin/inventory";
import PriceFormatter from "@/components/PriceFormatter";
import ProductStatusBadge from "@/components/product-status-badge";
import { cn } from "@/lib/utils";
import type { InventoryProduct } from "@/types/product";

export function InventoryList({ products }: { products: InventoryProduct[] }) {
  const t = useTranslations("dashboard");
  const readOnlyReason = useReadOnlyReason();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" forever?`)) return;

    startTransition(async () => {
      const res = await deleteProduct(id);
      // Wcześniej nieudane usunięcie nie dawało żadnego sygnału.
      if (!res.ok) {
        toast.error(res.message);
        return;
      }

      toast.success(t("feedback.productRemoved"));
      // Lista pochodzi z serwera, więc odświeżamy ją zamiast trzymać kopię.
      router.refresh();
    });
  };

  if (products.length === 0) {
    return (
      <div className="p-20 text-center border-2 border-dashed rounded-[4rem] opacity-20">
        <p className="font-black italic uppercase tracking-[0.6em] text-sm">
          The Vault is Empty
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {products.map((product) => (
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
              <Link href={`/product/${product.slug}`}>
                <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-[0.8] cursor-pointer">
                  {product.name}
                </h3>
              </Link>
              <div className="flex flex-wrap gap-2 pt-2">
                {product.categories.map((cat) => (
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
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
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
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
                  Stock
                </p>
                <p
                  className={cn(
                    "text-3xl font-black italic leading-none",
                    product.stock <= 5 ? "text-primary-text animate-pulse" : ""
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
                  aria-label={t("actions.edit", { name: product.name })}
                  className="w-12 h-12 rounded-full border bg-card flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-500 shadow-sm group/btn"
                >
                  <Edit3
                    size={18}
                    className="group-hover/btn:rotate-12 transition-transform"
                  />
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={isPending || !!readOnlyReason}
                  title={readOnlyReason}
                  aria-label={t("actions.delete", { name: product.name })}
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
      ))}
    </div>
  );
}
