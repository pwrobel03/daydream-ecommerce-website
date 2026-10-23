# 0005. Payments use Stripe in test mode only; live keys stop the app at startup

- Status: Accepted
- Date: 2026-10-23

## Context

The portfolio demo shows a real payment flow, but must never take real money. On `main` the payment path
already reads prices from the database (`actions/order/order.ts`), creates the Checkout session in
`lib/checkout-session.ts`, and the webhook (`app/api/webhook/stripe/route.ts`) is idempotent
(`ProcessedWebhookEvent`) and compares `amount_total` with the order total. Reservations are released by
`app/api/cron/release-reservations`. `README.md`, `README-pl.md` and `docs/*/features.md` still
describe these as open problems.

`lib/env.ts` today only checks that `STRIPE_SECRET_KEY` starts with `sk_`, which a live key also does.

## Recommendation

Accept only Stripe test keys and fail at startup on any key starting with `sk_live_`, `rk_live_` or
`pk_live_`, because real payments must be impossible rather than discouraged.

- `lib/env.ts` rejects a live prefix in **any** environment variable, not just the expected one, so a
  live key pasted into the wrong variable also stops the process.
- `STRIPE_SECRET_KEY` must start with `sk_test_` or `rk_test_`.
- Defence in depth, cheap to add: the webhook rejects events with `livemode: true`, and session
  creation refuses a session that Stripe reports as `livemode`.
- The checkout and payment screens show the test card `4242 4242 4242 4242` (see ADR 0006); the Stripe
  Checkout page can carry the same note through `custom_text`.

The payment path is **reviewed and verified, not rewritten**: order creation, Stripe session, webhook,
retry and reservation release are checked against Stripe test mode; only what the review finds is
fixed; then `README.md`, `README-pl.md` and `docs/*/features.md` are updated to match the code.

## Alternatives considered

- **Warn instead of fail** — a warning in a log does not stop a live charge.
- **Check only `STRIPE_SECRET_KEY`** — misses a live key in another variable.
- **Rewrite the payment path** — the known bugs are already fixed; a rewrite would add risk, not remove it.

## Consequences

- Tests and CI keep using `sk_test_…` placeholders; a test asserts that each live prefix fails validation.
- The owner registers the webhook endpoint in the Stripe test dashboard and sets its signing secret
  at deployment (ADR 0007).
