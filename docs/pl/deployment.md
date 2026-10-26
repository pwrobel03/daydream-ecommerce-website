# Instrukcja wdrożenia

Jak właściciel i administrator serwera wdrażają i utrzymują demo przez Docker Compose
([ADR 0007](../adr/0007-deployment-from-a-docker-image.md)). Wersja angielska:
[`docs/en/deployment.md`](../en/deployment.md). Każda zmienna jest opisana w
[opisie zmiennych środowiskowych](environment.md). Kopie zapasowe i odtwarzanie opisuje osobny
dokument: [`backups.md`](backups.md) (ADR 0014).

Obrazy buduje się na serwerze (albo na komputerze właściciela); nic nie trafia do rejestru. Całość to
`docker-compose.yml` z nakładką produkcyjną `docker-compose.prod.yml`: PostgreSQL, Redis, migrator,
aplikacja, nginx z certbotem i cron zwalniający rezerwacje. Mailpit nie należy do produkcji.

Wszystkie polecenia uruchamiasz w katalogu repozytorium na serwerze. Każde wywołanie `docker compose`
poniżej zaczyna się od tego prefiksu; możesz zrobić z niego alias albo zmienną:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml
```

`--env-file` jest wymagane: bez niego Compose czyta deweloperski `.env` i wykłada się na znakach `$`
w jego sekretach.

## 1. Wymagania

- Serwer z Linuksem, Docker Engine i wtyczka Compose (v2.24.4 lub nowsza, ze względu na tag `!reset`
  w nakładce) oraz `git`.
- Publiczna domena, której rekord DNS `A`/`AAAA` wskazuje na serwer, i otwarte porty 80 i 443.
- Konta z [kroku 11](#11-konta-zewnętrzne): Stripe (tryb testowy), Cloudflare Turnstile i dostawca SMTP.
  OAuth GitHub i Google jest opcjonalny.
- Około 2 GB wolnej pamięci RAM na build i 5 GB dysku.

## 2. Pobierz kod i zbuduj obrazy

```bash
git clone https://github.com/pwrobel03/daydream-ecommerce-website.git
cd daydream-ecommerce-website
```

`NEXT_PUBLIC_APP_URL` trafia do wyniku buildu (mapa strony, `robots.txt`, metadane stron). Uzupełnij
`.env.docker` (krok 3) **przed** buildem, prawdziwym publicznym adresem, a potem:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml build
```

Polecenie buduje obraz `app` i obraz `migrator` z `Dockerfile`. Zmiana `NEXT_PUBLIC_APP_URL` wymaga
ponownego buildu.

## 3. Uzupełnij `.env.docker`

```bash
cp .env.docker.example .env.docker
chmod 600 .env.docker
```

Ustaw każdą wartość według [opisu zmiennych środowiskowych](environment.md). Na produkcji:

| Zmienna | Wartość |
| --- | --- |
| `AUTH_SECRET` | `npx auth secret` albo `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL`, `NEXT_PUBLIC_APP_URL` | `https://<domena>`, ta sama wartość w obu |
| `AUTH_TRUST_HOST` | `true` |
| `DOMAIN` | `<domena>`, bez schematu |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **testowe** klucze Stripe (krok 11); klucz live zatrzymuje aplikację |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | twój dostawca SMTP (krok 11) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | twój widżet Turnstile, nie testowe klucze, które zawsze przechodzą |
| `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`, `PRIVACY_EMAIL_PROVIDER` | dane właściciela, pokazywane na `/privacy` |
| `RUN_SEED` | `true` tylko przy pierwszym starcie (krok 6), potem `false` |

Nakładka nie ustawia `SMTP_HOST` ani `SMTP_PORT`, więc aplikacja bierze wartości z `.env.docker`
(plik bazowy kieruje je na Mailpita). Nie commituj `.env.docker`.

## 4. TLS i reverse proxy

Wejściem jest nginx: w produkcji aplikacja nie publikuje portu. Dołączona konfiguracja
`docker/nginx/daydream.conf` przekierowuje HTTP na HTTPS i zostawia `/.well-known/acme-challenge/`
na HTTP dla certbota.

