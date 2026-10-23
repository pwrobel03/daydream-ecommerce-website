# 0004. Data-layer reads throw and are handled by the route's error.tsx

- Status: Accepted
- Date: 2026-10-23

## Context

The data layer used to catch database errors and return empty results, so an outage rendered an empty
catalogue with HTTP 200 and monitoring saw nothing. That was fixed: catalogue reads now throw.

## Recommendation

Reads in `lib/db-*.ts` do not catch: `null` means "no such record" and the caller turns it into
`notFound()`, while a failure propagates to the route's `error.tsx`, because a visible error page is
the only honest response to an outage.

- `lib/db-search.ts` keeps its catch on purpose: a failing search degrades to "no results" instead of
  breaking the page that hosts the search box.
- Errors are reported through `reportError` in `lib/logger.ts`.

## Alternatives considered

- **Catch and return empty results** — hides outages; rejected by experience.
- **A result type for reads too** — every page would repeat the same failure branch that `error.tsx`
  already provides.

## Consequences

- Each route segment that reads data needs an `error.tsx` in reach.
- The health check (`/api/health`) and the error pages are what monitoring watches.
