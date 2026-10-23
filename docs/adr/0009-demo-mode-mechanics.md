# 0009. Demo mode is an environment flag enforced by one guard in the Server Actions

- Status: Proposed
- Date: 2026-10-23

## Context

ADR 0006 makes demo mode the only production configuration: the demo admin account is public, admin
writes are blocked and the back-office is browsable read-only. Three things are left open: how demo
mode is switched on, which actions count as admin writes, and what happens to data visitors create
between resets.

Constraints from the owner: visitor personal data is kept no longer than necessary (default: nightly
reset); the public demo admin must not see other visitors' personal data (e-mail addresses, delivery
addresses); test purchases must not leave the catalogue unusable between resets.

Facts in the code today:

- Every admin action calls `requireAdmin()` from `lib/guards.ts`. Admin writes are `upsertProduct`,
  `deleteProduct`, `createCategory`, `deleteCategory`, `upsertIngredient`, `deleteIngredient`,
  `updateOrderStatus` and `deleteVoice`.
- `settings` (`actions/user/settings.ts`) lets any signed-in user change name, e-mail and password;
  `saveUserAddress` changes the saved delivery address. On a shared demo account either one breaks the
  demo for the next visitor.
- The back-office order list shows the buyer's name, e-mail and delivery address (`lib/db-orders.ts`).
- A paid order decrements stock permanently; a pending one holds stock for 45 minutes.

## Recommendation

Switch demo mode on with a `DEMO_MODE` environment variable and enforce it with one `requireWritable()`
guard called inside each blocked Server Action, because the actions are the only layer a visitor cannot
bypass and one guard is one place to audit.

**Switch.** `DEMO_MODE` is validated in `lib/env.ts`, defaults to `true`, and `false` is rejected when
`NODE_ENV=production`. Local development and the existing E2E and integration tests run with
`DEMO_MODE=false`; a separate E2E spec covers demo mode.

**What is blocked in demo mode** (the guard throws `ActionError("FORBIDDEN", …)`, the action returns the
usual `fail` result with a translated "disabled in the demo" message):

- every admin write listed above, including image uploads made through them;
- `settings` and `saveUserAddress` — the demo accounts' profile, e-mail, password and saved address
  cannot change;
- `register`, `resetPassword` and `newPassword` (see ADR 0011).

The UI disables the corresponding buttons and shows the same message, but that is cosmetic; the guard
is the enforcement. Reads are untouched, so the back-office stays fully browsable.

**What visitors can still do:** sign in with the published demo accounts, fill a cart, place and pay a
test order, retry a payment, and create, edit and delete their own Voices.

**Visitor data between resets:**

- **Delivery address:** in demo mode the delivery form is pre-filled with the demo customer's seeded,
  fictional address and is read-only, so no real address is ever stored and the back-office only ever
  shows seeded data. This is what keeps the demo admin from seeing visitors' personal data.
- **Orders:** the shared demo customer's order history shows every visitor's test orders until the
  next reset. Acceptable, because they carry only seeded personal data.
- **Voices:** free text by visitors, public on the product page and removed by the reset. The owner can
  run the reset by hand to remove abuse before the schedule does.
- **Stock:** in demo mode the webhook restores the reserved quantities when it marks an order paid, so
  paid test orders never deplete the catalogue. Pending reservations still decrement stock and are
  released by the reservation cron, so the reservation mechanism stays visible. Each order line is
  capped at 10 units in demo mode, so one visitor cannot hold a product's whole stock for 45 minutes.

## Alternatives considered

- **Demo mode always on when `NODE_ENV=production`, no flag** — one less variable, but local
  production builds (`next build && next start`) could no longer exercise admin writes.
- **Blocking writes in `proxy.ts`** — Server Actions are POSTs to page URLs; telling a blocked action
  from an allowed one there means parsing action ids. Fragile and easy to bypass.
- **Blocking writes in the database (read-only role)** — also blocks visitors' orders and Voices.
- **Masking personal data in the admin views instead of fixing the address** — works, but every new
  admin view needs to remember the mask; a fixed address removes the data instead.
- **Letting paid orders deplete stock until the reset** — honest, but a single scripted visitor can
  empty the catalogue for a day.

## Consequences

- One new module (`lib/demo.ts`: the flag, `requireWritable()`, the demo account e-mails) and one call
  per blocked action; a test per blocked action proves it returns `FORBIDDEN` in demo mode.
- The demo notice and the read-only UI states read the same flag.
- The restock-on-payment branch is demo-only logic in the webhook and needs its own test.
- New admin writes must call `requireWritable()`; the reviewer checks it.
