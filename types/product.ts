// types/product.ts

export interface UserType {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ReviewType {
  id: string;
  content: string;
  rating: number;
  userId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    name: string | null;
    image: string | null;
  };
}

export interface StatusType {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;       // Uwaga: Decimal z Prisma po JSON.stringify staje się number/string
  promoPrice: number | null; 
  stock: number;
  weight: string | null;
  
  // Zmiana: status to teraz obiekt, a nie prosty string
  status: StatusType | null; 
  
  // Relacje
  images: { id: string; url: string }[];
  ingredients: { id: string; name: string; image: string | null }[];
  reviews: ReviewType[]; // DODANE: lista recenzji
  
  createdAt: string | Date;
}