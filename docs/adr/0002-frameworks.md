# 0002. We build on Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui and next-intl

- Status: Accepted
- Date: 2026-10-23

## Context

The application exists and uses Next.js 16 App Router with Cache Components and the React Compiler,
React 19, strict TypeScript, Tailwind CSS v4 with shadcn/ui and Radix, Zustand for the cart, Auth.js v5
and next-intl with the `en` and `pl` locales. The goal is hardening and deployment, not a rewrite.

## Recommendation

Keep the existing stack, because the goal is to harden what is there and every listed framework is
already wired through the whole codebase.

- Server Components by default; Client Components only where interaction needs them.
- `proxy.ts` (the Next.js 16 successor to `middleware.ts`) handles session gating and locale routing.
- All user-facing text exists in both `messages/en.json` and `messages/pl.json`.

## Alternatives considered

- **Replacing any part of the stack** — out of scope; no requirement asks for it.

## Consequences

- Upgrades within these frameworks are ordinary maintenance tasks, not architecture decisions.
- The visual redesign planned later works within Tailwind v4 and shadcn/ui.
