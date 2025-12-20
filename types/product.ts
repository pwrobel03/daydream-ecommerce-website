export interface ProductType {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice?: number;
  stock: number;
  weight: string | null;
  status?: string | null;
  images: { url: string }[];
  ingredients: { id: string; name: string; image: string | null }[];
}