# Refactoring log

Running log of code-quality findings. Newest section first within each dated
entry; entries are appended, never overwritten.

---

# 2026-08-10 — full-codebase pass after phases 0–5

Scope: `actions/`, `lib/`, `app/`, `components/`, `store.ts`. Reviewed after 43
commits of hardening and feature work. Formatting and lint-enforced style are
out of scope — lint is green and gated in CI.

**Summary:** 3 critical, 6 major, 5 minor.

**Status after the 2026-08-10 refactor commits** (`b3b5bc5`, `f369084`):
5 items resolved — the duplicated Stripe session, the hand-written ownership
checks, the three upload paths, the duplicated pricing rule, and the dead
`getActiveSaleByCouponCode`. Error reporting in the data layer is improved but
the empty-result returns remain. The three critical structural items are
deliberately untouched: they need an architectural decision first.

The security and correctness work from phases 1–3 holds up. What is left is
structural: the codebase has grown three separate conventions for the same
concerns (serialisation, action results, error swallowing) and never
consolidated them.

---

## [critical] Server/client serialisation is done three different ways — `lib/db-products.ts:31`

**Issue:** `JSON.parse(JSON.stringify(...))` appears in 5 places
(`db-products.ts:31,64,131`, `actions/admin/orders.ts:48`,
`actions/store/reviews.ts:73`), while other paths use explicit
`Number(x)` mappers, and `app/cart/delivery/[orderId]/page.tsx` converts field
by field inline. There is no DTO layer; `types/product.ts` documents the mess
rather than fixing it — `price: number | string`.

**Why it matters:** this is not stylistic. The round-trip turns `Decimal` into
`string` and `Date` into `string` while the TypeScript type keeps claiming
`Decimal`/`Date`, so the type system actively lies about the runtime shape.
Every new money or date field re-opens the same hole: adding
`Order.discountAmount` in the coupon work immediately leaked two fresh
`Decimal` objects into Client Components, and both were only caught because
Next logs a warning. It also serialises entire relation trees — the category
page round-trips every product with all its reviews and authors just to render
a grid.

**Recommendation:** introduce `lib/dto/` with explicit mappers per aggregate
(`toProductDTO`, `toOrderDTO`, `toReviewDTO`) returning types with `number` for
money and ISO `string` for dates. Delete the `JSON.parse(JSON.stringify(...))`
calls and the `number | string` unions once the mappers are the only crossing
point. This is the systemic fix for what §2.6 of `markdown/improvement.md`
tracks piecemeal.

## [critical] Server Actions have four incompatible return contracts — `actions/order/order.ts:25`

**Issue:** actions return `{ error: string }`, `{ success: true, orderId }`,
`{ url: string, error: null }`, `{ url: null, error: string }` and
`{ success: string }` — the last using `success` as a *message*, not a flag.
`lib/action-result.ts` was written to unify this and is imported by nothing
(`ActionResult`, `ok`, `fail` have zero call sites).

**Why it matters:** callers cannot tell success from failure without knowing
each action individually. `app/[locale]/cart/page.tsx` checks `res.error`;
`components/cart/delivery-client.tsx` checks `res.url`. Nothing stops a new
action from inventing a fifth shape, and nothing catches it — a discriminated
union would make the compiler do that. The abstraction already exists and is
dead code, which is worse than not having written it: it signals a convention
that isn't followed.

**Recommendation:** adopt `ActionResult<T>` across `actions/` and update the
call sites, or delete `lib/action-result.ts`. Leaving an unused abstraction in
place is the one option with no upside.

> **Resolved (`9a3c081`, `695d0a8`, `dd54bc3`)**: all 21 mutations return
> `ActionResult<T>`. Reads (`getCategories`, `getVoices`, `getMoreReviews`, …)
> deliberately do not — they return data, not the outcome of an operation.
> `ActionError` carries an `ErrorCode` across a `throw`, which the guards and
> the in-transaction stock and coupon checks need.
>
> Acting on this found three live defects: `createReview` took `userId` from
> the client payload, and `updateReview`/`deleteReview` matched on review id
> without an owner predicate. It also removed ten hardcoded English strings
> that were being returned from the server in an otherwise translated app.

## [critical] Errors are swallowed into empty results across the data layer — `lib/db-products.ts:33`

**Issue:** six `catch` blocks in `lib/db-products.ts` and `lib/db-categories.ts`
return `[]`, `null` or `0` after a `console.error`. `lib/db-search.ts:33` does
the same.

