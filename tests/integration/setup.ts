import { vi } from "vitest";

// Akcje serwerowe tłumaczą komunikaty przez next-intl, co wymaga kontekstu
// żądania. Testy integracyjne wywołują je bezpośrednio, więc podstawiamy
// funkcję zwracającą klucz — asercje dotyczą tego, CZY akcja odmówiła,
// a nie w jakim języku to napisała.
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}));
