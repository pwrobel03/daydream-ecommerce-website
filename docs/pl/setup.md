# 🛠️ Instrukcja Instalacji i Konfiguracji

Ten przewodnik przeprowadzi Cię przez kroki niezbędne do uruchomienia platformy e-commerce Daydream na Twoim lokalnym urządzeniu.

---

## 📋 Wymagania Wstępne

Zanim zaczniesz, upewnij się, że masz zainstalowane:

- **Node.js 20.x** lub nowszy
- **npm** lub **yarn**
- **PostgreSQL** (Lokalna instancja lub baza w chmurze, np. Supabase/Neon)
- **Stripe CLI** (Opcjonalnie, do testowania webhooków lokalnie)

---

## ⚙️ Konfiguracja Krok po Kroku

### 1. Sklonuj Repozytorium

```bash
git clone [https://github.com/pwrobel03/daydream-ecommerce-website.git](https://github.com/pwrobel03/daydream-ecommerce-website.git)
cd daydream-ecommerce-website
```

### 2. Zainstaluj Zależności

```bash
npm install
```

### 3. Zmienne Środowiskowe

Stwórz plik `.env` w głównym katalogu projektu. Możesz wykorzystać poniższy wzór:

```env
# Baza Danych (PostgreSQL)
DATABASE_URL="postgresql://uzytkownik:haslo@localhost:5432/daydream"

# Autoryzacja (Auth.js / NextAuth)
AUTH_SECRET="twoj-tajny-klucz" # Wygeneruj przez: npx auth secret
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Dostawcy OAuth
GOOGLE_CLIENT_ID="twoje-google-id"
GOOGLE_CLIENT_SECRET="twoje-google-secret"
GITHUB_CLIENT_ID="twoje-github-id"
GITHUB_CLIENT_SECRET="twoje-github-secret"

# Stripe (Płatności)
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend (Usługa E-mail)
RESEND_API_KEY="re_..."
```

---

## 🗄️ Inicjalizacja Bazy Danych

Projekt wykorzystuje **Prisma ORM**. Użyj poniższych komend, aby zsynchronizować schemat i wypełnić bazę danych.

1. **Generowanie Klienta Prisma:**

   ```bash
   npx prisma generate
   ```

2. **Wysłanie Schematu do Bazy:**

   ```bash
   npx prisma db push
   ```

3. **Wypełnianie Bazy Danych (Seeding):**
   Projekt zawiera skrypt seedujący, który tworzy domyślne kategorie, statusy oraz przykładowe produkty. Jest to kluczowe dla poprawnego wyświetlania interfejsu przy pierwszym uruchomieniu.
   ```bash
   npx prisma db seed
   ```

---

## 💳 Testowanie Webhooków Stripe

Aby poprawnie obsługiwać płatności lokalnie, musisz przekierowywać zdarzenia ze Stripe do swojego lokalnego serwera:

1. Zaloguj się do Stripe CLI: `stripe login`
2. Uruchom nasłuchiwanie:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
3. Skopiuj **Webhook Secret** (zaczynający się od `whsec_`) podany przez CLI i wklej go do pliku `.env` jako `STRIPE_WEBHOOK_SECRET`.

---

## 🚀 Uruchamianie Aplikacji

Gdy wszystko jest skonfigurowane, uruchom serwer deweloperski:

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Rozwiązywanie Problemów

- **Niezgodność Schematu Prisma:** Jeśli zmienisz plik `schema.prisma`, zawsze wykonaj `npx prisma db push`, a następnie `npx prisma generate`.
- **Błędy Przekierowań Auth:** Upewnij się, że w konsolach deweloperskich Google/GitHub adresy zwrotne (callback URLs) są ustawione na `http://localhost:3000/api/auth/callback/[nazwa-dostawcy]`.
