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

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: any; // Decimal z Prisma traktowany jako liczba/string
  promoPrice?: any | null;
  weight?: string | null;
  stock: number;
  statusId?: string | null;
  
  // RELACJE (To tutaj brakowało kategorii i recenzji)
  status?: Status | null;
  images: ProductImage[];
  categories: Category[];
  reviews: Review[];
  
  createdAt: Date;
  updatedAt: Date;
}