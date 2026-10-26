# Deployment guide

How the owner and the server administrator deploy and run the demo with Docker Compose
([ADR 0007](../adr/0007-deployment-from-a-docker-image.md)). Polish version:
[`docs/pl/deployment.md`](../pl/deployment.md). Every variable is described in the
[environment reference](environment.md). Backups and restore are covered in [`backups.md`](backups.md) (ADR 0014).

Images are built on the server (or on the owner's machine); nothing is pushed to a registry. The stack
is `docker-compose.yml` plus the production overlay `docker-compose.prod.yml`: PostgreSQL, Redis, the
migrator, the app, nginx with certbot, and the reservation cron. Mailpit is not part of production.

All commands run in the repository directory on the server. Every `docker compose` call below uses
this prefix; set it once as an alias or a shell variable if you like:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml
```

`--env-file` is required: without it Compose reads the development `.env` and trips over the `$`
characters in its secrets.

## 1. Prerequisites

- A Linux server with Docker Engine and the Compose plugin (v2.24.4 or newer, for the `!reset` tag in the
  overlay), and `git`.
- A public domain whose DNS `A`/`AAAA` record points at the server, and ports 80 and 443 open.
- The accounts from [step 11](#11-external-accounts): Stripe (test mode), Cloudflare Turnstile and an
  SMTP provider. GitHub and Google OAuth are optional.
- About 2 GB of free RAM for the build and 5 GB of disk.

## 2. Get the code and build the images

```bash
git clone https://github.com/pwrobel03/daydream-ecommerce-website.git
cd daydream-ecommerce-website
```

`NEXT_PUBLIC_APP_URL` is baked into the build output (sitemap, `robots.txt`, page metadata). Fill in
`.env.docker` (step 3) **before** you build, with the real public URL, then:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml build
```

This builds the `app` image and the `migrator` image from the `Dockerfile`. Changing
`NEXT_PUBLIC_APP_URL` later requires a rebuild.

## 3. Fill in `.env.docker`

```bash
cp .env.docker.example .env.docker
chmod 600 .env.docker
```

Set every value from the [environment reference](environment.md). For production:

| Variable | Value |
| --- | --- |
| `AUTH_SECRET` | `npx auth secret`, or `openssl rand -base64 32` |
| `CRON_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL`, `NEXT_PUBLIC_APP_URL` | `https://<domain>`, the same value in both |
| `AUTH_TRUST_HOST` | `true` |
| `DOMAIN` | `<domain>`, no scheme |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe **test** keys (step 11); a live key stops the app |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | your SMTP provider (step 11) |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | your Turnstile widget, not the always-pass test keys |
| `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL`, `PRIVACY_EMAIL_PROVIDER` | the owner's details, shown on `/privacy` |
| `RUN_SEED` | `true` for the first start only (step 6), then `false` |

The overlay does not set `SMTP_HOST` or `SMTP_PORT`, so the app uses the values from `.env.docker`
(the base file points them at Mailpit). Do not commit `.env.docker`.

## 4. TLS and the reverse proxy

nginx is the entry point: the app publishes no port in production. The bundled config
`docker/nginx/daydream.conf` redirects HTTP to HTTPS and keeps `/.well-known/acme-challenge/` on HTTP
for certbot.

**The proxy must set `X-Real-IP` to the client address, overwriting anything the client sent.** The
app reads the client address only from that header, for every per-IP limit (login, registration, mail).
The bundled config does this with `proxy_set_header X-Real-IP $remote_addr;`. Without it, every request
counts as the IP `unknown`, and all visitors share one limit.

Issue the first certificate before you start nginx, which cannot start without it. Port 80 must be
free, so run this before step 5:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml \
  run --rm --entrypoint certbot -p 80:80 certbot certonly --standalone -d <domain>
```

Certbot then renews the certificate every 12 hours through the webroot, with the `certbot` service.
Renewal needs the `nginx` service to be running (step 5).

**Replacing nginx and certbot** (another proxy, a hosting panel, a load balancer) is the
administrator's choice. Remove the `nginx` and `certbot` services and publish the app yourself, then
make the replacement:

- terminate TLS and forward to `app:3000`;
- overwrite `X-Real-IP` with the client address, never pass the client's own value through;
- send `Host` and `X-Forwarded-Proto` (Auth.js builds its callbacks from them);
- allow request bodies up to 50 MB (`client_max_body_size 50m`, matching `serverActions.bodySizeLimit`).

### Behind Cloudflare (proxied domain)

If the domain is proxied by Cloudflare (orange cloud), `$remote_addr` is a Cloudflare edge address,
so all visitors would share one per-IP limit. The proxy must take the client address from the
`CF-Connecting-IP` header, but only from Cloudflare's own ranges.

For the bundled nginx, mount `docker/nginx/cloudflare-real-ip.conf` (`real_ip_header CF-Connecting-IP`
and `set_real_ip_from` for every Cloudflare range). Add a file `docker-compose.cloudflare.yml`:

```yaml
services:
  nginx:
    volumes:
      - ./docker/nginx/cloudflare-real-ip.conf:/etc/nginx/conf.d/cloudflare-real-ip.conf:ro
```

and from now on add this file to the prefix of **every** later command, including `build` and `up -d` in step 13:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.cloudflare.yml
```

Or set `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml:docker-compose.cloudflare.yml` in the shell profile. If a later `up -d` omits the file, nginx is recreated without the mount and all visitors share one address and one rate limit. `scripts/create-admin.sh` and `scripts/demo-reset.sh` only touch `migrate` and `postgres`, so they do not need it. `daydream.conf` still sets
`X-Real-IP` from `$remote_addr`, which nginx now rewrites to the real client. Compare the ranges in the
file with <https://www.cloudflare.com/ips/> when you deploy and from time to time after. With another
proxy, take the address from `CF-Connecting-IP` in the same way and trust it only from Cloudflare.

Check it after the first request through Cloudflare: sign-in attempts from two different networks must
not share a counter. If the app sees `unknown` or the same address for everyone, `X-Real-IP` is not
set correctly.

## 5. Start the stack

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml ps
```

Order of start: PostgreSQL and Redis become healthy, `migrate` runs once and exits (step 6), then
`app`, `cron`, `nginx` and `certbot` start. Mailpit is behind the `local` profile and does not start.

## 6. Migrations and the first seed

The `migrate` service runs `prisma migrate deploy` on every `up`, before the app starts. The app does
not start if it fails; read the reason with:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs migrate
```

**The first seed.** With `RUN_SEED=true` in `.env.docker`, `migrate` loads the demo catalogue when the
catalogue is empty, and skips it otherwise. Leave it `true` for the first start only, then set
`RUN_SEED=false` in `.env.docker`. The seed creates the demo admin (`demo-admin@example.com`, read-only)
and sample customers; it creates no full-rights admin.

**Before deploying new migrations** (any update that adds a directory under `prisma/migrations/`),
take a dump first:

```bash
mkdir -p backups && chmod 700 backups
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > backups/pre-upgrade-$(date -u +%Y%m%dT%H%M%SZ).dump
```

The dump contains personal data. Keep it like any other backup (7 days, ADR 0014).

## 7. Create the private admin

The seed creates no full-rights admin. Create yours once, in a terminal on the server:

```bash
scripts/create-admin.sh owner@example.com "Owner"
```

The script asks for the password twice and does **not echo it**:

```text
Password for owner@example.com:
Repeat the password:
```

The password needs at least 12 characters. It travels on standard input into the migrator container:
it is never an argument, an environment variable, shell history or a file. Running the script again
for the same e-mail resets the password. Nothing else in the app can create or promote an admin, and
the demo reset keeps `ADMIN` users.

## 8. Reservation cron and clean-up of unverified accounts

The `cron` service calls `POST /api/cron/release-reservations` every 5 minutes with
`Authorization: Bearer $CRON_SECRET`. Each run:

- releases the stock held by orders that never reached payment and whose reservation expired;
- deletes registrations whose e-mail address was never verified, 24 hours after creation (accounts with
  orders, Voices, OAuth links or an address are kept). This is what the privacy notice promises.

Check it and run it by hand:

```bash
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml logs --tail 20 cron
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml exec cron \
  sh -c 'curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://app:3000/api/cron/release-reservations'
```

A `401` means `CRON_SECRET` differs between `cron` and `app`; both read it from `.env.docker`, so
recreate both after a change.

## 9. Health check

```bash
curl -fsS https://<domain>/api/health
```

`200` with `{"status":"ok","database":true,"redis":true}` means the app reaches PostgreSQL and Redis.
`503` with `"status":"degraded"` names the dependency that failed; the details are in the app log.
Point your uptime monitor at this URL.

## 10. Demo reset

The owner resets the demo by hand, in a terminal on the server (ADR 0010):

```bash
scripts/demo-reset.sh
```

The script shows what it will delete (accounts, orders, uploads), writes
`backups/pre-reset-<timestamp>.dump` and an uploads archive next to it, and waits until you type
`RESET`. Anything else aborts with nothing deleted. It refuses to run without a terminal and has no
option to skip the confirmation, so it cannot be scheduled. Afterwards the shop is back in the seed
state; `ADMIN` users stay, and visitors' sessions end. The pre-reset dump contains personal data;
delete it after 7 days like any other backup.

## 11. External accounts

Register these yourself; they belong to the owner. Put the values in `.env.docker`, then recreate the
app (`up -d`).

**Stripe (test mode only).** Create a Stripe account and stay in test mode.

1. Developers → API keys: the secret key (`sk_test_…`) is `STRIPE_SECRET_KEY`.
2. Developers → Webhooks → add endpoint `https://<domain>/api/webhook/stripe`, with the events
   `checkout.session.completed`, `checkout.session.expired` and `payment_intent.payment_failed`
   (the ones the handler uses; others are acknowledged and ignored).
3. Copy the endpoint's signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

**Cloudflare Turnstile.** In the Cloudflare dashboard → Turnstile → add a widget for `<domain>`. The
site key is `TURNSTILE_SITE_KEY`, the secret key is `TURNSTILE_SECRET_KEY`. Do not ship the always-pass
test keys.

**SMTP provider.** Any provider that offers SMTP. Fill in `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
(`true` for port 465), `SMTP_USER`, `SMTP_PASSWORD`, and a `MAIL_FROM` address on a domain you verify
with the provider. Add the provider's **SPF** and **DKIM** DNS records for that sending domain, or
verification and password-reset mails land in spam. The provider's name goes into
`PRIVACY_EMAIL_PROVIDER`. The app caps outgoing mail (`MAIL_DAILY_LIMIT`, default 50 a day).

**GitHub and Google sign-in (optional).** Without them the demo works and no OAuth button shows. Set
both the ID and the secret of a provider, or neither.

- GitHub: Settings → Developer settings → OAuth Apps. Callback URL
  `https://<domain>/api/auth/callback/github` → `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- Google: Cloud Console → APIs & Services → Credentials → OAuth client ID (web application).
  Authorised redirect URI `https://<domain>/api/auth/callback/google` → `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`.

Adding a provider means adding it to the processors named on `/privacy` (ADR 0013).

**Privacy details.** Set `PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL` and
`PRIVACY_EMAIL_PROVIDER`. The app does not start without them. Read `/privacy` in both languages
before the demo goes public.

## 12. Logs

The privacy notice states that logs are kept as long as the administrator sets, and the guide
recommends **at most 14 days**. Logs hold IP addresses (nginx) and recipient addresses of failed
e-mails (app). Set it up once:

- Docker container logs: use the `journald` log driver (`"log-driver": "journald"` in
  `/etc/docker/daemon.json`) and `MaxRetentionSec=14day` in `/etc/systemd/journald.conf`; or the
  `local` driver with `max-size` and `max-file` small enough to cover less than 14 days.
- Any log file you write yourself, such as an nginx log outside Docker: `logrotate` with `daily` and
  `rotate 14`.

## 13. Updating to a new version

```bash
git pull --ff-only
# Read the changes to .env.docker.example; add any new variable to .env.docker.
# Take the pre-upgrade dump (step 6) if prisma/migrations/ changed.
# Behind Cloudflare, add -f docker-compose.cloudflare.yml (step 4) to both commands below.
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml build
docker compose --env-file .env.docker -f docker-compose.yml -f docker-compose.prod.yml up -d
curl -fsS https://<domain>/api/health
```

`up -d` runs the migrator first and recreates only the services whose image or configuration changed.
If the app does not come up, read `logs migrate` and `logs app`. To go back, check out the previous
tag or commit and rebuild; migrations are not reversed automatically, so restore the pre-upgrade dump
if the schema changed.
