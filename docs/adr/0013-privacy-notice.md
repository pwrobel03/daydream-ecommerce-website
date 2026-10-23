# 0013. A privacy notice page describes the little visitor data the demo keeps

- Status: Proposed
- Date: 2026-10-23

## Context

The portfolio demo is public and runs in the EU, so visitors must be told what personal data is
processed, why, for how long and by whom. The data controller is the owner, whose details are filled in
at deployment.

With ADR 0009, 0011 and 0012 the demo stores no visitor accounts, e-mail addresses or delivery addresses.
What remains:

- IP addresses in rate-limit keys in Redis (`login:`, `register:`, `reset:`), expiring within an hour;
- the text of Voices visitors write, until the nightly reset;
- the session cookie (Auth.js) and the cart in `localStorage`, both strictly necessary;
- whatever a visitor types into Stripe's hosted Checkout (e-mail, cardholder name), processed by Stripe
  in the owner's test account;
- web server and application logs on the owner's server.

## Recommendation

Add a `/privacy` page in EN and PL, linked from the demo notice and the footer, with the controller's
name and contact read at runtime from `PRIVACY_CONTROLLER_NAME` and `PRIVACY_CONTACT_EMAIL`, because the
owner fills them in at deployment without a rebuild.

- Both variables are required in production, so the demo cannot go public without a controller.
- The page lists the data above, the purpose (operating the demo and protecting it from abuse), the
  legal basis (legitimate interest), retention (until the nightly reset; rate-limit keys within an
  hour; logs as set by the server administrator, recommended at most 14 days), Stripe as a recipient,
  and the visitor's rights with the contact address.
- No cookie consent banner: only strictly necessary storage is used, and the page says so.
- The text is reviewed by the owner before deployment; the code only renders it.

## Alternatives considered

- **Placeholder text in `messages/*.json`** — the owner would have to edit translations and rebuild the
  image to fill in their details.
- **Linking to the owner's portfolio privacy policy** — that policy does not describe this app's data.

## Consequences

- Adding analytics, OAuth or registration later means updating this page.
- The deployment guide recommends a log retention the notice can promise.
