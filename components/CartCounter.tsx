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
        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground border-2 border-background shadow-md animate-in fade-in zoom-in duration-300"
      >
        {totalItems}
      </span>
      <span className="sr-only">{t("cartCount", { count: totalItems })}</span>
    </>
  );
};