**Proxy musi ustawiać `X-Real-IP` na adres klienta, nadpisując wszystko, co klient wysłał.** Aplikacja
czyta adres klienta wyłącznie z tego nagłówka, dla każdego limitu per IP (logowanie, rejestracja,
poczta). Dołączona konfiguracja robi to przez `proxy_set_header X-Real-IP $remote_addr;`. Bez tego
każde żądanie ma IP `unknown` i wszyscy odwiedzający dzielą jeden limit.

Wystaw pierwszy certyfikat, zanim uruchomisz nginx — bez niego nginx nie wystartuje. Port 80 musi być
wolny, więc zrób to przed krokiem 5:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml \
  run --rm --entrypoint certbot -p 80:80 certbot certonly --standalone -d <domena>
```

Usługa `certbot` odnawia potem certyfikat co 12 godzin przez webroot. Odnowienie wymaga działającej
usługi `nginx` (krok 5).

**Zastąpienie nginx i certbota** (inne proxy, panel hostingu, load balancer) to decyzja
administratora. Usuń usługi `nginx` i `certbot` i opublikuj aplikację sam, a zamiennik ma:

- kończyć TLS i przekazywać ruch do `app:3000`;
- nadpisywać `X-Real-IP` adresem klienta, nigdy nie przepuszczać wartości od klienta;
- wysyłać `Host` i `X-Forwarded-Proto` (Auth.js buduje z nich adresy zwrotne);
- przyjmować ciała żądań do 50 MB (`client_max_body_size 50m`, zgodnie z `serverActions.bodySizeLimit`).

### Za Cloudflare (domena z proxy)

Jeśli domena idzie przez proxy Cloudflare (pomarańczowa chmurka), `$remote_addr` jest adresem
brzegowym Cloudflare, więc wszyscy odwiedzający dzieliliby jeden limit per IP. Proxy musi brać adres
klienta z nagłówka `CF-Connecting-IP`, ale tylko z zakresów Cloudflare.

Dla dołączonego nginx podmontuj `docker/nginx/cloudflare-real-ip.conf` (`real_ip_header
CF-Connecting-IP` i `set_real_ip_from` dla każdego zakresu Cloudflare). Dodaj plik
`docker-compose.cloudflare.yml`:

```yaml
services:
  nginx:
    volumes:
      - ./docker/nginx/cloudflare-real-ip.conf:/etc/nginx/conf.d/cloudflare-real-ip.conf:ro
```

i od teraz dopisuj ten plik do prefiksu **każdego** kolejnego polecenia, także `build` i `up -d` w kroku 13:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.cloudflare.yml
```

Możesz też ustawić `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml:docker-compose.cloudflare.yml` w profilu powłoki. Jeśli późniejsze `up -d` pominie ten plik, nginx zostanie odtworzony bez zamontowanego pliku i wszyscy odwiedzający dostaną jeden adres i jeden limit. `scripts/create-admin.sh` i `scripts/demo-reset.sh` dotykają tylko `migrate` i `postgres`, więc go nie potrzebują. `daydream.conf` nadal ustawia
`X-Real-IP` z `$remote_addr`, które nginx podmienia teraz na prawdziwego klienta. Porównaj zakresy
w pliku z <https://www.cloudflare.com/ips/> przy wdrożeniu i co jakiś czas potem. W innym proxy bierz
adres z `CF-Connecting-IP` tak samo i ufaj mu tylko od Cloudflare.

Sprawdź po pierwszym żądaniu przez Cloudflare: próby logowania z dwóch różnych sieci nie mogą dzielić
licznika. Jeśli aplikacja widzi `unknown` albo ten sam adres dla wszystkich, `X-Real-IP` jest ustawiony
źle.

## 5. Uruchom stos

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml ps
```

Kolejność startu: PostgreSQL i Redis stają się zdrowe, `migrate` działa raz i kończy się (krok 6),
potem startują `app`, `cron`, `nginx` i `certbot`. Mailpit jest za profilem `local` i nie startuje.

## 6. Migracje i pierwszy seed

Usługa `migrate` uruchamia `prisma migrate deploy` przy każdym `up`, przed startem aplikacji. Gdy się
nie powiedzie, aplikacja nie wystartuje; przyczynę zobaczysz tak:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs migrate
```

