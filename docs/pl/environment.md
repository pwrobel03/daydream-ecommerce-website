# Opis zmiennych środowiskowych

Każda zmienna czytana przez aplikację, migrator, pliki compose i cron. Wersja angielska:
[`docs/en/environment.md`](../en/environment.md).

`lib/env.ts` waliduje zmienne aplikacji przy imporcie i zatrzymuje proces z komunikatem wskazującym
każdy błędny klucz. Wzory: [`.env.example`](../../.env.example) (development, kopiowany do `.env`)
i [`.env.docker.example`](../../.env.docker.example) (Docker, kopiowany do `.env.docker`).

Kolumna **Kiedy** mówi, kiedy wartość jest czytana. *Runtime* oznacza odczyt przy starcie kontenera
lub serwera deweloperskiego; wartość można zmienić bez przebudowy obrazu. *Build* oznacza odczyt przez
`next build` i `prisma generate`; `Dockerfile` ustawia tam wartości zastępcze, żeby build przeszedł,
i nigdy nie są używane w runtime.

## Zasady

- **Tylko testowe klucze Stripe.** `STRIPE_SECRET_KEY` musi zaczynać się od `sk_test_` lub `rk_test_`.
  Każda wartość zaczynająca się od `sk_live_`, `rk_live_` lub `pk_live_`, w *dowolnej* zmiennej,
  zatrzymuje aplikację przy starcie; komunikat podaje nazwę zmiennej, nigdy wartość (ADR 0005).
- **Testowe klucze Cloudflare w lokalnym developmencie.** Para Turnstile z wzorów
  (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) zawsze przechodzi. Klucze
  widżetu z panelu Cloudflare stosuj tylko na publicznym wdrożeniu.
- **`AUTH_URL` i `NEXT_PUBLIC_APP_URL` muszą zgadzać się z publicznym adresem** aplikacji: ten sam
  schemat, host i port (`http://localhost:3100` przy `PORT=3100`). Rozbieżność psuje callbacki logowania,
  przekierowania Stripe i linki w mailach.
- **OAuth jest opcjonalny, ale para jest kompletna albo wcale.** Ustaw `_ID` i `_SECRET` dostawcy
  albo żadne z nich; jedno bez drugiego zatrzymuje aplikację.

## Aplikacja

| Zmienna | Wymagana | Format | Przykład | Domyślnie | Skąd wartość | Kiedy |
| --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | tak | URL PostgreSQL | `postgresql://user:password@localhost:5432/daydream` | brak | Twoja instancja PostgreSQL. Compose ustawia ją dla `app` i `migrate`. | runtime; build (wartość zastępcza, potrzebna `prisma generate`) |
| `REDIS_URL` | tak | URL | `redis://localhost:6379` | brak | Twoja instancja Redis. Compose ustawia usługę `redis`. | runtime |
| `AUTH_SECRET` | tak | niepusty ciąg | `k3J…` (32 losowe bajty, base64) | brak | Wygeneruj: `npx auth secret`. | runtime |
| `AUTH_URL` | w praktyce tak | URL | `http://localhost:3000` | brak | Publiczny adres aplikacji. Czyta go Auth.js, nie `lib/env.ts`. Zobacz zasady. | runtime |
| `AUTH_TRUST_HOST` | za proxy | `true` | `true` | brak | Ustaw `true` w Dockerze, za nginx i na każdym hoście innym niż localhost. Czyta Auth.js. | runtime |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | opcjonalne, parą | niepuste ciągi | `123-abc.apps.googleusercontent.com` | brak | Google Cloud Console → APIs & Services → Credentials → OAuth client ID. | runtime |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | opcjonalne, parą | niepuste ciągi | `Iv1.abc123` | brak | GitHub → Settings → Developer settings → OAuth Apps. | runtime |
| `STRIPE_SECRET_KEY` | tak | `sk_test_…` lub `rk_test_…` | `sk_test_51Abc…` | brak | Panel testowy Stripe → Developers → API keys → secret key. | runtime; build (wartość zastępcza) |
| `STRIPE_WEBHOOK_SECRET` | tak | `whsec_…` | `whsec_abc123…` | brak | Lokalnie wypisuje go `stripe listen --forward-to localhost:3000/api/webhook/stripe`. Na wdrożeniu: panel testowy Stripe → Developers → Webhooks → endpoint → signing secret. | runtime; build (wartość zastępcza) |
| `SMTP_HOST` | tak | nazwa hosta | `localhost` | brak | Twój serwer SMTP; w demo Mailpit. Compose ustawia `mailpit`. | runtime |
| `SMTP_PORT` | nie | dodatnia liczba całkowita | `1025` | `1025` | Twój serwer SMTP. Compose ustawia `1025`. | runtime |
| `SMTP_SECURE` | nie | `true` lub `false` | `false` | `false` | `true` dla TLS od początku połączenia (zwykle port 465). | runtime |
| `SMTP_USER`, `SMTP_PASSWORD` | nie | ciągi znaków | `apikey` | puste | Twój dostawca SMTP. Dla Mailpita zostaw puste. | runtime |
| `MAIL_FROM` | tak | adres e-mail, opcjonalnie z nazwą | `Daydream <hello@daydream.local>` | brak | Adres, z którego pozwala wysyłać Twój dostawca SMTP. | runtime |
| `MAIL_DAILY_LIMIT` | nie | dodatnia liczba całkowita | `50` | `50` | Twoja decyzja. Twardy limit maili na dobę (ADR 0012). | runtime |
| `MAIL_HOURLY_LIMIT_PER_ADDRESS` | nie | dodatnia liczba całkowita | `3` | `3` | Twoja decyzja. Limit na odbiorcę na godzinę. | runtime |
| `MAIL_HOURLY_LIMIT_PER_IP` | nie | dodatnia liczba całkowita | `3` | `3` | Twoja decyzja. Limit na IP klienta na godzinę. | runtime |
| `UPLOAD_DIR` | tak | ścieżka poza `public/` | `./storage/uploads` | brak | Katalog montowany jako wolumen. Compose ustawia `/data/uploads`. | runtime; build (wartość zastępcza) |
| `CRON_SECRET` | tak | ciąg, min. 16 znaków | `change_me_to_a_long_random_string` | brak | Wygeneruj, np. `openssl rand -base64 32`. Usługa `cron` wysyła go jako token bearer. | runtime |
| `TURNSTILE_SITE_KEY` | tak | niepusty ciąg | `1x00000000000000000000AA` | brak | Panel Cloudflare → Turnstile → widżet → site key. Lokalnie użyj klucza testowego. | runtime |
| `TURNSTILE_SECRET_KEY` | tak | niepusty ciąg | `1x0000000000000000000000000000000AA` | brak | Panel Cloudflare → Turnstile → widżet → secret key. Lokalnie użyj klucza testowego. | runtime |
| `PRIVACY_CONTROLLER_NAME` | tak | niepusty ciąg | `Jan Kowalski` | brak | Administrator danych, czyli właściciel wdrożenia. Widoczny na `/privacy`. | runtime |
| `PRIVACY_CONTACT_EMAIL` | tak | adres e-mail | `privacy@example.com` | brak | Skrzynka, którą czyta właściciel. Widoczna na `/privacy`. | runtime |
| `PRIVACY_EMAIL_PROVIDER` | tak | niepusty ciąg | `Example SMTP Provider` | brak | Nazwa dostawcy SMTP, który wysyła pocztę. Widoczna na `/privacy`. | runtime |
| `NEXT_PUBLIC_APP_URL` | tak | URL | `http://localhost:3000` | brak | Publiczny adres aplikacji. Używany w przekierowaniach Stripe, mapie witryny i linkach w mailach. Zobacz zasady. | runtime; build (wartość zastępcza) |
| `NODE_ENV` | nie | `development`, `test` lub `production` | `production` | `development` | Ustawia `next dev`, `next build` i `Dockerfile` (`production`). Nie ustawiaj ręcznie. | runtime |

