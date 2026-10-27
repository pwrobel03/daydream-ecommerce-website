"use client";

import React, { useEffect, useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { getFreshCartData } from "@/actions/store/sync-cart";
import PriceFormatter from "@/components/PriceFormatter";
import { ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-24 text-center">
        <p className="text-base">{t("syncFailed")}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  if (!isMounted || isSyncing) {
    return (
      <div
        role="status"
        className="container mx-auto flex flex-col items-center gap-4 px-6 py-24"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("verifyingStock")}</p>
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

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center gap-6 px-6 py-24 text-center">
        <ShoppingBag size={40} className="text-muted-foreground" aria-hidden />
        <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-balance">
          {t("empty")}
        </h1>
        <Button asChild>
          <Link href="/">{t("findDream")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
      <h1 className="mb-8 font-display text-4xl leading-[1.1] tracking-tight text-balance">
        {t("title")}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
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

        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6 rounded-lg border bg-card p-6">
            <h2 className="font-display text-2xl leading-[1.2] tracking-tight">
              {t("summary")}
            </h2>

            <div className="flex items-baseline justify-between gap-4 border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {t("grandTotal")}
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                <PriceFormatter amount={getTotalPrice()} />
              </span>
            </div>

            {hasErrors && (
              <p role="alert" className="text-sm text-destructive">
                {t("stockProblem")}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="coupon">{t("couponCode")}</Label>
              <Input
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder={t("couponOptional")}
                autoComplete="off"
              />
            </div>

            {readOnlyReason && (
              <p className="text-sm text-muted-foreground">{readOnlyReason}</p>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={hasErrors || isPending || !!readOnlyReason}
              title={readOnlyReason}
              onClick={handleSecureFlow}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  {hasErrors ? t("fixIssues") : t("checkout")}
                  {!hasErrors && <ArrowRight />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