**Why it matters:** a database outage renders as an empty catalogue rather than
an error, so the shop silently shows "no products" instead of failing visibly.
Monitoring sees HTTP 200. This is the same failure mode as the rate limiter's
silent fail-open, which went unnoticed until an E2E run surfaced it — and the
fix there (report through `reportError`, not `console.error`) has not been
applied here.

**Recommendation:** let these throw and handle them at the route boundary with
`error.tsx`, which now exists. Where an empty result genuinely is the right
answer, distinguish it from failure in the return type rather than by an empty
array.

> **Resolved (`20ffd5d`)**, after a decision on what a visitor should see: the
> catalogue queries no longer catch, so `null` means "no such row" — which the
> callers already turn into `notFound()` — and a failure reaches `error.tsx`
> and a 5xx. `lib/db-search.ts` keeps its catch on purpose: a typo during a
> brief hiccup should show "no results", not take down the search screen.
> A unit test pins both directions.

> **Partially addressed (`f369084`)**: all 22 `console.error` calls are now
> `reportError` with an `area` tag, so failures are visible in structured logs.
> The empty-result returns are unchanged — making them throw alters what a
> visitor sees during an outage and is bundled with the DTO decision.


## [major] `actions/order/order.ts` is a 303-line module with four responsibilities

> **Partially addressed (`b3b5bc5`)**: the duplicated Stripe session construction
> is extracted to `lib/checkout-session.ts`, and the file is down to 224 lines.
> Extracting the rest into `lib/checkout/` is still open and still architectural.
>
> Acting on this found a live bug: `recreateStripeSession` rebuilt line items
> without applying `order.discountAmount`, so retrying an interrupted payment
> charged the full price and silently dropped the coupon. Covered by a
> regression test.

**Issue:** stock reservation, coupon validation, address persistence, Stripe
session creation and payment retry all live in one file. The Stripe session is
constructed twice, ~25 duplicated lines apart (`:224` and `:274`), differing
only in `expires_at` and `cancel_url`.

**Why it matters:** this is the highest-risk file in the codebase — three of the
phase 1 defects were here. Duplicated session construction is exactly how the
`payment_intent_data.metadata` fix nearly missed the second call site. Testing
requires standing up the whole flow because there are no seams.

**Recommendation:** extract `lib/checkout/` with `reserveStock`, `applyCoupon`
and `createPaymentSession(order, { cancelUrl })`. The actions become thin
orchestration. Splitting a payment path is an architectural change — route it
through the decision gate before acting.

> **Rejected, deliberately.** `createPaymentSession` is already extracted, which
> was the duplication that mattered. Splitting `reserveStock` and `applyCoupon`
> out of `initializeOrder` would move them out of the `$transaction` callback
> that makes the stock check atomic — the seam is exactly where the correctness
> guarantee lives. The remaining 224 lines are one coherent flow with
> integration coverage on every branch. Revisit only if a second caller appears.

## [major] Image upload is duplicated between two admin actions — `actions/admin/inventory.ts:176`

**Issue:** `inventory.ts` and `ingredients.ts` each carry their own
sharp-resize-convert-save pipeline with slightly different parameters
(1200×1200 vs. its own), and category upload writes a raw buffer with no
processing at all.

**Why it matters:** three upload paths, three sets of behaviour. The category
path skips sharp entirely, so an admin can upload a 12 MB PNG that is served
unprocessed. A change to storage — the very thing phase 3 just did — has to be
made in three places and was.

**Recommendation:** one `lib/uploads.ts` helper —
`processAndStore(file, { dir, maxSize })` — used by all three.

> **Resolved (`f369084`)**: `processAndStore` in `lib/uploads.ts`. The category
> path, which bypassed sharp entirely, now goes through the same pipeline.


## [major] `product-form.tsx` is 550 lines of mixed concerns

**Issue:** one client component holds form state, image preview state, file
upload handling, `FormData` construction, submission and the entire multi-section
layout.

**Why it matters:** it is the single largest file in the app and cannot be
tested without rendering all of it. It also had 16 of the 77 lint errors, all
from one unaddressed typing problem — a symptom of nobody wanting to open it.

**Recommendation:** extract `useProductForm` for state and submission, and split
the layout into `ProductBasicsSection`, `ProductPricingSection`,
`ProductImagesSection`. No behaviour change.

