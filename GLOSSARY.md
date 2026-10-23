# Daydream

Daydream is a full-stack ecommerce application deployed publicly as the owner's portfolio demo.
It sells nothing real and takes no real money.

## The demo

**Portfolio demo**:
The public deployment of Daydream, showing the owner's work. No real goods, no real money.
_Avoid_: Production shop, live store

**Demo mode**:
The runtime configuration of the portfolio demo: test Stripe keys only, a persistent demo notice,
a public read-only demo admin, capped outgoing e-mail, and a demo reset the owner runs by hand. It is
the only production configuration.
_Avoid_: Sandbox, read-only mode

**Demo notice**:
The persistent, non-dismissible banner on every page stating that this is a portfolio demo and not
a real shop, together with the test-card note on the checkout and payment screens.
_Avoid_: Disclaimer, cookie banner

**Demo reset**:
Restoring the database (and uploads) to the seed state, run by the owner by hand after a preview, a
database dump and an explicit confirmation. The private admin survives it.
_Avoid_: Wipe, cleanup

**Demo admin**:
The seeded back-office account whose credentials are published on the site. It can read the
back-office but change nothing, and it never sees visitors' personal data.
_Avoid_: Demo account, guest admin, test admin

**Private admin**:
The owner's back-office account with full rights, created at deployment by a script. Its credentials
are never published or seeded.
_Avoid_: Super admin, real admin

**Visitor account**:
An account a visitor registers for themselves, with their own e-mail address and delivery addresses.
The visitor can delete it from the account settings.
_Avoid_: Customer account, user (when the role matters)

**Mail limits**:
The hard caps on outgoing e-mail: a global daily cap and hourly caps per recipient address and per IP.
When any of them is reached, the e-mail is not sent.
_Avoid_: Throttling, quota

**Admin write**:
Any back-office action that changes data, allowed only to the private admin: creating, editing or deleting products, categories,
ingredients and reviews, and changing an order's status.
_Avoid_: Admin mutation, admin edit

**Seed state**:
The catalogue, the demo admin, and the sample customers, orders and reviews produced by
`prisma/seed.ts`.
_Avoid_: Fixtures, initial data

## Shop

**Reservation**:
Stock decremented for an unpaid order until it is paid or released.
_Avoid_: Hold, lock

**Back-office**:
The admin area under `/dashboard` that only the private admin and the demo admin reach.
_Avoid_: Admin panel, CMS

**Voice**:
A customer review of a product, with a rating and text.
_Avoid_: Comment, opinion
