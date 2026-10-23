# 0012. Outgoing e-mail works in the demo behind hard limits in code and a CAPTCHA

- Status: Accepted
- Date: 2026-10-23

## Context

The owner's revision keeps outgoing e-mail in the demo: verification, password reset, e-mail change
and order confirmations. Because strangers can type in any address, the owner set hard limits that
cannot be bypassed:

- a global daily cap enforced in code (Redis, value from env, e.g. 50 per day);
- per-address and per-IP limits (e.g. 3 per hour);
- once a limit is hit, the e-mail is not sent;
- Cloudflare Turnstile on registration and password reset;
- a clear notice on the site that this is a demo and data may be deleted.

The owner has a Cloudflare account; deployment only needs the Turnstile widget keys.

Facts in the code today:

- Every message goes through one private function, `sendEmail` in `lib/mail.ts`. Its callers are
  `register`, `login` (resends verification to an unverified account), `settings` (e-mail change),
  `resetPassword` and the Stripe webhook (order confirmation).
- `sendEmail` never throws and returns nothing, so callers cannot tell whether a message went out.
- `getClientIp()` in `lib/rate-limit.ts` takes the first entry of `X-Forwarded-For`. The bundled nginx
  config appends to that header (`$proxy_add_x_forwarded_for`), so the first entry is whatever the
  client sent. Every per-IP limit can be bypassed by sending a fake header.

## Recommendation

Enforce all three limits inside `sendEmail`, because it is the only exit for e-mail, so no caller,
present or future, can skip them.

**Limits.**

| Limit | Redis key | Env variable | Default |
| :-- | :-- | :-- | :-- |
| Global | `mail:global` | `MAIL_DAILY_LIMIT` | 50 per 24 hours |
| Per recipient | `mail:to:<address>` | `MAIL_HOURLY_LIMIT_PER_ADDRESS` | 3 per hour |
| Per IP | `mail:ip:<ip>` | `MAIL_HOURLY_LIMIT_PER_IP` | 3 per hour |

- All three are checked before the template is rendered. If any one is exceeded, the message is not
  sent and the refusal is logged.
- The mail limiter **fails closed**: if Redis is unavailable, nothing is sent. The login limiter stays
  fail-open (ADR 0011), because a lost login hurts more than a lost e-mail.
- `sendEmail` returns whether the message was sent. `register`, `resetPassword`, `settings` and
  `login` tell the visitor when it was not ("We could not send the e-mail right now. Try again
  later."). The account itself is still created, and a later sign-in resends the verification e-mail
  within the limits.
- Order confirmations from the webhook have no visitor IP, so they count against the global and
  per-recipient limits only. The order is fulfilled either way, and the success page confirms it on
  screen.
- Both windows are fixed: "per day" means 24 hours from the first message in the window.
  `lib/rate-limit.ts` already implements this.

**Client IP.** `getClientIp()` reads only `X-Real-IP`, and the bundled nginx config sets it from
`$remote_addr`, overwriting anything the client sent. The deployment guide requires any other reverse
proxy to do the same. Behind Cloudflare, the proxy takes the value from `CF-Connecting-IP`. This also
fixes the per-IP login and registration limits.

**Turnstile.**

- The registration and forgot-password forms render the Turnstile widget. It loads Cloudflare's
  script, so no npm dependency is added.
- The site key is read at runtime from `TURNSTILE_SITE_KEY` and passed down from the server
  component, so it is not baked into the image at build time.
- `register` and `resetPassword` verify the token with Cloudflare's `siteverify` endpoint
  (`TURNSTILE_SECRET_KEY`, plus the client IP) before they touch the database or send anything. The
  check fails closed: if Cloudflare cannot be reached, the action fails.
- Local development, CI and E2E use Cloudflare's published test keys, which always pass.

**Notice.** The demo notice (ADR 0006) says that this is a demo and that data may be deleted at any
time. The registration form repeats it next to the submit button.

**SMTP.** Delivery stays on Nodemailer and SMTP. The owner chooses the provider and configures it at
deployment. The guide lists `SMTP_*` and `MAIL_FROM` as required, and recommends SPF and DKIM for the
sending domain. Mailpit stays in the local stack only.

## Alternatives considered

- **No outgoing e-mail in the demo** (the earlier proposal) — rejected by the owner.
- **Limits in each calling action** — every new caller would have to remember them, and the webhook
  path would be easy to miss.
- **A fail-open mail limiter, like the login limiter** — a Redis outage would remove every cap at once.
- **A calendar-day counter in Europe/Warsaw** — easier for the owner to read, but it needs new code,
  and like any fixed window it allows up to twice the cap around the boundary. The 24-hour window
  reuses `rateLimit()`.
- **Turnstile on the login form too** — the owner asked for registration and password reset. The
  verification resend at login is already bounded by the mail limits.

## Consequences

- New env variables: `MAIL_DAILY_LIMIT`, `MAIL_HOURLY_LIMIT_PER_ADDRESS`, `MAIL_HOURLY_LIMIT_PER_IP`
  (optional, with the defaults above), and `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (required in
  production). The environment reference and the deployment guide list them.
- `rateLimit()` gets a fail-closed variant for the mail limiter.
- Tests: unit tests for each limit, for the fail-closed path and for `sendEmail` returning `false`; an
  integration test that `register` with an invalid Turnstile token creates no user. The E2E e-mail
  spec runs with higher limits set in the test env.
- At the default cap, a stranger can send at most 3 e-mails per hour to one address and the whole demo
  at most 50 a day. That is the residual risk the limits leave.
