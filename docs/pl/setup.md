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

Każda zmienna, jej format, przykład, wartość domyślna i źródło wartości są w
[opisie zmiennych środowiskowych](./environment.md). Klucze Stripe muszą być testowe, a `AUTH_URL`
i `NEXT_PUBLIC_APP_URL` muszą zgadzać się z publicznym adresem; opis podaje te zasady.

---

## 🗄️ Baza danych

Projekt korzysta z **Prisma ORM**.

1. **Wygeneruj klienta:**

   ```bash
   npx prisma generate
   ```

2. **Zastosuj migracje:**

   ```bash
   npx prisma migrate deploy
   ```

3. **Seed:**
   Tworzy kategorie, statusy, składniki, produkty, użytkowników, opinie i przykładowe
   zamówienia. Zalecane — bez tego sklep renderuje się pusty.

   ```bash
   npx tsx --env-file=.env prisma/seed.ts
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

Żeby zalogować się jako administrator, utwórz prywatnego admina skryptem — nie ma
mechanizmu samodzielnego nadania uprawnień. Skrypt czyta hasło (min. 12 znaków) ze
standardowego wejścia; ponowne uruchomienie dla tego samego e-maila resetuje hasło:

```bash
printf '%s\n' 'haslo-min-12-znakow' | npx tsx --env-file=.env scripts/create-admin.ts ty@example.com "Twoje Imię"
```

Przy wdrożeniu w Dockerze użyj `scripts/create-admin.sh <email> [imię]`; patrz
[instrukcja wdrożenia](./deployment.md).

---

## 🛠️ Rozwiązywanie problemów

- **Aplikacja kończy się przy starcie listą zmiennych środowiskowych** — to `lib/env.ts`
  robi swoją robotę. Komunikat wskazuje każdy problematyczny klucz.
- **Zmiany w schemacie nie są widoczne** — uruchom `npx prisma migrate deploy`,
  a potem `npx prisma generate`.
- **Błędy typów tras po usunięciu strony** — usuń katalog `.next` i powtórz sprawdzanie
  typów.

## 🧪 Testy end-to-end na innych portach

`npm run test:e2e` używa aplikacji na 3100, PostgreSQL na 55432, Redisa na 56379 i Mailpita na 51025 (SMTP) / 58025 (UI).
Żeby uruchomić testy na innym wolnym zestawie portów, np. w drugiej kopii repozytorium, ustaw jedną zmienną:

```bash
E2E_PORT_BASE=3200 npm run test:e2e
```

Aplikacja dostaje port bazowy, PostgreSQL bazowy + 1, Redis bazowy + 2, SMTP bazowy + 3, a interfejs Mailpita bazowy + 4.
Bez `E2E_PORT_BASE` porty zostają takie, jak wyżej. Test maili (`tests/e2e/email.spec.ts`) nadal oczekuje domyślnego portu Mailpita, więc uruchamiaj go bez tej zmiennej.

## 📸 Zrzuty ekranu w pull requestach

Pull request zmieniający UI dostaje jeden komentarz ze zrzutami przed/po
(`.github/workflows/screenshots.yml`). Workflow buduje i seeduje tak samo gałąź PR i gałąź bazową
(`tests/e2e/seed.ts`), robi zrzuty każdej strony w rozmiarach 1440×900 i 390×844, po angielsku, w motywie jasnym i ciemnym
(pliki `<name>-<desktop|mobile>-<light|dark>.png`; zrzut sprawdza, że klasa `dark` jest ustawiona),
i porównuje je piksel po pikselu. To informacja dla recenzenta, nie bramka.

Aby dodać stronę, dopisz wpis do `tests/screenshots/routes.ts`:

```ts
{ name: "privacy", path: "/privacy" },
{ name: "admin-inventory", path: "/dashboard/inventory", admin: true, mask: ["time"] },
```

- `name` to nazwa pliku i etykieta w komentarzu.
- `path` otwiera się po angielsku; dane z seeda muszą zawierać to, co strona pokazuje.
- `admin: true` robi zrzut jako zaseedowany demo admin.
- `mask` to selektory CSS zamalowywane przed zrzutem: użyj go dla dat i generowanych ID, żeby dwa
  przebiegi na tym samym commicie dawały identyczne pliki.

Lokalnie, na działającej i zaseedowanej aplikacji:
`SCREENSHOT_BASE_URL=http://localhost:3100 npm run screenshots` (pliki trafiają do `screenshots-out/`
albo do `SCREENSHOT_DIR`).
