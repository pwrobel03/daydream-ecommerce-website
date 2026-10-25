// types/product.ts

/**
 * Produkt zapisany w koszyku.
 *
 * Świadomie wąski: koszyk trafia do localStorage, a wcześniej trzymał tam całe
 * `ProductType` — z opisem, kategoriami, składnikami i listą opinii wraz
 * z autorami. Nic z tego nie było renderowane, a wszystko się starzało.
 * Tutaj są wyłącznie pola, które rysuje widok koszyka.
 */
export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  /** Tylko pierwszy obrazek — koszyk pokazuje miniaturę. */
  images: { url: string }[];
  status?: { name: string; color: string | null } | null;
}
