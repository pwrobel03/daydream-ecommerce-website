// types/user.ts

import { UserRole } from "@/lib/generated/prisma/client"; // Najlepiej importować enumy bezpośrednio z Prisma Client

// Typ bazowy (Sesja) - to co dostajemy z Auth.js
export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  isOAuth: boolean;
};

// Pełny typ bazodanowy (dziedziczy po sesji i dodaje pola z Prisma)
export type UserType = SessionUser & {
  emailVerified: Date | null;
  addressId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