> **Resolved (`c8e3074`)**: `useProductForm` plus four sections; the shell is
> 63 lines. Two deliberate behaviour changes: the promo-price check runs before
> `FormData` is built rather than after, and the file-size messages are
> translated. Covered by a new E2E spec — the file had no tests, so the split
> would otherwise have rested on the compiler alone.
>
> Writing that spec surfaced two defects of its own: the dashboard sidebar
> resolved four nav labels to objects and rendered raw key paths (`2becac2`),
> and `tests/e2e/seed.ts` re-ran its `deleteMany()` on every import of its
> constants, which is what made `checkout.spec` fail intermittently
> (`cc60c8e`).

## [major] Order ownership is re-checked ad hoc in three places — `actions/order/order.ts:112`

**Issue:** `userId: session.user.id` appears as a query predicate at `:112`,
`:153` and `:263`, each written slightly differently (`session.user.id!`,
`session.user!.id`, `sessionAuth.user.id`).

**Why it matters:** this is the exact shape of the IDOR fixed in phase 1 —
`finalizeAndPay` was missing the predicate while `recreateStripeSession` had it.
Three hand-written copies of a security check is three chances to omit the
fourth.

**Recommendation:** a single `requireOwnedOrder(orderId, { status })` in
`lib/guards.ts`, alongside `requireAdmin`, that throws when the order is not the
caller's. One place to audit.

> **Resolved (`b3b5bc5`)**: `requireOwnedOrder` in `lib/guards.ts`.


## [major] Admin lists fetch from client effects, creating a request waterfall — `inventory-client.tsx:61`

**Issue:** `inventory-client.tsx`, `comments/page.tsx` and `category-list.tsx`
are Client Components that fetch through Server Actions inside `useEffect`.

**Why it matters:** the page shell renders, then a second round trip fetches the
data, so nothing appears until two sequential requests complete. The app now has
Suspense boundaries everywhere else and streams properly; these three are the
remaining exception, and they are also the reason for three
`eslint-disable react-hooks/set-state-in-effect` comments.

**Recommendation:** fetch on the server, pass data as props, and drive
search/filter state through `searchParams` rather than component state. Removes
the effects and the disables together.

> **Resolved (`11916fd`, `6f5eb5d`, and `category-list.tsx` in `dd54bc3`)**:
> all three render on the server. Queries moved to `lib/db-reviews.ts` and
> `lib/db-inventory.ts`; filters and paging live in `searchParams`, so they
> survive a reload and can be linked. `getVoices` and `getInventoryProducts`
> were Server Actions — reads exposed as POST endpoints — and are deleted.
>
> This also closed the `toPlainDeep` gap on the inventory page and the
> blocking-route warning on `inventory/[productId]`, and it is what surfaced
> the shared-login rate-limit problem in the E2E suite (`af7bb37`).

## [major] Empty-catch pattern hides upload failures — `actions/admin/inventory.ts`

**Issue:** the delete-old-images loop catches per-file errors and continues,
logging nothing actionable; `lib/uploads.ts:deleteUpload` does the same.

**Why it matters:** orphaned files accumulate on the volume with no signal.
Nobody discovers it until the disk fills — which this project has already
experienced from a different cause.

**Recommendation:** report through `reportError` with the failing path so it is
visible, and consider a periodic reconciliation against `ProductImage` rows.

## [minor] Dead exports left in the data layer — `lib/db-sales.ts:4`

**Issue:** `getActiveSaleByCouponCode` has no call sites — coupon validation was
implemented inline in `initializeOrder`. `getTotalProductsCount` and
`getAllProductsAsCategory` are each referenced from one place only.

**Why it matters:** a reader looking for coupon logic finds a plausible-looking
helper that nothing uses, and may extend the wrong one.

**Recommendation:** delete `getActiveSaleByCouponCode`, or use it from
`initializeOrder` instead of the inline query.

> **Resolved (`f369084`)**: `getActiveSaleByCouponCode` deleted.


## [minor] `errorMessage` helper lives in the wrong module — `lib/action-result.ts:32`

**Issue:** it was appended to `action-result.ts` because that file already
existed, but it has nothing to do with action results and is the only thing in
that module actually imported.

**Recommendation:** move to `lib/errors.ts` alongside `reportError`, or into
`lib/logger.ts`.

> **Resolved (`83fe0cc`)**: moved to `lib/logger.ts`.

## [minor] `store.ts` mixes cart state with pricing rules

