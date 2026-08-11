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
