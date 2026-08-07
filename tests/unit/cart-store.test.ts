import { beforeEach, describe, expect, it } from "vitest";
import useCartStore from "@/store";
import type { ProductType } from "@/types/product";

// Minimalny produkt — testy dotyczą wyłącznie pól cenowych i stanu magazynowego.
function product(overrides: Partial<ProductType> & { id: string }): ProductType {
  return {
    name: `Product ${overrides.id}`,
    slug: `product-${overrides.id}`,
    price: 10,
    promoPrice: null,
    stock: 100,
    images: [],
    categories: [],
    ingredients: [],
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as ProductType;
}

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().resetCart();
  });

  describe("addItem", () => {
    it("adds a new product with quantity 1", () => {
      useCartStore.getState().addItem(product({ id: "a" }));

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(1);
    });

    it("increments quantity instead of duplicating an existing product", () => {
      const a = product({ id: "a" });
      useCartStore.getState().addItem(a);
      useCartStore.getState().addItem(a);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });
  });

  describe("removeItem", () => {
    it("decrements quantity when more than one is held", () => {
      const a = product({ id: "a" });
      useCartStore.getState().addItem(a);
      useCartStore.getState().addItem(a);
      useCartStore.getState().removeItem("a");

      expect(useCartStore.getState().items[0].quantity).toBe(1);
    });

    it("drops the line entirely when the last one is removed", () => {
      useCartStore.getState().addItem(product({ id: "a" }));
      useCartStore.getState().removeItem("a");

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it("leaves other products untouched", () => {
      useCartStore.getState().addItem(product({ id: "a" }));
      useCartStore.getState().addItem(product({ id: "b" }));
      useCartStore.getState().removeItem("a");

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product.id).toBe("b");
    });
  });

  describe("pricing", () => {
    it("uses promoPrice for the total when one is set", () => {
      useCartStore.getState().addItem(product({ id: "a", price: 100, promoPrice: 60 }));

      expect(useCartStore.getState().getTotalPrice()).toBe(60);
    });

    it("keeps the base price in the subtotal so the strike-through stays meaningful", () => {
      useCartStore.getState().addItem(product({ id: "a", price: 100, promoPrice: 60 }));

      expect(useCartStore.getState().getSubTotalPrice()).toBe(100);
    });

    it("multiplies by quantity", () => {
      const a = product({ id: "a", price: 25 });
      useCartStore.getState().addItem(a);
      useCartStore.getState().addItem(a);
      useCartStore.getState().addItem(a);

      expect(useCartStore.getState().getTotalPrice()).toBe(75);
    });

    it("sums across several products", () => {
      useCartStore.getState().addItem(product({ id: "a", price: 10 }));
      useCartStore.getState().addItem(product({ id: "b", price: 15, promoPrice: 5 }));

      expect(useCartStore.getState().getTotalPrice()).toBe(15);
      expect(useCartStore.getState().getSubTotalPrice()).toBe(25);
    });

    it("treats a promoPrice of 0 as a real discount, not a missing value", () => {
      // Regresja: `promoPrice || price` traktuje 0 jako brak wartości
      // i po cichu nalicza cenę podstawową.
      useCartStore.getState().addItem(product({ id: "a", price: 100, promoPrice: 0 }));

      expect(useCartStore.getState().getTotalPrice()).toBe(0);
    });
  });

  describe("syncItems", () => {
    it("overwrites price and stock with the values fetched from the server", () => {
      useCartStore.getState().addItem(product({ id: "a", price: 10, stock: 5 }));
      useCartStore.getState().syncItems([{ id: "a", price: 12, promoPrice: null, stock: 2 }]);

      const item = useCartStore.getState().items[0];
      expect(item.product.price).toBe(12);
      expect(item.product.stock).toBe(2);
      expect(useCartStore.getState().getTotalPrice()).toBe(12);
    });

    it("leaves products absent from the server response alone", () => {
      useCartStore.getState().addItem(product({ id: "a", price: 10 }));
      useCartStore.getState().syncItems([{ id: "other", price: 99, promoPrice: null, stock: 1 }]);

      expect(useCartStore.getState().items[0].product.price).toBe(10);
    });

    it("preserves quantity while refreshing product data", () => {
      const a = product({ id: "a", price: 10 });
      useCartStore.getState().addItem(a);
      useCartStore.getState().addItem(a);
      useCartStore.getState().syncItems([{ id: "a", price: 20, promoPrice: null, stock: 9 }]);

      expect(useCartStore.getState().items[0].quantity).toBe(2);
      expect(useCartStore.getState().getTotalPrice()).toBe(40);
    });
  });

  describe("getItemCount", () => {
    it("reports the quantity held for a product", () => {
      const a = product({ id: "a" });
      useCartStore.getState().addItem(a);
      useCartStore.getState().addItem(a);

      expect(useCartStore.getState().getItemCount("a")).toBe(2);
    });

    it("reports zero for a product not in the cart", () => {
      expect(useCartStore.getState().getItemCount("missing")).toBe(0);
    });
  });
});
