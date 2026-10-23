# 0013. A privacy notice page describes the visitor data the demo keeps

- Status: Accepted
- Date: 2026-10-23

## Context

The portfolio demo is public and runs in the EU, so visitors must be told what personal data is
processed, why, for how long and by whom. The data controller is the owner, whose details are filled in
at deployment.

With full customer functionality (ADR 0009, 0011, 0012), the demo keeps:

- **accounts:** name, e-mail address, password hash, verification date, and the provider account ID
  if OAuth is enabled;
- **addresses and orders:** full name, street, city, postal code, phone, and the order history;
- **Voices:** the text and rating, public on the product page with the author's name;
- **unverified registrations:** an e-mail address typed in by someone who may not own it;
- **rate-limit and mail counters in Redis:** keys containing IP addresses and e-mail addresses, which
  expire within an hour;
- **processors:** Stripe (what a visitor types into the hosted Checkout), Cloudflare Turnstile (IP
  address and browser signals on the registration and reset forms), and the SMTP provider (the
  recipient's address and the message);
- **backups**, including the pre-reset dump (ADR 0010, 0014);
- **logs** on the owner's server; failed e-mails are logged with the recipient's address.

## Recommendation

Add a `/privacy` page in EN and PL, linked from the demo notice, the registration form and the footer.
The controller's name and contact, and the name of the SMTP provider, are read at runtime from
`PRIVACY_CONTROLLER_NAME`, `PRIVACY_CONTACT_EMAIL` and `PRIVACY_EMAIL_PROVIDER`, because the owner
fills them in at deployment without a rebuild.

- All three variables are required in production, so the demo cannot go public without a controller.
- **Purposes and legal basis:** running the account and the test orders the visitor asked for
  (Art. 6(1)(b) GDPR); protecting the demo from abuse with limits, CAPTCHA and logs (Art. 6(1)(f)).
- **Retention:**
  - accounts, addresses, orders and Voices: until the visitor deletes the account, or until the owner
    runs a demo reset, whichever comes first. The page says plainly that the demo may delete data at
    any time;
  - unverified registrations: deleted 24 hours after creation, by the existing
    `release-reservations` cron route, so that an address typed in by a stranger does not stay;
  - Redis counters: within an hour;
  - backups: as set in ADR 0014 (7 days);
  - logs: as set by the server administrator; the guide recommends at most 14 days.
- **Rights:** self-service deletion in the account settings (ADR 0011); access, correction and the
  other rights through the contact address.
- **Recipients:** Stripe, Cloudflare and the SMTP provider, each named on the page.
- **The public demo admin** sees none of this data (ADR 0009), and the page says so.
- **No cookie consent banner:** only strictly necessary storage is used (the Auth.js session cookie,
  the cart in `localStorage`, and Turnstile for security), and the page says so.
- The owner reviews the text before deployment; the code only renders it.

## Alternatives considered

- **Placeholder text in `messages/*.json`** — the owner would have to edit translations and rebuild the
  image to fill in their details.
- **Linking to the owner's portfolio privacy policy** — that policy does not describe this app's data.
- **Keeping unverified registrations until a reset** — the simplest option, but it keeps addresses
  of people who never signed up.

## Consequences

- The unverified-account clean-up is new behaviour in an existing route and needs an integration test.
- Adding analytics, OAuth or another processor later means updating this page.
- The deployment guide recommends a log retention the notice can promise.
