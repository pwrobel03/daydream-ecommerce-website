# Kopie zapasowe i odtwarzanie

Jak administrator serwera robi kopie zapasowe demo i je odtwarza
([ADR 0014](../adr/0014-backups.md)). Wersja angielska: [`docs/en/backups.md`](../en/backups.md).
Dokument uzupełnia [instrukcję wdrożenia](deployment.md); prefiks `docker compose` jest ten sam, co
tam. Polecenia są opisane, nie dostarczone jako usługi: konfigurujesz je i uruchamiasz sam.

Co jest kopiowane i jak długo:

| Co | Jak | Przechowywanie |
| --- | --- | --- |
| Baza danych | codziennie `pg_dump -Fc` | 7 dni |
| Wolumen z uploadami | codziennie `tar` | 7 dni |
| Najnowszy dump i archiwum poza serwerem | zaszyfrowane `age` | 7 dni w miejscu docelowym |
| `.env.docker` i lokalna konfiguracja proxy | zaszyfrowane, poza serwerem | ostatnia wersja, aktualizowana przy każdej zmianie |
| Dumpy sprzed resetu i sprzed aktualizacji | ta sama rotacja | 7 dni |

Poza kopią zostają: Redis (trzyma tylko krótkotrwałe liczniki) i certyfikaty TLS (certbot wydaje je
od nowa).

Dumpy i archiwa zawierają **dane osobowe** (konta, adresy, zamówienia). Polityka prywatności obiecuje,
że usunięte dane znikają z kopii w ciągu 7 dni, więc niczego nie trzymaj dłużej.

## 1. Jednorazowe przygotowanie

Utwórz katalog na kopie **poza repozytorium i projektem compose**, czytelny tylko dla właściciela
(użytkownika, którego crontab uruchamia skrypt):

```bash
install -d -m 700 /var/backups/daydream   # jako root, potem chown na tego użytkownika
```

Wygeneruj parę kluczy `age` **na własnym komputerze, nie na serwerze** (`age` jest w większości
menedżerów pakietów, np. `apt install age`):

```bash
age-keygen -o daydream-backup-key.txt
# Public key: age1...
```

`daydream-backup-key.txt` trzymaj w menedżerze haseł. Serwer dostaje tylko klucz publiczny (`age1...`),
więc skradziony serwer albo miejsce docelowe kopii nie pozwala ich odszyfrować.

## 2. Codzienna kopia

Zapisz jako `/usr/local/sbin/daydream-backup.sh` i nadaj `chmod 700`. Ustaw `DEPLOY_DIR` na katalog
repozytorium. Jeśli używasz nakładki Cloudflare (instrukcja wdrożenia, krok 4), ustaw też w crontabie
`DEPLOY_COMPOSE_FILES` na tę samą listę plików, której używasz w pozostałych poleceniach.

```bash
#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "${DEPLOY_DIR:-/srv/daydream}"
backups=${BACKUP_DIR:-/var/backups/daydream}
stamp=$(date -u +%Y%m%dT%H%M%SZ)
compose=(docker compose --env-file .env.docker)
for file in ${DEPLOY_COMPOSE_FILES:-docker-compose.yml docker-compose.prod.yml}; do compose+=(-f "$file"); done

mkdir -p "$backups/offsite" backups
"${compose[@]}" exec -T postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' </dev/null > "$backups/db-$stamp.dump"
"${compose[@]}" run --rm -T migrate tar -czf - -C /data/uploads . </dev/null > "$backups/uploads-$stamp.tar.gz"
[ -s "$backups/db-$stamp.dump" ] && [ -s "$backups/uploads-$stamp.tar.gz" ]

# Szyfrujemy najnowszą parę do kopii poza serwerem; klucza prywatnego nie ma na tym serwerze.
for f in "db-$stamp.dump" "uploads-$stamp.tar.gz"; do
  age -r "$AGE_RECIPIENT" -o "$backups/offsite/$f.age" "$backups/$f"
done

# Rotacja: wszystko starsze niż 7 dni, także dumpy sprzed resetu i sprzed aktualizacji z backups/.
find "$backups" backups -type f \( -name '*.dump' -o -name '*.tar.gz' -o -name '*.age' \) -mmin +10080 -delete
```

`scripts/demo-reset.sh` i polecenie sprzed aktualizacji (instrukcja wdrożenia, krok 6) zapisują dumpy
w `backups/` w katalogu repozytorium. Ostatnia linia rotuje także ten katalog, więc te dumpy też
wygasają po 7 dniach.

Crontab tego samego użytkownika, codziennie o 03:15 (`crontab -e`):

```cron
AGE_RECIPIENT=age1...twoj-klucz-publiczny
15 3 * * * /usr/local/sbin/daydream-backup.sh >> /var/backups/daydream/backup.log 2>&1
```

