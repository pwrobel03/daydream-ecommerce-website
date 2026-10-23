# 0011. Visitors register their own accounts; the private admin is created by a one-off script

- Status: Proposed
- Date: 2026-10-23

## Context

The owner's revision keeps full customer functionality in the demo: registration, e-mail
verification, password reset, and deleting one's own account from the account settings. The public
demo admin is read-only (ADR 0009). The owner's private admin has full rights. It is created at
deployment by a script the owner runs, with the password read interactively (`read -s`), never from
an argument, an environment variable or a file. Every account needs login rate limiting. The demo must
work fully without OAuth credentials.

Facts in the code today:

- `prisma/seed.ts` creates `peter@admin.com` as `ADMIN` and four customers under `daydream.com`, all
  with the password `password123`. `admin.com` and `daydream.com` are real domains.
- The login limit (`login:<email>:<ip>`, 5 per 15 minutes) is applied in the `login` Server Action.
  The password is checked later, by `authorize()` in `auth.ts`, which the client reaches through
  `signIn("credentials")`. A client that posts to `/api/auth/callback/credentials` directly skips the
  action, so today the limit can be bypassed.
- `lib/env.ts` requires `AUTH_GOOGLE_*` and `AUTH_GITHUB_*`, and `auth.config.ts` always registers both
  providers.
- `Order.user` has no `onDelete`, so a user with orders cannot be deleted by cascade.
- The `jwt` callback merges whatever the client sends with `update()` into the token
  (`{ ...token, ...session }`), including `role`.

## Recommendation

Visitors register their own accounts and the seed publishes only the demo admin, because a shared
customer account would show one visitor's delivery address and orders to the next.

**Seeded accounts.**

- The demo admin, `demo-admin@example.com`, has the role `DEMO_ADMIN`, and its password is published
  on the login page with a "sign in as demo admin" button.
- The sample customers who own the seeded orders move to `example.com` and get random passwords that
  nobody knows. They exist only so that the back-office has data.
- The seed creates no `ADMIN`. The E2E suite keeps creating its own admin in `tests/e2e/seed.ts`.

**The private admin.** `scripts/create-admin.sh <email> [name]` runs on the server in the deployment
directory.

- It reads the password twice with `read -s` and pipes it on standard input to
  `scripts/create-admin.ts` in the migrator (`docker compose run --rm -T migrate …`). The value is
  held in an unexported shell variable, so it never appears in an argument, the process environment,
  shell history or a file.
- The TypeScript side requires at least 12 characters, hashes the password with bcrypt and upserts the
  user by e-mail with role `ADMIN` and a verified e-mail. Running it again resets the password.
- Nothing else in the app can create an `ADMIN` or promote a user. The reset keeps `ADMIN` users
  (ADR 0010).

**Login rate limiting.** The limit moves into `authorize()` in `auth.ts`. That is the one place every
credentials sign-in passes through, so it applies to every account, including both admins.

- Per account: 5 failed attempts per e-mail per 15 minutes, whatever the IP.
- Per IP: 20 attempts per 15 minutes across all accounts.
- When a limit is hit, `authorize()` throws a `CredentialsSignin` subclass with a `rate_limited` code,
  and the login form shows the existing "too many attempts" message. The `login` action stops counting
  attempts.
- The limiter stays fail-open on a Redis outage, as `lib/rate-limit.ts` documents. The private admin's
  12-character minimum keeps guessing impractical during an outage. The demo admin's password is
  public anyway.
- The per-account limit lets anyone lock an account for 15 minutes, the private admin included. The
  lockout is the price of a limit that cannot be spread across IPs.

**Deleting one's own account.** The account settings get a "delete account" section.

- `deleteAccount` asks for the current password, or, for an OAuth account, for the e-mail typed in
  again.
- In one transaction it releases the stock of the user's pending orders, deletes their orders (items
  cascade), their addresses, Voices and OAuth accounts, their verification and reset tokens, and the
  user.
- `ADMIN` and `DEMO_ADMIN` accounts cannot delete themselves this way.
- The session ends on the next request, because the `jwt` callback already returns `null` for a user
  that no longer exists.

**OAuth.** GitHub and Google are registered in `auth.config.ts` only when both their ID and secret are
set. The variables become optional in `lib/env.ts`, and the OAuth buttons render only for registered
providers. The demo works with none. The deployment guide lists them as optional, with what to
register if the owner wants them.

## Alternatives considered

- **A published demo customer account** (the earlier proposal) — the fastest way to click through,
  but customers now enter real addresses, and every visitor would see the previous visitor's.
- **The private admin from the seed, with the password in an env variable** — rejected by the owner.
  The value would sit in `.env.docker` and in the container environment.
- **A Node prompt with hidden input instead of `read -s`** — works the same, but the owner asked for
  `read -s` in their own terminal, and the wrapper keeps the password out of Docker's command line.
- **Keeping the limit in the `login` action** — it does not cover a direct post to the Auth.js
  endpoint.
- **Soft deletion (anonymising instead of deleting)** — keeps order statistics intact, but these are
  test orders with no accounting value, and a real deletion is simpler to explain in the privacy
  notice.

## Consequences

- The migration from ADR 0009 (`DEMO_ADMIN`) covers the seeded demo admin. The script needs no schema
  change.
- The `jwt` callback's `update` branch copies only `name`. Today the next request reloads `role` from
  the database, so the merge is not exploitable as it stands, but a client must never be able to write
  `role` into its token.
- Tests: an integration test that `authorize()` refuses the sixth attempt for one e-mail from
  different IPs; an integration test of `deleteAccount` with a pending order (stock restored, no rows
  left for the user); a unit test that `create-admin.ts` rejects short passwords.
- The deployment guide documents `create-admin.sh` as a deployment step and shows that the password is
  never echoed.
