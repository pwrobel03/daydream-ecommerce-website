# 0008. Order of work and scope of the portfolio-demo goal

- Status: Accepted
- Date: 2026-10-23

## Context

CI on `main` fails: two E2E tests in `tests/e2e/a11y.spec.ts` report WCAG `color-contrast` on
`.z-10 > span` and `.group-hover:text-white > span`. `README.md` (Project Status) and
`docs/en/features.md` (Known limitations) describe problems that are already fixed. The owner also finds
the current look too loud but wants that handled separately.

## Recommendation

Work in this order, because a red CI blocks every later change and deployment only makes sense once the
demo is safe to publish:

1. **CI fix** — first task: make the two `color-contrast` tests pass. Colours change as little as needed
   to meet WCAG AA; no owner review of the visual result is needed for this task.
2. **Payments and demo mode** — ADR 0005, 0006, 0009–0013.
3. **Architecture** — the DTO decision (ADR 0015).
4. **Deployment readiness** — ADR 0007, 0010, 0014.

Out of scope for this goal: real payments and live keys, migrating to Drizzle, deploying or provisioning,
choosing the host or domain, TLS on the real server, and the **visual redesign**. The redesign is the next
goal, defined in a separate interview with the owner; its changes will go through owner review.

## Alternatives considered

- **Redesign alongside the hardening** — mixes subjective visual changes into reviews of safety work.

## Consequences

- Visual changes in this goal are limited to what accessibility requires.
- Task proposals follow this order; later tasks may depend on earlier ones.
