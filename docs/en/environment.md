# Environment variable reference

Every variable read by the app, the migrator, the compose files and the cron. Polish version:
[`docs/pl/environment.md`](../pl/environment.md).

`lib/env.ts` validates the application's variables when it is imported and stops the process with a
message naming each bad key. Templates: [`.env.example`](../../.env.example) (development, copied to
`.env`) and [`.env.docker.example`](../../.env.docker.example) (Docker, copied to `.env.docker`).

**When** means when the value is read. *Runtime* values are read when the container or the dev server
starts and can change without rebuilding the image. *Build* values are read by `next build` and
`prisma generate`. `lib/env.ts` validates every key in the Application table during `next build`, so the
`Dockerfile` sets a placeholder for each one that has no safe default. Those placeholders are not used at
runtime.

## Rules

- **Stripe test keys only.** `STRIPE_SECRET_KEY` must start with `sk_test_` or `rk_test_`. Any value
  that starts with `sk_live_`, `rk_live_` or `pk_live_`, in *any* variable, stops the app at startup;
  the message names the variable, never the value (ADR 0005).
- **Cloudflare's test keys for local development.** The Turnstile pair in the templates
  (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`) always passes. Use widget keys
  from the Cloudflare dashboard only on a public deployment.
- **`AUTH_URL` and `NEXT_PUBLIC_APP_URL` must match the public URL** of the app: same scheme, host and
  port (`http://localhost:3100` when `PORT=3100`). A mismatch breaks sign-in callbacks, Stripe redirects
  and links in e-mails.
- **OAuth is optional, but a pair is all or nothing.** Set both `_ID` and `_SECRET` of a provider or
  neither; one without the other stops the app.

## Application

| Variable | Required | Format | Example | Default | Where it comes from | When |
| --- | --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL URL | `postgresql://user:password@localhost:5432/daydream` | none | Your PostgreSQL instance. Compose sets it for `app` and `migrate`. | runtime; build (needed by `prisma generate`) |
| `REDIS_URL` | yes | URL | `redis://localhost:6379` | none | Your Redis instance. Compose sets it to the `redis` service. | runtime |
| `AUTH_SECRET` | yes | non-empty string | `k3J…` (32 random bytes, base64) | none | Generate with `npx auth secret`. | runtime |
| `AUTH_URL` | yes in practice | URL | `http://localhost:3000` | none | The public URL of the app. Read by Auth.js, not by `lib/env.ts`. See the rules. | runtime |
| `AUTH_TRUST_HOST` | when behind a proxy | `true` | `true` | none | Set to `true` for Docker, nginx or any host other than localhost. Read by Auth.js. | runtime |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | optional, as a pair | non-empty strings | `123-abc.apps.googleusercontent.com` | none | Google Cloud Console → APIs & Services → Credentials → OAuth client ID. | runtime |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | optional, as a pair | non-empty strings | `Iv1.abc123` | none | GitHub → Settings → Developer settings → OAuth Apps. | runtime |
| `STRIPE_SECRET_KEY` | yes | `sk_test_…` or `rk_test_…` | `sk_test_51Abc…` | none | Stripe test dashboard → Developers → API keys → secret key. | runtime |
| `STRIPE_WEBHOOK_SECRET` | yes | `whsec_…` | `whsec_abc123…` | none | Locally: `stripe listen --forward-to localhost:3000/api/webhook/stripe` prints it. Deployed: Stripe test dashboard → Developers → Webhooks → endpoint → signing secret. | runtime |
| `SMTP_HOST` | yes | host name | `localhost` | none | Your SMTP server; Mailpit in the demo. Compose sets it to `mailpit`. | runtime |
| `SMTP_PORT` | no | positive integer | `1025` | `1025` | Your SMTP server. Compose sets it to `1025`. | runtime |
| `SMTP_SECURE` | no | `true` or `false` | `false` | `false` | `true` for implicit TLS (usually port 465). | runtime |
| `SMTP_USER`, `SMTP_PASSWORD` | no | strings | `apikey` | empty | Your SMTP provider. Leave empty for Mailpit. | runtime |
| `MAIL_FROM` | yes | e-mail, optionally with a name | `Daydream <hello@daydream.local>` | none | An address your SMTP provider lets you send from. | runtime |
| `MAIL_DAILY_LIMIT` | no | positive integer | `50` | `50` | Your choice. Hard cap on e-mails per day (ADR 0012). | runtime |
| `MAIL_HOURLY_LIMIT_PER_ADDRESS` | no | positive integer | `3` | `3` | Your choice. Cap per recipient per hour. | runtime |
| `MAIL_HOURLY_LIMIT_PER_IP` | no | positive integer | `3` | `3` | Your choice. Cap per client IP per hour. | runtime |
| `UPLOAD_DIR` | yes | path outside `public/` | `./storage/uploads` | none | A directory you mount as a volume. Compose sets `/data/uploads`. | runtime |
| `CRON_SECRET` | yes | string, 16 characters or more | `change_me_to_a_long_random_string` | none | Generate, for example with `openssl rand -base64 32`. The `cron` service sends it as a bearer token. | runtime |
| `TURNSTILE_SITE_KEY` | yes | non-empty string | `1x00000000000000000000AA` | none | Cloudflare dashboard → Turnstile → widget → site key. Locally use the test key. | runtime |
| `TURNSTILE_SECRET_KEY` | yes | non-empty string | `1x0000000000000000000000000000000AA` | none | Cloudflare dashboard → Turnstile → widget → secret key. Locally use the test key. | runtime |
| `PRIVACY_CONTROLLER_NAME` | yes | non-empty string | `Jan Kowalski` | none | The data controller: the owner of the deployment. Shown on `/privacy`. | runtime |
| `PRIVACY_CONTACT_EMAIL` | yes | e-mail address | `privacy@example.com` | none | A mailbox the owner reads. Shown on `/privacy`. | runtime |
| `PRIVACY_EMAIL_PROVIDER` | yes | non-empty string | `Example SMTP Provider` | none | The name of the SMTP provider that sends the mail. Shown on `/privacy`. | runtime |
| `NEXT_PUBLIC_APP_URL` | yes | URL | `http://localhost:3000` | none | The public URL of the app. Read per request: Stripe redirects, links in e-mails, `robots.txt`, the sitemap and the page metadata (`og:url`, absolute OG image URLs). Change it and restart the container; no rebuild. | runtime |
| `NODE_ENV` | no | `development`, `test` or `production` | `production` | `development` | Set by `next dev`, `next build` and the `Dockerfile` (`production`). Do not set it by hand. | runtime |

## Docker and compose

| Variable | Used by | Required | Format | Example | Default | Where it comes from | When |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `RUN_SEED` | `migrate` (`docker/migrate.sh`) | no | `true` or `false` | `true` | unset (no seed) | `.env.docker`. `true` loads the demo catalogue when the catalogue is empty. Only `migrate` reads it; the production overlay sets `false` for `app`, which ignores it, so production still seeds an empty catalogue while `.env.docker` has `true` (the template default). Set `RUN_SEED=false` in `.env.docker` for production. | runtime |
| `DOMAIN` | `nginx` in `docker-compose.prod.yml` | production only | host name | `daydream.example.com` | none | The public domain pointing at the server. Compose stops when it is unset. | runtime |
| `CRON_SECRET` | `cron` in `docker-compose.prod.yml` | production only | same as above | | none | Must equal the `CRON_SECRET` of the app; read from `.env.docker`. | runtime |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `postgres` | set in the compose files | strings | `daydream` | `daydream` | Written in `docker-compose.yml` (`daydream_e2e` database in `docker-compose.test.yml`). They must match `DATABASE_URL`. | runtime |
| `PORT`, `HOSTNAME` | `Dockerfile` runtime stage | set in the image | `3000`, `0.0.0.0` | | `3000`, `0.0.0.0` | Fixed in the image. Publish another host port with `ports:` instead. In development, `PORT=<port> npm run dev`. | runtime |
| `NEXT_TELEMETRY_DISABLED` | `Dockerfile` | set in the image | `1` | | `1` | Fixed in the image. | build and runtime |

Compose reads no `${…}` variable except `DOMAIN` and `CRON_SECRET` in the production overlay; start it
with `--env-file .env.docker`. The base `docker-compose.yml` passes the file to `app` and `migrate`
through `env_file`.

## Set by tooling, not by you

- `NEXT_RUNTIME` is set by Next.js; `instrumentation.ts` reads it.
- `CI` is set by the CI service; Playwright uses it for retries and the reporter.
- The E2E run (`scripts/e2e.sh`, `playwright.config.ts`) sets its own values for `AUTH_URL`,
  `AUTH_TRUST_HOST`, `NEXT_PUBLIC_APP_URL` and the database, Redis and SMTP ports of
  `docker-compose.test.yml`.
- `scripts/create-admin.*`, `scripts/demo-reset.*` and `scripts/migrate-uploads.ts` read `DATABASE_URL`
  and `UPLOAD_DIR` from the environment they run in.
