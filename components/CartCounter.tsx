"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/hooks/use-cart";

export const CartCounter = () => {
  const t = useTranslations("nav");
  const { items, isMounted } = useCart();

  // Liczymy sumę ilości sztuk
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Jeśli nie zamontowano lub koszyk pusty - nie renderujemy nic (bezpieczne dla SSR)
  if (!isMounted || totalItems === 0) return null;

  return (
    // aria-hidden na cyfrze, a treść dla czytnika w osobnym tekście: samo
    // "3" obok "Cart" brzmi jak dwa niepowiązane komunikaty.
    <>
      <span
        aria-hidden="true"
        className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-secondary px-1 text-xs font-medium tabular-nums text-secondary-foreground"
      >
        {totalItems > 99 ? "99+" : totalItems}
      </span>
      <span className="sr-only">{t("cartCount", { count: totalItems })}</span>
    </>
  );
};
