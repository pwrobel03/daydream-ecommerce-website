# 0011. Visitors sign in with published demo accounts; self-registration and OAuth are off in the demo

- Status: Proposed
- Date: 2026-10-23

## Context

The demo must work fully without OAuth credentials. Accounts created by visitors contain e-mail
addresses, which is personal data, and the app must never send e-mail to addresses typed in by
strangers (ADR 0012). Today registration requires a verified e-mail, `auth.config.ts` always registers
GitHub and Google, and `lib/env.ts` requires `AUTH_GOOGLE_*` and `AUTH_GITHUB_*`. The checkout
(`/cart` and everything after it) requires a signed-in user.

## Recommendation

Publish two demo accounts — the demo admin and a demo customer — and switch off self-registration,
password reset and OAuth in demo mode, because this removes visitor accounts, and the personal data
they carry, from the demo altogether.

- The login page shows both accounts with their passwords and a one-click "sign in as" button for each.
- `/auth/register`, `/auth/forgot-password` and `/auth/new-password` render a short "not available in
  the demo" page; the actions are blocked by the demo guard (ADR 0009).
- GitHub and Google are registered in `auth.config.ts` only when both their ID and secret are set and
  demo mode is off. Their variables become optional in `lib/env.ts`, and the OAuth buttons render only
  for registered providers. The demo therefore needs no OAuth app at all.
- The seeded demo accounts move to addresses under the reserved `example.com` domain
  (e.g. `admin@example.com`, `customer@example.com`). Today they use `admin.com` and `daydream.com`,
  which are real domains.

## Alternatives considered

- **Open registration with automatic verification and no e-mail** — visitors see the real sign-up
  form, but every account stores whatever e-mail address they type, and the demo admin would see it.
  It also needs masking in admin views and per-account cleanup.
- **OAuth enabled in the demo** — a nice touch for developers, but it stores real names and e-mail
  addresses from GitHub or Google and needs OAuth apps configured by the owner.
- **Anonymous checkout without signing in** — changes the order model and the ownership checks; too
  large for this goal.

## Consequences

- Visitors share the demo customer's order history and Voices until the next reset (ADR 0009).
- The deployment guide lists no OAuth apps to register. If the owner later wants OAuth in the demo,
  that is a new decision superseding this one.
- E2E tests for registration and e-mail verification keep running with `DEMO_MODE=false`.