**Issue:** `getTotalPrice` and `getSubTotalPrice` encode the promo-price rule
(`promoPrice ?? price`) inside the Zustand store, while `initializeOrder`
encodes the same rule server-side.

**Why it matters:** two implementations of one business rule. The `promoPrice: 0`
bug existed in the client copy only — the server was already correct, so the cart
displayed one total and the order was created with another.

**Recommendation:** extract `activePrice(product)` into `lib/pricing.ts` and use
it from both. Small, and it removes a class of divergence that has already
produced one bug.

> **Resolved (`f369084`)**: `activePrice` / `basePrice` in `lib/pricing.ts`.


## [minor] `types/product.ts` and `types/order.ts` describe query shapes, not the domain

**Issue:** `Category` carries optional `parentId`, `children` and `_count`
because some queries select them and others do not; `OrderItemType.product` has
an index signature to absorb whatever a given `select` returned.

**Why it matters:** the types describe the union of every call site rather than
a domain concept, so they cannot catch a caller passing the wrong shape — which
is what types are for.

**Recommendation:** narrow per use case (`CategoryListItem`, `CategoryWithCount`)
once the DTO layer exists; they fall out of it naturally.

## [minor] Two upload-serving paths coexist — `lib/uploads.ts:60`

**Issue:** `deleteUpload` resolves both `/uploads/...` (current) and legacy
`/products/...` paths under `public/`, deliberately, to avoid a data migration.

**Why it matters:** the compatibility branch is untested and will quietly become
permanent. New rows only ever use the new scheme.

**Recommendation:** write the one-off migration that rewrites existing
`ProductImage.url`, `Category.image` and `Ingredient.image` values, then delete
the branch.

> **Partially addressed (`a6b9bff`)**: `scripts/migrate-uploads.ts` moves the
> files and rewrites the rows; idempotent, with `--dry-run`, verified against a
> seeded database. The branch stays until the script has run on an instance —
> deleting it first would orphan images that are still referenced. The
> deliberate `/static/` exclusion now has a test.

---

## Not flagged, deliberately

- **Polish comments in an English codebase.** Consistent, intentional, and the
  working language of the maintainer. Not a defect.
- **`catch (error: any)` remnants.** None remain; lint gates this now.
- **Duplicated `requireAdmin` calls across admin actions.** Repetition here is
  correct — each action is independently reachable and must guard itself.
- **`app/[locale]` route restructure.** Verified working in both locales with
  E2E coverage.


---

# 2026-08-11 — open after the ActionResult pass

Lint reported 4 errors in files this work did not touch —
`components/discount-banner.tsx` (refs read during render, ×2),
`components/ui/carousel.tsx` and `hooks/use-cart-store-safe.ts`
(set-state-in-effect). They predated this branch and came from the React
Compiler lint rules, not from the refactor.

> **Resolved (`fix/react-compiler-lint`)**: `useCartStoreSafe` had zero call
> sites and was deleted rather than fixed. `discount-banner.tsx` holds the
> Autoplay plugin in a lazily-initialised `useState` instead of a ref, which
> is equally one-shot but legal to read during render. The `carousel.tsx`
> case is genuine — the embla instance does not exist until after mount — so
> it carries a documented disable. Lint is back to 0 errors.

Still open from the 2026-08-10 list: query-shaped types in `types/`, which
only pay off once the DTO layer is fleshed out beyond `toPlain`/`toPlainDeep`,
and deleting the legacy upload branch once the migration script has run.

The admin inventory page passes raw Prisma rows to `ProductForm`, which logs
"Only plain objects can be passed to Client Components" on every visit — the
new E2E spec is what made it visible. It belongs with the remaining `lib/dto/`
work rather than with the form split.

---

# 2026-08-11 — second full pass, after 61 commits

Scope: whole codebase, with attention to what the previous work did not touch —
`store.ts`, `types/`, `components/product*`, the API routes, `proxy.ts`, the
auth layer and the order screens. Generated Prisma output and vendored shadcn
UI are excluded.

**Summary: 1 critical, 5 major, 5 minor — all resolved (`41dedbc`, `a6ce75c`,
`d335adf`, `982119e`).**

Verified as sound, so not re-listed: the authorization layering (`proxy.ts`
guards the route, `(admin)/layout.tsx` guards the role with `NotAllowedView`,
each query guards itself again), the cron endpoint's `timingSafeEqual`
comparison, `releaseOrderReservation`'s conditional-update idempotency, and the
path-traversal guard on the uploads route.

