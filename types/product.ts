// types/product.ts

export interface ProductImage {
  id: string;
  url: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
}

export interface Status {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

export interface Review {
  id: string;
  content: string;
  rating: number;
  userId: string;
  user: {
    name: string | null;
    image: string | null;
  };
  createdAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  image?: string | null;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  // Prisma zwraca Decimal. Część ścieżek konwertuje go na `number` mapperem,
  // część przepuszcza przez JSON.parse(JSON.stringify(...)), co daje `string`.
  // Unia opisuje stan faktyczny; ujednolicenie wymaga warstwy DTO (§2.6 raportu).
  price: number | string;
  promoPrice?: number | string | null;
  weight?: string | null;
  stock: number;
  statusId?: string | null;
  
  // RELACJE (To tutaj brakowało kategorii i recenzji)
  status?: Status | null;
  images: ProductImage[];
  categories: Category[];
  ingredients: Ingredient[]
  reviews: Review[];
  
  createdAt: Date;
  updatedAt: Date;
}
/** Kształt zwracany przez `getFreshCartData` — odświeżone ceny i stan magazynowy. */
export interface CartSyncProduct {
  id: string;
  name: string;
  price: number;
  promoPrice: number | null;
  stock: number;
}
