# 0009. The public demo admin is a read-only role, and the back-office masks personal data on the server

- Status: Proposed
- Date: 2026-10-23

## Context

ADR 0006 makes demo mode the only production configuration and keeps the demo admin account public.
The owner's revision narrows what demo mode restricts:

- Customers keep full functionality: registration, e-mail verification, password reset, outgoing
  e-mail, their own delivery addresses (ADR 0011, 0012).
- Only the **public demo admin** is restricted. It is strictly read-only: no writes, no uploads. The
  owner's **private admin** has full rights, and its credentials are never published or seeded with
  known values (ADR 0011).
- The demo admin must never receive visitors' e-mail or delivery addresses. This is enforced on the
  server, in the queries and actions that feed the back-office, not only in the UI.
- Test purchases must not leave the catalogue unusable.

Facts in the code today:

- `UserRole` has two values, `ADMIN` and `USER`. Every admin action calls `requireAdmin()` from
  `lib/guards.ts`, which accepts only `ADMIN`. The admin writes are `upsertProduct` (including its
  image uploads), `deleteProduct`, `createCategory`, `deleteCategory`, `upsertIngredient`,
  `deleteIngredient`, `updateOrderStatus` and `deleteVoice`.
- The back-office layout lets in only `role === ADMIN`.
- The admin order list (`lib/db-orders.ts`) selects `user.name`, `user.email` and the whole `address`,
  and its search matches on the buyer's e-mail and street.
- A paid order decrements stock permanently. A pending one holds stock for 45 minutes.

## Recommendation

Add a `DEMO_ADMIN` value to `UserRole` for the public account and keep `requireAdmin()` accepting only
`ADMIN`, because then every existing and future admin write is closed to the demo admin by default,
without anyone having to remember a second guard.

**Access.**

- `requireBackOffice()` in `lib/guards.ts` accepts `ADMIN` and `DEMO_ADMIN`. The back-office layout and
  the back-office reads use it. Writes keep `requireAdmin()` and need no change, so uploads are blocked
  too: they only happen inside `upsertProduct`.
- The demo admin's own account is shared by every visitor, so it cannot change anything of its own
  either: `settings`, `saveUserAddress`, `deleteAccount`, Voice writes and order creation reject
  `DEMO_ADMIN`. Each of these actions calls one guard, `requireOwnAccountWrites()`.
- A blocked action returns the usual `fail("FORBIDDEN", …)` result with a translated "read-only demo
  account" message. The UI disables the buttons and shows the same message, but that is cosmetic; the
  guards are the enforcement.

**Personal data in the back-office.**

- Back-office reads take the viewer's role. For anything other than `ADMIN`, the Prisma query selects
  neither `user.email`, `user.name` nor the `address` relation. The buyer is shown as a pseudonym
  derived from the user ID (e.g. "Customer 7f3a"). The data never leaves the database, so it cannot
  reach the demo admin's RSC payload or an action response.
- For the demo admin, search ignores the e-mail and street conditions. Otherwise searching for an
  address would reveal whether that person has ordered.
- The masked and unmasked results are two different query shapes with two types derived from their
  `select` (ADR 0015). Masked fields are absent from the type, not empty strings.
- The buyer's name is masked as well, although the owner named only e-mail and addresses: a name next
  to a purchase history is personal data just as much. Names on Voices stay visible, because Voices
  are public on the product page anyway.

**Stock.** The webhook restores the reserved quantities when it marks an order paid, so paid test
orders never deplete the catalogue. Pending reservations still decrement stock and are released by
the reservation cron, so the reservation mechanism stays visible. Each order line is capped at 10
units, so one visitor cannot hold a product's whole stock for 45 minutes.

**No `DEMO_MODE` flag.** After the revision, every demo behaviour is either tied to a role (the demo
admin) or harmless outside production (the notice, the restock, the line cap). E-mail limits and the
CAPTCHA (ADR 0012) have their own configuration. A flag whose only valid production value is `true`
would only add a way to switch the demo off by accident.

## Alternatives considered

- **Keep the demo admin as `ADMIN` and recognise it by an e-mail in an env variable** — no migration,
  but the role would claim full rights. One forgotten check in a new write would give the public
  account write access.
- **A `readOnly` flag on `User`** — same fail-open problem: every guard has to read a second field.
- **Masking in the components only** — rejected by the owner. The data would still be in the RSC
  payload.
- **A `DEMO_MODE` environment flag** (the earlier proposal) — see above.
- **Letting paid orders deplete stock** — honest, but a single scripted visitor can empty the
  catalogue until the owner runs a reset.

## Consequences

- A migration adds `DEMO_ADMIN` to `UserRole`. The seed creates the demo admin with this role and
  creates no `ADMIN` (ADR 0011).
- Every `role === ADMIN` check in pages and components is reviewed. A check that should also let the
  demo admin in switches to the back-office check.
- Tests: each admin write and each own-account write returns `FORBIDDEN` for `DEMO_ADMIN`. The admin
  order reads, called as the demo admin, return no e-mail, name or address; the test asserts on the
  serialised result, not on the rendered page. Search by e-mail returns nothing for the demo admin.
- The restock-on-payment branch changes what the existing webhook tests expect, and it needs its own
  test.
- Every new back-office read that touches users or addresses must branch on the role. The reviewer
  checks it.
