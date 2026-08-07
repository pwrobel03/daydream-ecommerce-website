// lib/guards.ts
// Wspólne zabezpieczenia dla Server Actions.
import { auth } from "@/auth";

/**
 * Przerywa wykonanie, jeśli bieżący użytkownik nie jest adminem.
 * Rzuca wyjątek zamiast zwracać błąd — dzięki temu pominięcie obsługi
 * wyniku nie przepuszcza żądania dalej. Wywołanie musi być objęte try/catch
 * akcji, która zamieni wyjątek na komunikat dla klienta.
 */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}
