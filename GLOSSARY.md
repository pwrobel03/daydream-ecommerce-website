# Daydream

Daydream is a full-stack ecommerce application deployed publicly as the owner's portfolio demo.
It sells nothing real and takes no real money.

## The demo

**Portfolio demo**:
The public deployment of Daydream, showing the owner's work. No real goods, no real money.
_Avoid_: Production shop, live store

**Demo mode**:
The runtime configuration of the portfolio demo: test Stripe keys only, a persistent demo notice,
admin writes blocked, data reset on a schedule. It is the only production configuration.
_Avoid_: Sandbox, read-only mode

**Demo notice**:
The persistent, non-dismissible banner on every page stating that this is a portfolio demo and not
a real shop, together with the test-card note on the checkout and payment screens.
_Avoid_: Disclaimer, cookie banner

**Demo reset**:
Restoring the database (and uploads) to the seed state on a schedule.
_Avoid_: Wipe, cleanup

**Demo account**:
One of the seeded accounts whose credentials are published on the site — the demo admin and the
demo customer.
_Avoid_: Test user, guest account

**Admin write**:
Any back-office action that changes data: creating, editing or deleting products, categories,
ingredients and reviews, and changing an order's status.
_Avoid_: Admin mutation, admin edit

**Seed state**:
The catalogue, demo accounts and sample orders and reviews produced by `prisma/seed.ts`.
_Avoid_: Fixtures, initial data

## Shop

**Reservation**:
Stock decremented for an unpaid order until it is paid or released.
_Avoid_: Hold, lock

**Back-office**:
The admin area under `/dashboard` that only `ADMIN` users reach.
_Avoid_: Admin panel, CMS

**Voice**:
A customer review of a product, with a rating and text.
_Avoid_: Comment, opinion
