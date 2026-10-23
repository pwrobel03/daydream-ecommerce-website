# 0012. The portfolio demo sends no e-mail

- Status: Proposed
- Date: 2026-10-23

## Context

The app sends verification, password-reset and order-confirmation e-mails through Nodemailer and SMTP
(`lib/mail.ts`); locally, Mailpit catches them. The public demo has no Mailpit, and the hard rule is that
the app never sends e-mail to arbitrary addresses typed in by strangers. With ADR 0011, registration and
password reset are off in the demo, which leaves only order confirmations to the demo customer.

## Recommendation

In demo mode `lib/mail.ts` uses Nodemailer's `jsonTransport`, which delivers nothing, and logs the
subject and template of every message instead, because no SMTP server means nothing can ever reach a
stranger's inbox, whatever the address.

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` and `MAIL_FROM` become optional in demo mode; production
  needs no mail account at all.
- The order success page already confirms the order on screen; nothing visible is lost.
- Outside demo mode (local development, E2E), mail goes to Mailpit as today.
- The production compose overlay no longer depends on Mailpit.

## Alternatives considered

- **Real SMTP limited to the demo accounts' addresses** — still needs a mail account, and the demo
  addresses are fictional, so nobody would read the mail.
- **An on-site "demo inbox" that shows the messages** — shows off the React Email templates, but adds a
  page, storage and its own privacy questions. Worth a separate task if the owner wants it.
- **Keeping Mailpit in production behind the proxy** — publishes a mail UI on the internet.

## Consequences

- An outage of mail can no longer affect the demo; `sendEmail` already never throws.
- A unit test checks that demo mode never builds an SMTP transport.
