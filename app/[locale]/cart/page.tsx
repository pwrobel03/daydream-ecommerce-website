"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getFreshCartData } from "@/actions/store/sync-cart";
import PriceFormatter from "@/components/PriceFormatter";
import {
  ArrowRight,
  
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/cart/product-card";
import { useRouter } from "next/navigation";
import { initializeOrder } from "@/actions/order/order";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useReadOnlyReason } from "@/hooks/use-read-only-reason";

const CartPage = () => {
  const t = useTranslations("cart");
  const {
    items,
    syncItems,
    deleteCartProduct,
    getTotalPrice,
    
    isMounted,
  } = useCart();
  const router = useRouter();
  const readOnlyReason = useReadOnlyReason();
  const [isPending, setIsPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [syncFailed, setSyncFailed] = useState(false);
  const [coupon, setCoupon] = useState("");

  // Kontrola cen i stanów ma pójść raz, po zamontowaniu; `items` zmienia
  // się w jej wyniku, więc pełna lista zależności zapętliłaby zapytanie.
  useEffect(() => {
    const sync = async () => {
      if (isMounted && items.length > 0) {
        try {
          const freshData = await getFreshCartData(
            items.map((i) => i.product.id)
          );

          // Pozycje, których serwer nie zwrócił, zniknęły z katalogu.
          // Trzeba je nazwać — inaczej użytkownik widzi tylko, że koszyk
          // się skurczył, albo (wcześniej) że zamówienia nie da się złożyć.
          const removed = syncItems(freshData);
          if (removed.length > 0) {
            toast.error(t("removedUnavailable", { names: removed.join(", ") }));
          }
        } catch {
          // Awaria sprawdzenia nie może udawać, że ceny są aktualne.
          setSyncFailed(true);
        }
      }
      setIsSyncing(false);
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  if (syncFailed) {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center gap-4 text-center">
        <p className="text-sm font-black uppercase tracking-widest">
          {t("syncFailed")}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 rounded-full border font-black uppercase italic text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (!isMounted || isSyncing) {
    return (
      <div className="container mx-auto px-6 py-40 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 italic">
          {t("verifyingStock")}
        </p>
      </div>
    );
  }

  const handleSecureFlow = async () => {
    setIsPending(true);

    // Wysyłamy wyłącznie id i ilość — ceny wylicza serwer z bazy.
    // Kod idzie na serwer surowy — tam jest weryfikowany i tam liczy się rabat.
    const res = await initializeOrder(
      items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      coupon.trim() || undefined
    );

    if (!res.ok) {
      // Odmowa z powodu stanu magazynowego znaczy, że koszyk pokazuje
      // nieaktualne dane — pobieramy je ponownie, żeby użytkownik zobaczył,
      // czego dotyczy komunikat, zamiast klikać w to samo jeszcze raz.
      if (res.code === "OUT_OF_STOCK") {
        syncItems(await getFreshCartData(items.map((i) => i.product.id)));
      }
      toast.error(res.message);
      setIsPending(false);
      return;
    }

    toast.success(t("reserved"));
    router.push(`/cart/delivery/${res.data.orderId}`);
  };

  // Looking for error inside cart
  // Product now can be out of stock or we can have more items than in stock
  const hasErrors = items.some(
    (item) =>
      item.product.stock === 0 || item.quantity > (item.product.stock || 0)
  );

  // No items in stock
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-40 text-center">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <ShoppingBag size={120} className="opacity-5 italic" />
            <X className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-text h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
              {t("empty")}
            </h1>
          </div>
          <Link
            href="/"
            className="group relative px-12 py-6 bg-foreground text-background hover:text-white rounded-full overflow-hidden transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10 font-black uppercase italic tracking-tighter text-xl">
              {t("findDream")}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <div className="flex justify-between items-end mb-16 border-b pb-10 font-black italic uppercase tracking-tighter">
        <h1 className="text-7xl">{t("title")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-6">
          {items.map((item) => {
            const stock = item.product.stock || 0;
            const isOutOfStock = stock === 0;
            const isOverLimit = item.quantity > stock;

            return (
              <ProductCard
                key={item.product.id}
                item={item}
                stock={stock}
                isOutOfStock={isOutOfStock}
                isOverLimit={isOverLimit}
                deleteCartProduct={deleteCartProduct}
              />
            );
          })}
        </div>

        {/* SUMMARY */}
        <div className="lg:col-span-4">
          <div className="sticky top-10 p-12 shadow-2xl space-y-10 bg-card rounded-[2rem]">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-tight">
              {t("summary")}
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-t  pt-8 mt-8">
                <span className="text-md font-black uppercase tracking-[0.4em] opacity-70">
                  {t("grandTotal")}
                </span>
                <span className="text-3xl font-black italic tracking-tighter text-primary-text">
                  <PriceFormatter amount={getTotalPrice()} />
                </span>
              </div>
            </div>

            {hasErrors && (
              <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                {t("stockProblem")}
              </p>
            )}

            <div className="space-y-3">
              <label
                htmlFor="coupon"
                className="block text-[10px] font-black uppercase tracking-[0.3em] opacity-70"
              >
                {t("couponCode")}
              </label>
              <input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder={t("couponOptional")}
                autoComplete="off"
                className="h-14 w-full rounded-full border bg-transparent px-6 text-sm font-black uppercase tracking-widest outline-none transition-colors focus:border-primary"
              />
            </div>

            {readOnlyReason && (
              <p className="text-center text-sm text-muted-foreground">{readOnlyReason}</p>
            )}

            <button
              disabled={hasErrors || isPending || !!readOnlyReason}
              title={readOnlyReason}
              onClick={handleSecureFlow}
              className={cn(
                "group relative w-full h-24 rounded-full overflow-hidden transition-all shadow-xl active:scale-95",
                readOnlyReason && "cursor-not-allowed opacity-60",
                hasErrors
                  ? "cursor-not-allowed bg-destructive/25 text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:scale-[1.02]"
              )}
            >
              {!hasErrors && (
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              )}
              <div className="relative z-10 flex items-center justify-center gap-4 text-2xl font-black uppercase italic tracking-tighter">
                <span>{hasErrors ? t("fixIssues") : t("checkout")}</span>
                <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