`pg_dump` działa wewnątrz kontenera `postgres` i bierze jego własne dane logowania, więc hasło nie
pojawia się w poleceniu. Użytkownik crona musi mieć prawo uruchamiać `docker`. Uruchom skrypt raz
ręcznie i sprawdź, czy pliki nie są puste:

```bash
AGE_RECIPIENT=age1... /usr/local/sbin/daydream-backup.sh && ls -l /var/backups/daydream
```

## 3. Kopia poza serwerem

Skrypt zostawia najnowszą zaszyfrowaną parę w `/var/backups/daydream/offsite/`. Skopiuj ten katalog
w wybrane przez siebie miejsce (inna maszyna, magazyn obiektów, dostawca kopii), według własnego
harmonogramu. Z `rclone` na przykład:

```bash
rclone copy /var/backups/daydream/offsite remote:daydream-backups
rclone delete --min-age 7d remote:daydream-backups
```

Druga linia daje miejscu docelowemu to samo 7-dniowe przechowywanie. Jeśli miejsce ma własną regułę
cyklu życia plików, użyj jej. Sprawdź tam przechowywanie: polityka prywatności na nim polega.

## 4. Konfiguracja

`.env.docker` zawiera klucze testowe Stripe, sekret podpisu webhooka, `AUTH_SECRET`, `CRON_SECRET`,
dane SMTP i Turnstile oraz dane do polityki prywatności. Bez niego odbudowany serwer nie zostanie
skonfigurowany tak samo (nowy `AUTH_SECRET` wylogowuje wszystkich odwiedzających). Trzymaj go
zaszyfrowanego poza serwerem, razem z każdą lokalną konfiguracją proxy, którą dodałeś (np.
`docker-compose.cloudflare.yml` albo pliki zastępczego proxy):

```bash
cd /srv/daydream
tar -czf - .env.docker docker-compose.cloudflare.yml | age -r age1...twoj-klucz-publiczny -o daydream-config.tar.gz.age
```

Podaj tylko pliki, które istnieją. Skopiuj `daydream-config.tar.gz.age` poza serwer i **powtarzaj to
przy każdej zmianie wartości w `.env.docker`** (nowy klucz Stripe, nowe hasło SMTP). Trzymaj tylko
ostatnią wersję. To sekrety, nie dane osobowe, więc reguła 7 dni jej nie dotyczy.

## 5. Odtwarzanie do świeżego wdrożenia

Odtwarzanie służy do awaryjnego przywrócenia, np. po utracie serwera.

> **Ostrzeżenie.** Odtworzenie przywraca wszystko, co istniało w chwili zrobienia kopii, także konta,
> które odwiedzający usunęli później. Używaj go wyłącznie do odzyskania utraconego albo uszkodzonego
> wdrożenia, nie do cofania pomyłki na działającym. Jeśli usunięte konta wrócą, powiedz o tym
> właścicielowi, bo trzeba je usunąć ponownie.

Na nowym serwerze, po spełnieniu wymagań z instrukcji wdrożenia (krok 1):

1. Pobierz kod (krok 2). Na swoim komputerze odszyfruj trzy pliki kluczem prywatnym i skopiuj je na
   serwer:

   ```bash
   age -d -i daydream-backup-key.txt -o db.dump db-<znacznik>.dump.age
   age -d -i daydream-backup-key.txt -o uploads.tar.gz uploads-<znacznik>.tar.gz.age
   age -d -i daydream-backup-key.txt daydream-config.tar.gz.age | tar -xzf -
   ```

   Konfigurację rozpakuj w katalogu repozytorium, wykonaj `chmod 600 .env.docker`, skieruj rekord DNS
   na nowy serwer i zbuduj obrazy (krok 2). Wydaj certyfikat TLS od nowa (krok 4).

2. Uruchom samego PostgreSQL-a. Utworzy pustą bazę z danych w `.env.docker`:

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
   ```

3. Odtwórz dump. Baza jest pusta, więc nie trzeba niczego czyścić:

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
     sh -c 'pg_restore --no-owner --exit-on-error -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < db.dump
   ```

4. Rozpakuj uploady do wolumenu (aplikacja działa jako użytkownik 1001):

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml run --rm -T migrate \
     sh -c 'tar -xzf - -C /data/uploads && chown -R 1001:1001 /data/uploads' < uploads.tar.gz
   ```

5. Uruchom całość. `migrate` startuje pierwszy i stosuje tylko migracje nowsze niż dump:

   ```bash
   docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d
   curl -fsS https://<domain>/api/health
   ```

6. Zaloguj się jako prywatny admin i otwórz produkt z wgranym zdjęciem. Potem usuń z serwera
   odszyfrowane `db.dump` i `uploads.tar.gz`, bo zawierają dane osobowe, i ponownie skonfiguruj
   codzienną kopię (krok 2).