## [critical] Ratings are averaged over whichever rows happen to be loaded — `components/product-card/ProductCard.tsx:23`

**Issue:** three places compute a rating average from the reviews present in
memory rather than from an aggregate: the card (`:23`), the product page's
structured data (`app/[locale]/product/[slug]/page.tsx:53`) and the reviews
section (`components/product/reviews-section.tsx:39`). `getProductBySlug`
fetches `take: 9` reviews and, separately, excludes the signed-in user's own
review from that set.

**Why it matters:** for any product with more than nine reviews the star rating
shown to visitors is the average of the nine most recent ones, not of all. The
same numbers go into the `aggregateRating` block of the JSON-LD served to
search engines, where `reviewCount` reports at most 9 regardless of the real
total — and because the current user's review is filtered out, the structured
data changes depending on who is logged in. Publishing an aggregate that
disagrees with the visible review count is exactly what rich-result validation
flags. The E2E suite asserts the JSON-LD *exists*, not that it is right, so
nothing catches this.

**Recommendation:** compute it in the database —
`db.review.aggregate({ where: { productId }, _avg: { rating }, _count: true })` —
and pass `ratingAvg` / `ratingCount` down as data. On the category grid that
also removes the need to ship review rows at all (see the over-fetch note
below). If the catalogue grows, denormalise both onto `Product` and refresh
them in the review mutations.

## [major] A replaced ingredient image is cached as immutable for a year — `app/uploads/[...path]/route.ts:49`

**Issue:** the uploads route sends `Cache-Control: public, max-age=31536000,
immutable`, justified by a comment saying filenames are UUIDs. That holds for
products (`crypto.randomUUID()`) and categories (`Date.now()`-prefixed), but
`actions/admin/ingredients.ts:44` uses `fileName: ingredientId` — a stable name.

**Why it matters:** editing an ingredient's image overwrites the same URL, and
every browser and proxy that has seen it will keep serving the old picture for
a year. `immutable` specifically tells clients not to revalidate even on a
forced reload. The admin sees the change locally and has no way to tell that
visitors do not.

**Recommendation:** give the ingredient upload a fresh name per write, like
the other two paths. That keeps one cache policy for the whole route instead
of special-casing it.

## [major] Deleting a product leaves its images on disk forever — `actions/admin/inventory.ts:9`

**Issue:** `deleteProduct` removes the row and nothing else; the
`// TODO: handle removing images connected with product` above it says so.
`upsertProduct` does clean up replaced images, so the gap is only on delete.

**Why it matters:** the upload directory is a volume that nothing prunes, so
every deleted product leaks its files permanently. This project has already
lost a working day to a full disk from an unrelated cause; this is the same
failure mode with a slow fuse and no signal until it happens.

**Recommendation:** read the `ProductImage` rows before the delete and pass
each through `deleteUpload`, reporting failures rather than swallowing them.
The relation cascade already removes the rows, so only the files are missing.

## [major] `getAdminOrders` is the last read still shaped as a Server Action — `actions/admin/orders.ts:13`

**Issue:** it is called from a Server Component but carries `"use server"`, so
a plain read is published as a POST endpoint. It also swallows every failure
into `{ orders: [], totalPages: 0 }`, and its comment — "Serializacja: usuwamy
obiekty Decimal i Date" — describes work the code does not do: the rows go to a
Client Component unprocessed, with no `toPlainDeep`.

**Why it matters:** the two sibling reads were moved to `lib/db-reviews.ts` and
`lib/db-inventory.ts` in this same pass, so the codebase now has two
conventions for the same thing and a newcomer will copy whichever they meet
first. The swallowed error contradicts the contract just established for the
catalogue: a database outage renders the orders terminal as "Active Records: 0"
with HTTP 200. The comment is worse than no comment, because it claims a
guarantee that is not there.

**Recommendation:** move it to `lib/db-orders.ts`, drop the `catch`, run the
rows through `toPlainDeep`, and delete the comment.

## [major] The cart persists whole product aggregates in localStorage — `store.ts:7`

**Issue:** `CartItem.product` is a full `ProductType`, so every cart entry
persists the product's description, categories, ingredients, images *and its
review list with authors* under the `cart-store` key.

