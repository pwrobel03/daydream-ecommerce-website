# 0015. Types at the server/client boundary are derived from the queries; lib/dto becomes lib/serialize

- Status: Proposed
- Date: 2026-10-23

## Context

`refactoring.md` ("What is not closed") leaves one item open: `lib/dto/` is a serialiser, not
per-aggregate mappers. Its only function, `toPlainDeep`, strips Prisma's symbol properties so results
can cross into Client Components. Money is already converted to `number` at the source by the client
extension in `lib/db.ts`, and the largest over-fetch went away with the ratings fix.

The owner's requirement: the type system must not lie about the runtime shape. Where it lies today is not
the serialiser but the hand-written interfaces in `types/product.ts` and `types/order.ts`: `Category`
carries optional `parentId`, `children` and `_count` for whichever query selected them, `OrderType`
declares `createdAt: Date | string`, and a few call sites cast (`as Review`).

## Recommendation

Keep the serialiser, rename it to `lib/serialize.ts`, and derive every type that crosses the boundary from
the query that produces it, because an inferred type cannot drift from the runtime shape while a mapper is
a second hand-written copy of it.

- Each read in `lib/db-*.ts` uses an explicit `select` (no broad `include`) and exports its result type,
  e.g. `export type CategoryWithProducts = NonNullable<Awaited<ReturnType<typeof getCategoryWithProducts>>>`.
  Types are inferred from the extended client, so `Decimal` is already `number` in them.
- Components import those types instead of `types/product.ts` and `types/order.ts`; the hand-written
  interfaces are deleted as their last user moves.
- `toPlainDeep` keeps returning `T`; `as` casts on its result are removed.
- A mapper is written only where the view needs a different shape than the row (a computed field such
  as `ratingAvg`), next to the read that needs it.

## Alternatives considered

- **Per-aggregate mappers (`toProductDTO`, `toOrderDTO`, …)** with explicit DTO types, as
  `refactoring.md` once recommended — an explicit contract, but every field is written twice (select and
  mapper) plus once in the DTO type, and a mapper's output type is just as hand-written as the
  interfaces that lie today. Worth it with several clients of the same data (a public API); Daydream has
  one.
- **Keep everything as it is and only rename** — leaves the lying interfaces in place.

## Consequences

- `types/product.ts` and `types/order.ts` shrink to what is not a query shape (`CartProduct`, which is
  persisted to `localStorage`).
- Changing a `select` changes the type, and the compiler points at every view that used a removed field.
- The work splits naturally by aggregate (catalogue, orders, Voices, back-office lists) into small tasks.
