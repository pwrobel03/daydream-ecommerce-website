// hooks/use-cart.ts
import { useState, useEffect } from "react";
import useCartStore from "@/store"; // upewnij się, że ścieżka jest poprawna

export const useCart = () => {
  const store = useCartStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dopóki komponent nie jest zamontowany na kliencie, 
  // zwracamy puste dane (aby uniknąć błędu hydracji), 
  // ale zachowujemy funkcje (akcje), które nie psują renderu.
  return {
    ...store,
    items: isMounted ? store.items : [],
    totalPrice: isMounted ? store.getTotalPrice() : 0,
    subtotalPrice: isMounted ? store.getSubTotalPrice() : 0,
    isMounted,
  };
};