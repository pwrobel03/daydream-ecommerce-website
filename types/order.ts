// types/order.ts
import type { OrderStatus } from "@/lib/generated/prisma/client";

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
  /**
   * Tylko te pola produktu, które rysują widoki zamówień. Wcześniej stała tu
   * sygnatura indeksowa pochłaniająca cokolwiek zwrócił dany `select`, więc
   * typ nie mógł wyłapać widoku sięgającego po pole, którego zapytanie nie
   * pobrało. `slug` i `images` są opcjonalne, bo lista admina ich nie selectuje.
   */
  product: {
    name: string;
    slug?: string;
    images?: { url: string }[];
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
