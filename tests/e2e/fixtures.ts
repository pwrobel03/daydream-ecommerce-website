// Stałe współdzielone przez seed i spec-y.
//
// Osobny moduł, bo `seed.ts` wykonuje `main()` przy imporcie — a ten kasuje
// wszystkie tabele. Dopóki spec-y importowały stałe stamtąd, każdy taki import
// odpalał seed jeszcze raz, już w trakcie trwania testów, i losowo wywracał
// je błędem "No record was found". Tutaj nie ma żadnego efektu ubocznego.
export const E2E_USER = {
  email: "e2e@example.com",
  password: "e2e-password-123",
  name: "E2E Buyer",
};

export const E2E_ADMIN = {
  email: "e2e-admin@example.com",
  password: "e2e-admin-123",
  name: "E2E Admin",
};

export const E2E_PRODUCT = {
  name: "Test Bar",
  slug: "test-bar",
  price: 20,
  stock: 25,
};

export const E2E_REVIEWS = [
  { rating: 5, content: "Absolutely luminous, a keeper." },
  { rating: 2, content: "Arrived melted and rather sad." },
];

/**
 * Wypełniacz, żeby produkt miał więcej opinii, niż strona pobiera (`take: 9`).
 * Bez tego test średniej przechodziłby też ze starą wersją, która liczyła ją
 * z pobranego podzbioru — różnica ujawnia się dopiero powyżej progu.
 *
 * Każda opinia potrzebuje osobnego autora: unikalny indeks (productId, userId)
 * dopuszcza jedną opinię użytkownika na produkt.
 */
export const E2E_BULK_REVIEWS = Array.from({ length: 12 }, (_, i) => ({
  rating: (i % 5) + 1,
  content: `Filler review number ${i + 1}.`,
}));

/** Średnia wszystkich opinii produktu z seeda — wartość oczekiwana w teście. */
export const E2E_RATING = (() => {
  const all = [...E2E_REVIEWS, ...E2E_BULK_REVIEWS];
  const sum = all.reduce((total, r) => total + r.rating, 0);
  return { avg: sum / all.length, count: all.length };
})();

/** Zapisana sesja admina, produkowana raz przez projekt `setup`. */
export const ADMIN_STATE = "tests/e2e/.auth/admin.json";
