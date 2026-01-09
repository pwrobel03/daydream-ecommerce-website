# 📂 Architektura Projektu i Routing

Niniejszy dokument szczegółowo opisuje system routingu oraz modułową organizację logiki biznesowej w platformie Daydream. Projekt wykorzystuje wzorce **Next.js 15 App Router** z podejściem zorientowanym na domeny (domain-driven) w zakresie Server Actions.

---

## 🏗️ Grupy Ścieżek i Layouty (Route Groups)

Wykorzystujemy **Grupy Ścieżek** (foldery w nawiasach), aby zarządzać różnymi kontekstami aplikacji i layoutami bez wpływu na strukturę adresów URL.

| Grupa         | Przeznaczenie Ścieżki   | Szczegóły Layoutu                                                         |
| :------------ | :---------------------- | :------------------------------------------------------------------------ |
| `(root)`      | Główny Sklep            | Globalny Navbar, Footer oraz trwały pasek boczny koszyka.                 |
| `(auth)`      | Zarządzanie Tożsamością | Minimalistyczny, wyśrodkowany układ dla formularzy logowania/rejestracji. |
| `(admin)`     | Panel Zarządzania       | Nawigacja oparta na pasku bocznym, dostęp ograniczony do administratorów. |
| `(protected)` | Konto Użytkownika       | Układ dla zamówień i zarządzania profilem.                                |

---

## ⚡ Server Actions: Logika Zorientowana na Domeny

Rdzeń logiki biznesowej znajduje się w katalogu `@/actions`. Pierwotna „płaska” struktura została zrefaktoryzowana na **Foldery Domenowe**, aby zapewnić skalowalność i łatwość utrzymania kodu.

### 📦 Domeny Akcji

#### 🛡️ Domena Admina (`@/actions/admin/`)

Zastrzeżona logika zarządzania sklepem.

- `inventory.ts` – Operacje CRUD na produktach i zarządzanie stanem magazynowym.
- `categories.ts` – Zarządzanie hierarchią kategorii i atrybutami.
- `ingredients.ts` – Zarządzanie składnikami produktów (esencjami).
- `orders.ts` – Globalne śledzenie zamówień i aktualizacja statusów realizacji.
- `reviews.ts` – Administracyjna moderacja opinii użytkowników.

#### 🔐 Domena Autoryzacji (`@/actions/auth/`)

Przepływ tożsamości oparty na Auth.js.

- `login.ts` / `logout.ts` – Zarządzanie sesją użytkownika.
- `register.ts` – Rejestracja nowych użytkowników.
- `password-reset.ts` – Połączona logika żądań resetowania hasła i ustawiania nowego hasła.
- `verify-email.ts` – Potwierdzanie adresu e-mail za pomocą tokenów.

#### 🛒 Domena Sklepu (`@/actions/store/`)

Interakcje bezpośrednie z klientem.

- `reviews.ts` – Skonsolidowana logika tworzenia, pobierania i zarządzania opiniami o produktach (Voices).
- `checkout.ts` – Inicjalizacja sesji Stripe oraz walidacja przedpłatowa.
- `cart.ts` – Synchronizacja koszyka po stronie serwera.

#### 👤 Domena Użytkownika (`@/actions/user/`)

Zarządzanie danymi osobowymi.

- `address.ts` – Zarządzanie informacjami o wysyłce i rozliczeniach.
- `settings.ts` – Aktualizacja profilu i preferencji konta.

---

## 🗺️ Mapa Aplikacji

### 🌐 Dostęp Publiczny

- `/` – Strona główna z wyróżnionymi kolekcjami.
- `/category/[categoryName]` – Główny katalog produktów z filtrowaniem wielokryterialnym.
- `/product/[slug]` – Dynamiczne strony produktów z powiązanymi opiniami.

### 🔐 Dostęp Chroniony

- `/dashboard` – Zunifikowany profil użytkownika i historia zamówień.
- `/checkout` – Bezpieczny tunel płatności (integracja ze Stripe).
- `/dashboard/(admin)/*` – Pełny zestaw narzędzi zarządczych (tylko dla Admina).

---

## 🛡️ Bezpieczeństwo i Middleware

Plik `middleware.ts` pełni rolę scentralizowanego strażnika aplikacji:

1. **Walidacja RBAC:** Uniemożliwia użytkownikom bez uprawnień administratora dostęp do ścieżek wewnątrz grupy `(admin)`.
2. **Trwałość Sesji:** Zapewnia, że sesje Auth.js są sprawdzane dla wszystkich chronionych tras.
3. **Whitelisting Ścieżek:** Definiuje trasy publiczne (Sklep, Strona główna), aby pozostały dostępne dla gości i robotów SEO.

---

## 🔗 Zewnętrzne Połączenia Zwrotne (API)

Standardowe trasy API są zarezerwowane dla integracji zewnętrznych:

- `POST /api/webhook` – **Stripe Webhook**: Przetwarza asynchroniczne zdarzenia płatności w celu finalizacji zamówień i aktualizacji rekordów w bazie danych.
