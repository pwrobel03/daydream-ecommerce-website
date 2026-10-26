# Platforma Ecommerce Daydream

Daydream to aplikacja ecommerce typu full-stack zbudowana na **Next.js 16** i **React 19**.
Obejmuje pełny cykl zakupowy — przeglądanie katalogu, trwały koszyk, rezerwację stanu
magazynowego, płatności Stripe, realizację zamówień sterowaną webhookiem oraz panel
administratora.

---

### 🌍 Wersje językowe

- [English (angielski)](./README.md)
- [Polski (obecna)](./README-pl.md)

---

## 🚀 Przegląd projektu

Celem było zbudowanie architektury ecommerce od początku do końca, a nie dema katalogu:
każda mutacja przechodzi przez Server Action, autoryzacja jest egzekwowana tam, gdzie nie
da się jej obejść, a proces płatności rezerwuje towar przed obciążeniem karty.

### 🛡️ Kluczowe aspekty techniczne

- **Next.js 16 App Router i React 19** — domyślnie Server Components, Server Actions do
  każdej mutacji, nigdzie `getServerSideProps`.
- **Auth.js v5** — kontrola dostępu oparta na rolach, sesje JWT w ciasteczkach HttpOnly.
  Callback `jwt` odczytuje użytkownika przy każdym wywołaniu, więc zmiana roli i usunięcie
  konta działają natychmiast.
- **Prisma + PostgreSQL** — 15 modeli obejmujących użytkowników, katalog, zamówienia
  i promocje, z rezerwacją stanu magazynowego wewnątrz transakcji.
- **Walidacja Zod** — formularze autoryzacji oraz, od czasu `lib/env.ts`, samo środowisko:
  brakujący lub zniekształcony klucz zatrzymuje aplikację przy starcie, zamiast objawiać
  się jako `undefined` w środku żądania.
- **Zustand** — stan koszyka odseparowany od UI, utrwalany w `localStorage` i uzgadniany
  z bazą przed zakupem.

---

## ✨ Funkcjonalności

### 🛒 Sklep

- **Katalog** — zagnieżdżone kategorie, atrybuty składników i statusów, doczytywanie
  porcjami.
- **Koszyk** — trwały między sesjami, synchronizowany z aktualnymi cenami i stanem
  magazynowym.
- **Zakup** — Stripe Checkout z rezerwacją towaru z góry i możliwością dokończenia
  przerwanej płatności z poziomu historii zamówień.
- **Konto** — pulpit, historia zamówień, zapisany adres dostawy oraz system opinii
  „Voices" z CRUD-em na własnych wpisach.

### 🛡️ Panel administratora

- **Asortyment** — CRUD produktów z uploadem wielu zdjęć, filtrowanie po frazie,
  kategorii i stanie magazynowym.
- **Zamówienia** — przeszukiwalna, stronicowana lista z możliwością zmiany statusu.
- **Kategorie i składniki** — drzewo kategorii i „esencje" produktów.
- **Moderacja** — usuwanie opinii.
- **Media** — wgrywane pliki konwertowane do WebP i skalowane przez Sharp.

---

## 🛠 Stos technologiczny

| Warstwa        | Technologia                                          |
| :------------- | :--------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router), React 19, TypeScript 5       |
| **Baza**       | PostgreSQL, Prisma ORM                                |
| **Autoryzacja**| Auth.js v5, bcrypt, kontrola tras w proxy.ts        |
| **Płatności**  | Stripe (Checkout i webhooki)                          |
| **E-mail**     | Nodemailer (SMTP), szablony React Email               |
| **Stylowanie** | Tailwind CSS v4, shadcn/ui, Radix UI, tw-animate-css  |
| **Stan**       | Zustand                                               |
| **Walidacja**  | Zod                                                   |

---

## 📂 Dokumentacja

1. [**Architektura i routing**](./docs/pl/routing.md) — grupy tras, domeny Server Actions
   i miejsce, w którym autoryzacja jest faktycznie egzekwowana.
2. [**Instrukcja konfiguracji**](./docs/pl/setup.md) — instalacja, zmienne środowiskowe,
   seed bazy, przekierowanie webhooków Stripe.
3. [**Funkcjonalności i logika**](./docs/pl/features.md) — przepływ zakupu, system opinii,
   model bezpieczeństwa i lista znanych ograniczeń.
4. [**Środowisko**](./docs/pl/environment.md) — wszystkie zmienne czytane przez aplikację.
5. [**Wdrożenie**](./docs/pl/deployment.md) — uruchomienie dema przez Docker Compose.
6. [**Kopie zapasowe i odtwarzanie**](./docs/pl/backups.md) — kopia i odtwarzanie bazy oraz wgranych plików.

