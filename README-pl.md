# 🌌 Platforma Ecommerce Daydream

Daydream to zaawansowane rozwiązanie ecommerce typu full-stack zbudowane w oparciu o **Next.js 15**. Projekt prezentuje nowoczesne podejście do tworzenia aplikacji webowych, kładąc nacisk na bezpieczeństwo typów (Type Safety), logikę po stronie serwera (React Server Components) oraz rygorystyczny model bezpieczeństwa.

---

### 🌍 Wersje Językowe

- [English (Angielski)](./README.md)
- [Polski (Obecna)](./README-pl.md)

---

## 🚀 Przegląd Projektu

Celem projektu było stworzenie architektury gotowej do wdrożenia produkcyjnego. System obsługuje pełny cykl zakupowy — od dynamicznego przeglądania produktów i zarządzania trwałym koszykiem, po bezpieczne płatności Stripe i automatyzację realizacji zamówień.

### 🛡️ Kluczowe Aspekty Techniczne

- **Next.js 15 & React 19:** Wykorzystanie najnowszych funkcji, takich jak asynchroniczne API żądań oraz Server Actions do wszystkich mutacji danych.
- **Autoryzacja (Auth.js v5):** Implementacja Role-Based Access Control (RBAC). Sesje są zarządzane przez zaszyfrowane tokeny JWT przechowywane w bezpiecznych ciasteczkach HttpOnly (ochrona przed XSS).
- **Integralność Danych:** Rygorystyczna walidacja schematów przy użyciu **Prisma ORM** i **Zod**. Operacje bazodanowe są chronione weryfikacją sesji po stronie serwera.
- **Zarządzanie Stanem:** Logika koszyka odseparowana od UI dzięki **Zustand**, z własną warstwą persistencji synchronizującą stan między sesjami przeglądarki.

---

## ✨ Funkcjonalności

### 🛒 Logika Klienta

- **Zaawansowany Katalog:** Dynamiczne pobieranie danych z filtrowaniem według kategorii i atrybutów.
- **Inteligentny Koszyk:** Globalny stan z automatyczną synchronizacją z localStorage.
- **Bezpieczny Checkout:** Integracja z bramką płatniczą **Stripe** z weryfikacją stanów magazynowych i cen przed utworzeniem sesji.
- **Ekosystem Użytkownika:** Personalizowane pulpity, historia zamówień oraz system opinii "Voices".

### 🛡️ Panel Administratora

- **Pełna Kontrola Asortymentu:** Interfejs CRUD dla produktów, kategorii i składników (essences).
- **Zarządzanie Zamówieniami:** Monitorowanie statusów transakcji i logistyka dostaw w czasie rzeczywistym.
- **Optymalizacja Mediów:** Automatyczne przetwarzanie obrazów (Sharp) i hosting na Cloudinary.

---

## 🛠 Stos Technologiczny

| Warstwa            | Technologia                            |
| :----------------- | :------------------------------------- |
| **Framework**      | Next.js 15 (App Router), TypeScript 5  |
| **Baza Danych**    | PostgreSQL, Prisma ORM                 |
| **Bezpieczeństwo** | Auth.js v5, Bcrypt, Middleware         |
| **Płatności**      | Stripe (API & Webhooki)                |
| **Stylizacja**     | Tailwind CSS, Shadcn UI, Framer Motion |

---

## 📂 Dokumentacja Modułowa

Aby zgłębić techniczne szczegóły, przejdź do odpowiednich sekcji:

1.  [**Architektura i Routing**](./docs/pl/routing.md) - Wyjaśnienie struktury `@/app` i Server Actions.
2.  [**Instrukcja Konfiguracji**](./docs/pl/setup.md) - Instalacja krok po kroku i zmienne .env.
3.  [**Logika Funkcjonalności**](./docs/pl/features.md) - Szczegółowe omówienie procesu płatności i autoryzacji.

---

## ⚙️ Szybki Start

1.  **Sklonuj repozytorium:**

    ```bash
    git clone [https://github.com/pwrobel03/daydream-ecommerce-website.git](https://github.com/pwrobel03/daydream-ecommerce-website.git)
    cd daydream-ecommerce-website
    ```

2.  **Zainstaluj zależności:**

    ```bash
    npm install
    ```

3.  **Konfiguracja Bazy Danych:**
    Skonfiguruj plik `.env`, a następnie wykonaj:

    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Wypełnianie Bazy Danych (Seed):**
    Uruchom przygotowany skrypt, aby automatycznie wypełnić bazę przykładowymi produktami, kategoriami i składnikami:

    ```bash
    npx prisma db seed
    ```

5.  **Uruchom Serwer Deweloperski:**
    ```bash
    npm run dev
    ```