## Docker i compose

| Zmienna | Używana przez | Wymagana | Format | Przykład | Domyślnie | Skąd wartość | Kiedy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `RUN_SEED` | `migrate` (`docker/migrate.sh`) | nie | `true` lub `false` | `true` | brak (bez seeda) | `.env.docker`. `true` ładuje katalog demonstracyjny, gdy katalog produktów jest pusty. Nakładka produkcyjna ustawia `false` dla `app`. | runtime |
| `DOMAIN` | `nginx` w `docker-compose.prod.yml` | tylko produkcja | nazwa hosta | `daydream.example.com` | brak | Publiczna domena wskazująca na serwer. Compose przerywa pracę, gdy jej brak. | runtime |
| `CRON_SECRET` | `cron` w `docker-compose.prod.yml` | tylko produkcja | jak wyżej | | brak | Musi być równy `CRON_SECRET` aplikacji; czytany z `.env.docker`. | runtime |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `postgres` | ustawione w plikach compose | ciągi znaków | `daydream` | `daydream` | Wpisane w `docker-compose.yml` (baza `daydream_e2e` w `docker-compose.test.yml`). Muszą zgadzać się z `DATABASE_URL`. | runtime |
| `PORT`, `HOSTNAME` | etap runtime w `Dockerfile` | ustawione w obrazie | `3000`, `0.0.0.0` | | `3000`, `0.0.0.0` | Na stałe w obrazie. Inny port hosta opublikuj przez `ports:`. W developmencie: `PORT=<port> npm run dev`. | runtime |
| `NEXT_TELEMETRY_DISABLED` | `Dockerfile` | ustawione w obrazie | `1` | | `1` | Na stałe w obrazie. | build i runtime |

Compose nie czyta żadnej zmiennej `${…}` poza `DOMAIN` i `CRON_SECRET` w nakładce produkcyjnej;
uruchamiaj go z `--env-file .env.docker`. Bazowy `docker-compose.yml` przekazuje plik do `app` i `migrate`
przez `env_file`.

## Ustawiane przez narzędzia, nie przez Ciebie

- `NEXT_RUNTIME` ustawia Next.js; czyta go `instrumentation.ts`.
- `CI` ustawia usługa CI; Playwright używa jej do ponowień i wyboru reportera.
- Przebieg E2E (`scripts/e2e.sh`, `playwright.config.ts`) ustawia własne wartości `AUTH_URL`,
  `AUTH_TRUST_HOST`, `NEXT_PUBLIC_APP_URL` oraz porty bazy, Redisa i SMTP z `docker-compose.test.yml`.
- `scripts/create-admin.*`, `scripts/demo-reset.*` i `scripts/migrate-uploads.ts` czytają `DATABASE_URL`
  i `UPLOAD_DIR` ze środowiska, w którym działają.
