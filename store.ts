import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartSyncProduct } from "./actions/store/sync-cart";
import { CartProduct } from "./types/product";
import { activePrice, basePrice } from "./lib/pricing";

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

/**
 * Zawęża produkt z katalogu do tego, co koszyk naprawdę rysuje.
 *
 * Bez tego do localStorage trafiał cały agregat — opis, kategorie, składniki
 * i lista opinii z autorami — którego widok koszyka nigdy nie czytał, a który
 * starzał się w nieskończoność.
 */
type CatalogueProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  promoPrice?: number | null;
  images: { url: string }[];
  status?: { name: string; color?: string | null } | null;
};

export function toCartProduct(product: CatalogueProduct): CartProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    promoPrice: product.promoPrice ?? null,
    stock: product.stock,
    images: product.images?.[0] ? [{ url: product.images[0].url }] : [],
    status: product.status
      ? { name: product.status.name, color: product.status.color ?? null }
      : null,
  };
}

interface PersistedCart {
  items?: { product: CatalogueProduct; quantity: number }[];
}

/**
 * Przenosi koszyk zapisany przed zawężeniem kształtu na nowy.
 *
 * Wydzielona i wyeksportowana, bo inaczej dałoby się ją sprawdzić tylko przez
 * wnętrze zustanda — a to jedyny kod w tym pliku, który dotyka danych realnych
 * użytkowników zapisanych przed wdrożeniem.
 */
export function migrateCart(persisted: unknown, version: number): unknown {
  const state = persisted as PersistedCart | null;
  if (version >= 1 || !state?.items) return persisted;

  return {
    ...state,
    items: state.items
      .filter((item) => item?.product?.id)
      .map((item) => ({
        product: toCartProduct(item.product),
        quantity: item.quantity,
      })),
  };
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  deleteCartProduct: (productId: string) => void;
  resetCart: () => void;
  getTotalPrice: () => number;
  getSubTotalPrice: () => number;
  getItemCount: (productId: string) => number;
  getGroupedItems: () => CartItem[];
  /** Zwraca nazwy pozycji, które zniknęły z katalogu i zostały usunięte. */
  syncItems: (freshData: CartSyncProduct[]) => string[];
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return { items: [...state.items, { product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.reduce((acc, item) => {
            if (item.product.id === productId) {
              if (item.quantity > 1) {
                acc.push({ ...item, quantity: item.quantity - 1 });
              }
            } else {
              acc.push(item);
            }
            return acc;
          }, [] as CartItem[]),
        })),
      deleteCartProduct: (productId) =>
        set((state) => ({
          items: state.items.filter(({ product }) => product?.id !== productId),
        })),
      resetCart: () => set({ items: [] }),
      syncItems: (freshData) => {
        const fresh = new Map(
          freshData.map((product) => [product.id, product])
        );

        // Produkt, którego serwer nie zwrócił, nie istnieje już w katalogu.
        // Wcześniej taka pozycja zostawała w koszyku na zawsze, a
        // `initializeOrder` odrzucał przez nią całe zamówienie, nie wskazując
        // której pozycji dotyczy — koszyk stawał się nie do przejścia.
        const removed = get()
          .items.filter((item) => !fresh.has(item.product.id))
          .map((item) => item.product.name);

        set((state) => ({
          items: state.items.flatMap((item) => {
            const update = fresh.get(item.product.id);
            if (!update) return [];

            return [{ ...item, product: { ...item.product, ...update } }];
          }),
        }));

        return removed;
      },
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + activePrice(item.product) * item.quantity,
          0
        );
      },
      getSubTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + basePrice(item.product) * item.quantity,
          0
        );
      },
      getItemCount: (productId) => {
        const item = get().items.find((item) => item.product.id === productId);
        return item ? item.quantity : 0;
      },
      getGroupedItems: () => get().items,
    }),
    {
      name: "cart-store",
      // Koszyki zapisane przed zawężeniem kształtu trzymają całe produkty.
      // Migracja przepuszcza je przez ten sam mapper, więc istniejący koszyk
      // przeżywa wdrożenie zamiast zniknąć albo wywrócić render.
      version: 1,
      migrate: (persisted, version) =>
        migrateCart(persisted, version) as CartState,
    }
  )
);

export default useCartStore;
