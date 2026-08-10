// hooks/use-cart.ts
import useCartStore from "@/store"; // upewnij się, że ścieżka jest poprawna
import { useMounted } from "@/hooks/use-mounted";

export const useCart = () => {
  const store = useCartStore();
  const isMounted = useMounted();

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