**Pierwszy seed.** Przy `RUN_SEED=true` w `.env.docker` `migrate` ładuje katalog demonstracyjny, gdy
katalog produktów jest pusty, a w przeciwnym razie go pomija. Zostaw `true` tylko na pierwszy start,
potem ustaw `RUN_SEED=false` w `.env.docker`. Seed tworzy demo admina (`demo-admin@example.com`, tylko
do odczytu) i przykładowych klientów; nie tworzy admina z pełnymi prawami.

**Przed wdrożeniem nowych migracji** (każda aktualizacja, która dodaje katalog w `prisma/migrations/`)
zrób dump:

```bash
mkdir -p backups && chmod 700 backups
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > backups/pre-upgrade-$(date -u +%Y%m%dT%H%M%SZ).dump
```

Dump zawiera dane osobowe. Traktuj go jak każdą kopię zapasową (7 dni, ADR 0014).

## 7. Utwórz prywatnego admina

Seed nie tworzy admina z pełnymi prawami. Utwórz własnego jednorazowo, w terminalu na serwerze:

```bash
scripts/create-admin.sh owner@example.com "Owner"
```

Skrypt pyta o hasło dwa razy i **nie wypisuje go na ekran**:

```text
Password for owner@example.com:
Repeat the password:
```

Hasło musi mieć co najmniej 12 znaków. Trafia na standardowe wejście kontenera migratora: nigdy nie
jest argumentem, zmienną środowiskową, wpisem w historii powłoki ani plikiem. Ponowne uruchomienie dla
tego samego e-maila resetuje hasło. Nic innego w aplikacji nie tworzy ani nie awansuje admina,
a reset dema zachowuje użytkowników `ADMIN`.

## 8. Cron rezerwacji i sprzątanie niezweryfikowanych kont

Usługa `cron` co 5 minut wywołuje `POST /api/cron/release-reservations` z nagłówkiem
`Authorization: Bearer $CRON_SECRET`. Każde uruchomienie:

- zwalnia towar zatrzymany przez zamówienia, które nie doszły do płatności i których rezerwacja wygasła;
- usuwa rejestracje, których adres e-mail nie został zweryfikowany, 24 godziny po utworzeniu (konta
  z zamówieniami, opiniami, powiązaniem OAuth albo adresem zostają). To obiecuje informacja o prywatności.

Sprawdzenie i ręczne uruchomienie:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs --tail 20 cron
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec cron \
  sh -c 'curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://app:3000/api/cron/release-reservations'
```

`401` oznacza, że `CRON_SECRET` różni się w `cron` i `app`; oba czytają go z `.env.docker`, więc po
zmianie utwórz oba kontenery od nowa.

## 9. Kontrola zdrowia

```bash
curl -fsS https://<domena>/api/health
```

`200` z `{"status":"ok","database":true,"redis":true}` znaczy, że aplikacja widzi PostgreSQL i Redisa.
`503` ze `"status":"degraded"` wskazuje zależność, która zawiodła; szczegóły są w logu aplikacji.
Skieruj na ten adres monitoring dostępności.

## 10. Reset dema

Właściciel resetuje demo ręcznie, w terminalu na serwerze (ADR 0010):

```bash
scripts/demo-reset.sh
```

Skrypt pokazuje, co usunie (konta, zamówienia, pliki), zapisuje `backups/pre-reset-<znacznik>.dump`
i obok archiwum plików wgranych, po czym czeka, aż wpiszesz `RESET`. Każda inna odpowiedź przerywa
bez usuwania czegokolwiek. Skrypt odmawia pracy bez terminala i nie ma opcji pomijającej potwierdzenie,
więc nie da się go zaplanować w cronie. Potem sklep wraca do stanu z seeda; użytkownicy `ADMIN`
zostają, a sesje odwiedzających się kończą. Dump sprzed resetu zawiera dane osobowe; usuń go po 7 dniach
jak każdą kopię zapasową.

## 11. Konta zewnętrzne

Załóż je samodzielnie; należą do właściciela. Wartości wpisz do `.env.docker`, potem utwórz aplikację
od nowa (`up -d`).

**Stripe (tylko tryb testowy).** Załóż konto Stripe i zostań w trybie testowym.

1. Developers → API keys: klucz tajny (`sk_test_…`) to `STRIPE_SECRET_KEY`.
2. Developers → Webhooks → dodaj endpoint `https://<domena>/api/webhook/stripe` ze zdarzeniami
   `checkout.session.completed`, `checkout.session.expired` i `payment_intent.payment_failed`
   (te obsługuje handler; pozostałe są potwierdzane i ignorowane).
