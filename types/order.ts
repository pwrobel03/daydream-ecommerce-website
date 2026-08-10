// types/order.ts
import type { OrderStatus } from "@prisma/client";
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
  // Jak w ProductType — Decimal dociera tu albo jako number, albo jako string,
  // zależnie od tego, którą ścieżką serializacji przeszedł.
  price: number | string;
  // Poszczególne widoki selectują różne podzbiory pól produktu,
  // dlatego wszystko poza nazwą jest opcjonalne.
  product: {
    id?: string;
    name: string;
    slug?: string;
    images?: ProductImage[];
  };
}

export interface OrderType {
  id: string;
  totalAmount: number | string;
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
