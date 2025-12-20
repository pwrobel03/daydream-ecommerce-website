import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProductType } from "./types/product";

export interface CartItem {
  product: ProductType;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: ProductType) => void;
  removeItem: (productId: string) => void;
  deleteCartProduct: (productId: string) => void;
  resetCart: () => void;
  getTotalPrice: () => number;
  getSubTotalPrice: () => number;
  getItemCount: (productId: string) => number;
  getGroupedItems: () => CartItem[];
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
          } else {
            return { items: [...state.items, { product, quantity: 1 }] };
          }
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
          items: state.items.filter(
            ({ product }) => product?.id !== productId
          ),
        })),
      resetCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          // Jeśli jest promoPrice, bierzemy ją, jeśli nie - zwykłą cenę
          const activePrice = item.product.promoPrice || item.product.price || 0;
          return total + Number(activePrice) * item.quantity;
        }, 0);
      },
      getSubTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + Number(item.product.price || 0) * item.quantity;
        }, 0);
      },
      getItemCount: (productId) => {
        const item = get().items.find((item) => item.product.id === productId);
        return item ? item.quantity : 0;
      },
      getGroupedItems: () => get().items,
    }),
    { name: "cart-store" }
  )
);

export default useCartStore;