# 0003. Mutations are Server Actions returning ActionResult; reads return data

- Status: Accepted
- Date: 2026-10-23

## Context

Server Actions used to return four incompatible shapes (`refactoring.md`, 2026-08-10). They now all
return `ActionResult<T>` from `lib/action-result.ts`. Reads moved out of actions into `lib/db-*.ts`
and return data directly.

## Recommendation

Every mutation is a Server Action under `actions/<domain>/` that returns `ActionResult<T>`, because a
single contract lets every form handle success and failure the same way.

- `ok(data)` and `fail(code, message)` build results; `ActionError` thrown by guards is converted by the
  action into a `fail` result.
- Server Actions are public POST endpoints: authorization (`requireAdmin`, `requireOwnedOrder`, the demo
  write guard) is checked inside each action, never only in a layout or `proxy.ts`.
- Reads are plain async functions in `lib/db-*.ts`, called from Server Components.

## Alternatives considered

- **Route handlers (REST) for mutations** — more boilerplate, loses progressive enhancement of forms.
- **Throwing from actions** — the client cannot tell a validation error from a crash.

## Consequences

- New mutations follow the same contract; a reviewer rejects any other return shape.
- Route handlers stay only for machine callers: the Stripe webhook, cron, health and Auth.js.