---

## ⚙️ Szybki start

```bash
git clone https://github.com/pwrobel03/daydream-ecommerce-website.git
cd daydream-ecommerce-website
npm install

cp .env.example .env      # następnie uzupełnij wartości

npx prisma generate
npx prisma migrate deploy
npx tsx --env-file=.env prisma/seed.ts  # opcjonalne, ale bez tego sklep jest pusty

npm run dev
```

Pełny opis zmiennych środowiskowych i lokalnego przekierowania webhooków Stripe znajduje
się w [instrukcji konfiguracji](./docs/pl/setup.md).

---

## 🐳 Uruchomienie przez Dockera

Najszybszy sposób, żeby zobaczyć działający sklep z gotowym katalogiem:

```bash
cp .env.docker.example .env.docker      # do pierwszego spojrzenia wystarczą wartości domyślne
docker compose --env-file .env.docker up
```

Podnosi to PostgreSQL, Redis i aplikację. Przy pierwszym starcie kontener wykonuje
migracje i wypełnia katalog danymi; przy kolejnych wykrywa istniejące dane i ich nie
rusza. Otwórz [http://localhost:3000](http://localhost:3000).

### Konta demonstracyjne

Utworzone przez seed, z potwierdzonym adresem e-mail:

| Rola       | E-mail                   | Hasło             |
| :--------- | :----------------------- | :---------------- |
| Demo admin | `demo-admin@example.com` | `demo-admin-2026` |

Demo administrator jest tylko do odczytu: przegląda panel (`/dashboard/inventory`), ale
każdy zapis zostaje odrzucony. Strona logowania ma przycisk „Zaloguj jako demo
administrator”. Przykładowi klienci, do których należą zamówienia z seeda, mają losowe
hasła, których nikt nie zna; do zakupów załóż własne konto. Seed nie tworzy admina z
pełnymi prawami: prywatnego admina tworzy skrypt przy wdrożeniu.

### Co działa bez prawdziwych kluczy API

Wartości zastępcze z `.env.docker.example` wystarczają do katalogu, koszyka, opinii
i całego panelu administratora. Dwie rzeczy wymagają prawdziwych danych:

- **Stripe** — zakup dochodzi do kroku płatności i tam się zatrzymuje. Uzupełnij
  `STRIPE_SECRET_KEY` i `STRIPE_WEBHOOK_SECRET`, żeby przejść dalej.
Poczta **działa od razu** — compose podnosi Mailpit, lokalny serwer SMTP.
Wysłane wiadomości obejrzysz pod [http://localhost:8025](http://localhost:8025),
łącznie z linkiem weryfikacyjnym z rejestracji.

### Stan zdrowia i zatrzymanie

```bash
curl localhost:3000/api/health          # sprawdza bazę i Redisa
docker compose --env-file .env.docker down       # zatrzymaj, zachowaj dane
docker compose --env-file .env.docker down -v    # zatrzymaj i wyczyść wolumeny
```

`--env-file` nie jest opcjonalne: bez niego Compose sięga po deweloperski `.env`
do podstawiania zmiennych i wykłada się na znakach `$` w sekretach.

### Wariant produkcyjny

`docker-compose.prod.yml` dokłada nginx z TLS, certbota i zadanie zwalniające
rezerwacje, a także przestaje wystawiać port aplikacji na zewnątrz:

```bash
docker compose --env-file .env.docker \
  -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Pełne kroki (budowa obrazów, `.env.docker`, migracje, prywatny admin, reverse proxy
i Cloudflare, konta zewnętrzne, aktualizacja) opisuje
[instrukcja wdrożenia](docs/pl/deployment.md) ([English](docs/en/deployment.md)).

---

## 🚧 Status projektu

Aplikacja jest kompletna funkcjonalnie. Ścieżka płatności została sprawdzona ze Stripe
w trybie testowym: ceny i rabaty pochodzą z bazy, rezerwacje towaru wygasają, a webhooki
są idempotentne i weryfikują zapłaconą kwotę. Stripe działa wyłącznie w trybie testowym
(klucz live zatrzymuje aplikację przy starcie) i nie przechodzą prawdziwe pieniądze: płać
kartą testową `4242 4242 4242 4242`, dowolna przyszła data ważności, dowolny CVC. Opłacone
zamówienia testowe oddają towar na stan. Upload obrazów trafia na lokalny system plików,
więc aplikacja nie działa jeszcze na hostingu serverless.

Co zostało, opisują [znane ograniczenia](./docs/pl/features.md#-znane-ograniczenia).
