// types/order.ts
import type { OrderStatus } from "@/lib/generated/prisma/client";
import type { ProductImage } from "./product";

export interface AddressType {
  id: string;
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  phone: string;
}

export interface OrderItemType {
  id: string;
  quantity: number;
  price: number;
  // Poszczególne widoki selectują różne podzbiory pól produktu,
  // dlatego wszystko poza nazwą jest opcjonalne.
  product: {
    name: string;
    images?: { url: string }[];
    // Widoki selectują różne podzbiory; pozostałe pola nie są tu używane.
    [key: string]: unknown;
  };
}

export interface OrderType {
  id: string;
  totalAmount: number;
  discountAmount?: number;
  status: OrderStatus;
  isPaid: boolean;
  createdAt: Date | string;
  items: OrderItemType[];
  userId?: string;
  address?: AddressType | null;
}

/** Zamówienie w widoku admina — dochodzą dane kupującego. */
export interface AdminOrderType extends OrderType {
  user: { name: string | null; email: string | null };
}