3. Skopiuj sekret podpisu endpointu (`whsec_…`) do `STRIPE_WEBHOOK_SECRET`.

**Cloudflare Turnstile.** Panel Cloudflare → Turnstile → dodaj widżet dla `<domena>`. Klucz witryny to
`TURNSTILE_SITE_KEY`, klucz tajny to `TURNSTILE_SECRET_KEY`. Nie wdrażaj testowych kluczy, które zawsze
przechodzą.

**Dostawca SMTP.** Dowolny dostawca z SMTP. Uzupełnij `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true`
dla portu 465), `SMTP_USER`, `SMTP_PASSWORD` oraz adres `MAIL_FROM` w domenie zweryfikowanej u dostawcy.
Dodaj rekordy DNS **SPF** i **DKIM** dostawcy dla domeny nadawcy, inaczej maile weryfikacyjne i resetu
hasła trafią do spamu. Nazwa dostawcy idzie do `PRIVACY_EMAIL_PROVIDER`. Aplikacja ogranicza wysyłkę
(`MAIL_DAILY_LIMIT`, domyślnie 50 dziennie).

**Logowanie przez GitHub i Google (opcjonalnie).** Bez nich demo działa i nie ma przycisków OAuth.
Ustaw ID i sekret dostawcy razem albo wcale.

- GitHub: Settings → Developer settings → OAuth Apps. Callback URL
  `https://<domena>/api/auth/callback/github` → `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- Google: Cloud Console → APIs & Services → Credentials → OAuth client ID (aplikacja webowa).
  Authorised redirect URI `https://<domena>/api/auth/callback/google` → `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`.

Dodanie dostawcy oznacza dopisanie go do podmiotów wymienionych na `/privacy` (ADR 0013).

**Dane do informacji o prywatności.** Ustaw `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`
i `PRIVACY_EMAIL_PROVIDER`. Bez nich aplikacja nie wystartuje. Przeczytaj `/privacy` w obu językach,
zanim demo stanie się publiczne.

## 12. Logi

Informacja o prywatności mówi, że logi są przechowywane tak długo, jak ustawi administrator, a instrukcja
zaleca **najwyżej 14 dni**. Logi zawierają adresy IP (nginx) i adresy odbiorców nieudanych maili
(aplikacja). Ustaw to jednorazowo:

- Logi kontenerów Dockera: sterownik logów `journald` (`"log-driver": "journald"` w
  `/etc/docker/daemon.json`) i `MaxRetentionSec=14day` w `/etc/systemd/journald.conf`; albo sterownik
  `local` z `max-size` i `max-file` na tyle małymi, że obejmują mniej niż 14 dni.
- Każdy plik logu, który zapisujesz sam, np. log nginx poza Dockerem: `logrotate` z `daily`
  i `rotate 14`.

## 13. Aktualizacja do nowej wersji

```bash
git pull --ff-only
# Przejrzyj zmiany w .env.docker.example; dopisz nowe zmienne do .env.docker.
# Zrób dump przed aktualizacją (krok 6), jeśli zmienił się prisma/migrations/.
# Za Cloudflare dopisz -f docker-compose.cloudflare.yml (krok 4) do obu poniższych poleceń.
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml build
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d
curl -fsS https://<domena>/api/health
```

`up -d` uruchamia najpierw migrator i odtwarza tylko usługi, których obraz albo konfiguracja się
zmieniły. Jeśli aplikacja nie wstaje, zajrzyj do `logs migrate` i `logs app`. Aby wrócić, przełącz się
na poprzedni tag lub commit i zbuduj ponownie; migracje nie cofają się same, więc przy zmianie schematu
odtwórz dump sprzed aktualizacji.
