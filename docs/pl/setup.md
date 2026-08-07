# 🛠️ Instalacja i konfiguracja

Jak uruchomić platformę Daydream lokalnie.

---

## 📋 Wymagania

- **Node.js 20.x** lub nowszy
- **npm**
- **PostgreSQL** — lokalna instancja albo hostowana (Neon, Supabase)
- **Stripe CLI** — opcjonalnie, potrzebne do testowania webhooków lokalnie

---

## ⚙️ Konfiguracja

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/pwrobel03/daydream-ecommerce-website.git
cd daydream-ecommerce-website
```

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Zmienne środowiskowe

Skopiuj `.env.example` do `.env` i uzupełnij wartości. Każdy klucz jest walidowany przy
starcie przez `lib/env.ts`, więc brakująca lub zniekształcona wartość zatrzymuje aplikację
z komunikatem wskazującym konkretną zmienną, zamiast wywalać się później w runtime.

```env
# Baza danych
DATABASE_URL="postgresql://user:password@localhost:5432/daydream"

# Auth.js — sekret wygenerujesz przez: npx auth secret
AUTH_SECRET="your_auth_secret_here"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# Dostawcy OAuth.
# Auth.js v5 wykrywa te zmienne po nazwie — klucze nie są przekazywane jawnie
# w auth.config.ts, więc pisownia AUTH_<PROVIDER>_ID / _SECRET jest wymagana.
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"
AUTH_GITHUB_ID="your_github_client_id"
AUTH_GITHUB_SECRET="your_github_client_secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend
RESEND_API_KEY="re_..."
MAILING_ACCOUNT_PROVIDER="onboarding@resend.dev"
MAILING_ACCOUNT="twoja_zweryfikowana_skrzynka@example.com"

# Aplikacja
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Uwaga o mailach.** Dopóki nie zweryfikujesz domeny nadawcy w Resend, oba maile
> transakcyjne trafiają na adres z `MAILING_ACCOUNT`, niezależnie od odbiorcy. Ustaw tam
> skrzynkę, do której masz dostęp — inaczej linki weryfikacyjne będą nieosiągalne.

---

## 🗄️ Baza danych

Projekt korzysta z **Prisma ORM**.

1. **Wygeneruj klienta:**

   ```bash
   npx prisma generate
   ```

2. **Wypchnij schemat:**

   ```bash
   npx prisma db push
   ```

3. **Seed:**
   Tworzy kategorie, statusy, składniki, produkty, użytkowników, opinie i przykładowe
   zamówienia. Zalecane — bez tego sklep renderuje się pusty.

   ```bash
   npx prisma db seed
   ```

---

## 💳 Webhooki Stripe

Aby finalizować płatności lokalnie, przekieruj zdarzenia Stripe na serwer deweloperski.
Zwróć uwagę na pełną ścieżkę — handler leży pod `/api/webhook/stripe`, nie `/api/webhook`:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Sekret `whsec_...` wypisany przez CLI wklej do `STRIPE_WEBHOOK_SECRET`.

Karta testowa: `4242 4242 4242 4242`, dowolna przyszła data ważności, dowolny CVC.

---

## 🚀 Uruchomienie

```bash
npm run dev
```

Aplikacja pod [http://localhost:3000](http://localhost:3000).

Żeby zalogować się jako administrator, ustaw rolę bezpośrednio w bazie — nie ma
mechanizmu samodzielnego nadania uprawnień:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ty@example.com';
```

---

## 🛠️ Rozwiązywanie problemów

- **Aplikacja kończy się przy starcie listą zmiennych środowiskowych** — to `lib/env.ts`
  robi swoją robotę. Komunikat wskazuje każdy problematyczny klucz.
- **Zmiany w schemacie nie są widoczne** — uruchom ponownie `npx prisma db push`,
  a potem `npx prisma generate`.
- **Błędy typów tras po usunięciu strony** — usuń katalog `.next` i powtórz sprawdzanie
  typów.
- **`npm run lint` wywala się na `compat is not defined`** — flat config ESLinta jest
  obecnie zepsuty, patrz `markdown/improvement.md`.