**Why it matters:** a three-item cart can carry tens of kilobytes of stale
relations that nothing on the cart screen reads, and the data ages
indefinitely — `syncItems` only refreshes price, name and stock. A product
deleted server-side is never returned by `getFreshCartData`, so its item stays
in the cart untouched forever; `initializeOrder` then rejects the whole
checkout with "product unavailable" and the customer has no indication which
line to remove. That is a dead end reachable by ordinary use.

**Recommendation:** persist `{ productId, quantity }` plus the small snapshot
the cart actually renders, and have `syncItems` drop items the server did not
return, surfacing what it removed.

## [major] `getFreshCartData` reports an outage as "nothing changed" — `actions/store/sync-cart.ts:27`

**Issue:** the catch returns `[]`, which `syncItems` treats as "no product
needed updating".

**Why it matters:** the cart page shows "verifying stock", then proceeds with
whatever prices localStorage held, possibly months old. This is the pattern
that was just removed from the catalogue queries by decision, so leaving it
here is an inconsistency rather than an oversight — and it sits on the money
path, where stale prices matter most.

**Recommendation:** let it throw and let the cart's error boundary handle it,
or return a discriminated result so the page can say the check failed instead
of implying it passed.

## [minor] A debug log ships to production on every cart render — `components/cart/product-card.tsx:30`

**Issue:** `console.log(item)` at the top of the component body.

**Recommendation:** delete it. `app/[locale]/(protected)/dashboard/_components/category-form.tsx:96`
similarly uses `console.error` where every other path now reports through
`reportError`.

## [minor] Prices are formatted as en-US in a bilingual app — `components/PriceFormatter.tsx:9`

**Issue:** `toLocaleString("en-US", …)` is hardcoded, so the Polish site shows
US grouping and symbol placement. `new Number(amount)` also wraps in a `Number`
object rather than converting, and `amount: number | undefined` renders
literal `$NaN` when undefined.

**Recommendation:** use next-intl's `useFormatter().number(amount, { style:
"currency", currency: "USD" })` so it follows the active locale, and make
`amount` required.

## [minor] `lib/dto/` is not a DTO layer — `lib/dto/index.ts:16`

**Issue:** the module strips symbol properties and nothing more; `toPlain` (the
shallow variant) has no call sites at all. The 2026-08-10 recommendation was
per-aggregate mappers (`toProductDTO`, `toOrderDTO`), which would also bound
what crosses the boundary.

**Why it matters:** the name promises a mapping layer that is not there, and
the over-fetch it was supposed to fix remains: the category page still ships
every product's full review list, with each author, to render a grid of cards.

**Recommendation:** delete the unused `toPlain`, and either rename the module
to what it does (`lib/serialize.ts`) or grow the mappers. Doing the ratings fix
above removes the largest over-fetch on its own.

## [minor] `OrderItemType.product` keeps an index signature — `types/order.ts:22`

**Issue:** `[key: string]: unknown` absorbs whatever a given `select` returned.
The product and inventory types were narrowed in this round; this one was not.

**Recommendation:** narrow per use case now that the pattern is established.

## [minor] `sendEmail` is exported but only used inside its own module — `lib/mail.ts`

**Recommendation:** drop the `export` unless a caller is planned; it currently
reads as public API.


---

## Status of the 2026-08-11 findings

All eleven are addressed. Notes on the three where the fix went beyond the
recommendation:

- **Ratings** (`41dedbc`): the aggregate moved into the database, and the
  catalogue queries stopped selecting reviews altogether — they were being
  fetched, serialised and shipped to the browser with their authors purely to
  compute one number per card. The E2E seed grew to 14 reviews so the test sits
  above the `take: 9` threshold; below it, it cannot tell the fix from the bug.
  Verified by restoring the old computation and watching it fail.

- **Cart** (`d335adf`): alongside the narrow `CartProduct`, `syncItems` now
  drops products the server no longer returns and names them. The existing unit
  test asserted the opposite — it pinned the bug in place — and now asserts the
  new behaviour with an explanation. `migrateCart` is exported so carts saved
  before the change are covered by a test rather than by hope.

- **Uploads** (`a6ce75c`): the ingredient filename and the delete-time leak
  were one commit, since both concern the same volume. Covered by an
  integration test against a real database and a real upload directory,
  including a missing-file case — a broken path must not make a product
  undeletable.

Still open, and deliberately so: the legacy `deleteUpload` branch stays until
`scripts/migrate-uploads.ts` has run on an instance.
