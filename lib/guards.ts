// lib/guards.ts
// Wspólne zabezpieczenia dla Server Actions.
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ActionError } from "@/lib/action-result";
import { getTranslations } from "next-intl/server";
import { isBackOfficeRole, isDemoAdmin } from "@/lib/demo";

/**
 * Przerywa wykonanie, jeśli bieżący użytkownik nie jest adminem.
 * Rzuca wyjątek zamiast zwracać błąd — dzięki temu pominięcie obsługi
 * wyniku nie przepuszcza żądania dalej. Wywołanie musi być objęte try/catch
 * akcji, która zamieni wyjątek na komunikat dla klienta.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    // Only the demo admin gets the explanatory message; everyone else stays "Unauthorized".
    const message = isDemoAdmin(session?.user?.role)
      ? (await getTranslations("errors"))("demoReadOnly")
      : "Unauthorized";
    throw new ActionError("FORBIDDEN", message);
  }
  return session;
}

/**
 * Own-account writes (profile, address, Voices, orders): signed-in USER or ADMIN.
 * The demo account is shared by all visitors, so it must never write.
 */
export async function requireOwnAccountWrites() {
  const session = await getSession();
  const t = await getTranslations("errors");
  if (!session?.user?.id) throw new ActionError("UNAUTHORIZED", t("unauthorized"));
  if (isDemoAdmin(session.user.role)) throw new ActionError("FORBIDDEN", t("demoReadOnly"));
  return session;
}

/** Back-office reads: the demo admin may look, but never write (writes use requireAdmin). */
export async function requireBackOffice() {
  const session = await getSession();
  if (!isBackOfficeRole(session?.user?.role)) {
    throw new ActionError("FORBIDDEN", "Unauthorized");
  }
  return session;
}

/**
 * Zwraca zamówienie, jeśli należy do bieżącego użytkownika i jest w podanym
 * stanie. W przeciwnym razie rzuca.
 *
 * Predykat `userId` był wcześniej dopisywany ręcznie przy każdym zapytaniu,
 * trzema różnymi zapisami — i w jednym miejscu został pominięty, co dało
 * podatność na dostęp do cudzego zamówienia (§1.2 raportu). Jedno miejsce
 * do audytu zamiast trzech.
 */
export async function requireOwnedOrder(
  orderId: string,
  options: { pendingOnly?: boolean } = {}
) {
  const session = await getSession();
  if (!session?.user?.id) throw new ActionError("UNAUTHORIZED", "Unauthorized");

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
      ...(options.pendingOnly ? { status: "PENDING", isPaid: false } : {}),
    },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw new ActionError("NOT_FOUND", "Order not found or already processed");
  }
  return order;
}
