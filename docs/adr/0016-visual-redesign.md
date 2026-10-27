# 0016. The redesign gives the storefront a display face and quiets everything else

- Status: Proposed
- Date: 2026-10-26

## Context

The owner finds the current look too loud (ADR 0008 left the redesign to a separate goal). The audit in
issue #86 found the causes: `font-black`, `uppercase`, wide tracking and synthesised italics on almost
every element, headings up to `text-9xl`, radii of 2–3rem with `shadow-2xl` and blur as decoration, copy
written as a sci-fi console ("Identity Vault", `SYSTEM_LOGIN`, "Archive Empty / Sector Clear"), claims that
are not true for a demo (express EU shipping, 100% organic), and strings hard-coded in English.

The owner decided in #86:

- **Direction:** a new look for the storefront; a quiet back-office.
- **Scope:** every screen (storefront, auth, account, back-office). The e-mail templates keep their look
  until a later goal.
- **Copy:** plain, sentence-case copy everywhere, untrue claims removed, every string in both locales.
- **Type:** Geist for the interface plus one display face for storefront headings; the back-office uses
  Geist only.
- **Colour:** restrained — warm tinted neutrals, olive only for actions, selection and status.
- **Motion:** functional only.

Settled constraints: WCAG AA and the specs in `tests/e2e/a11y.spec.ts` are not weakened (CONTRIBUTING),
shadcn/ui and Tailwind v4 stay (ADR 0002), both locales and both themes stay, and every change goes through
owner review with before/after screenshots (ADR 0008).

## Recommendation

Set the storefront's product names and headings in **Young Serif**, the way a small-batch label names
what is in the jar, and keep every other element quiet Geist, because one deliberate element reads as
character while the rest of the page stays easy to use. The rules below are the contract every redesign
task follows; each names the guidance it comes from.

### Surfaces

Each surface has one job, and the job sets how much expression it gets (`impeccable`, visitor modes):

| Surface | Mode | Expression |
| --- | --- | --- |
| Home, product page | Persuade | Display face, generous space, product images carry the colour |
| Catalogue, search, cart, checkout, auth, account | Operate | Display face for the page title only; the rest is interface type |
| Back-office | Operate | Geist only, denser spacing, no display face |
| Privacy notice | Read | Display face for the title; body set for reading |

### Typography

- **Faces.** Young Serif 400 (its only weight) for display roles on the storefront; Geist for everything
  else; Geist Mono only where a value must align by character, such as order numbers. Both faces load the
  `latin-ext` subset, which carries the Polish letters. A Tailwind theme token `--font-display` names the
  display face. (`frontend-design`: one or two families, clearly distinct; `impeccable` new-work: Young
  Serif is outside the overused defaults.)
- **Scale.** Steps from the classical scale (`frontend-design`, *The Elements of Typographic Style*):

  | Role | Face | Size / line height | Where |
  | --- | --- | --- | --- |
  | Display | Young Serif | 36px → 60px fluid (`clamp(2.25rem, 1.5rem + 3vw, 3.75rem)`) / 1.05 | Home hero only |
  | Page title | Young Serif (storefront) or Geist 600 (back-office) | 36px / 1.1 storefront, 24px / 1.25 back-office | One per page |
  | Section title | Young Serif or Geist 600 | 24px / 1.2 storefront, 18px / 1.35 back-office | |
  | Item title | Geist 500 | 16px / 1.4 | Product cards, list rows |
  | Body | Geist 400 | 16px / 1.5 | Default |
  | Small | Geist 400 or 500 | 14px / 1.45 | Labels, table cells, metadata |
  | Caption | Geist 400 | 12px / 1.4 | Legal lines, chart axes; never smaller |

  Nothing is larger than 60px. `text-7xl` and above, and repeated text used as a watermark, are removed.
- **Weights.** Geist 400, 500 and 600 only. No `font-bold`, `font-extrabold` or `font-black`. Emphasis
  comes from weight 500–600 or size, never from a colour change on a single word. (`impeccable` quieter:
  900 → 600, 700 → 500.)
- **Case and slant.** Sentence case everywhere, in both locales. No `uppercase` on labels, buttons,
  headings or table headers; no `italic` (Geist has no italic, so the browser fakes it). No wide tracking:
  display sizes use `tracking-tight` (−0.01em to −0.02em), everything else the face's default.
  (`frontend-design`: no all-caps labels, no labels above content.)
- **Reading.** Prose (privacy notice, product description, reviews) is held to `max-w-[65ch]`. Headings
  use `text-wrap: balance`, body copy `text-wrap: pretty`. (`impeccable` typeset.)
- **Numbers.** Prices, quantities, stock counts, table columns and chart labels use `tabular-nums`.
  (`impeccable` typeset.)

### Colour

Tinted neutrals do the work; olive marks what can be acted on, what is selected and positive status. No
gradients, glows or coloured shadows. (`impeccable` new-work, Restrained strategy; `impeccable` quieter:
neutral dominance, tinted greys.)

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#FAF8F3` | `#1B1916` |
| `--foreground` | `#27221D` | `#ECE8E0` |
| `--card`, `--popover` | `#FFFFFF` | `#23211D` |
| `--muted`, `--secondary` | `#F0EDE6`, `#ECE8E0` | `#2B2824` |
| `--muted-foreground` | `#6A6258` | `#A69E92` |
| `--accent` (hover, selected row) | `#ECEDE1` | `#2F3125` |
| `--border` | `#E2DDD3` | `#37332D` |
| `--input` | `#D3CCBF` | `#46413A` |
| `--primary` (filled actions) | `#55602B` | `#B4BF6E` |
| `--primary-foreground` | `#FAF8F3` | `#1B1916` |
| `--primary-text` (olive text, links) | `#55602B` | `#B4BF6E` |
| `--ring` | `#6B7834` | `#B4BF6E` |
| `--destructive` | `#B3261E` | `#E5776C` |
| `--destructive-foreground` (new) | `#FFFFFF` | `#1B1916` |
| `--chart-1` … `--chart-5` | `#6B7834`, `#8C7B5E`, `#B9AE8E`, `#4A4238`, `#C9C2B0` | `#B4BF6E`, `#C2AE84`, `#8A8170`, `#E0D9C8`, `#6E6656` |

Every `*-foreground` token not listed (`--card-foreground`, `--popover-foreground`, `--secondary-foreground`,
`--accent-foreground`, `--sidebar-foreground`, `--sidebar-accent-foreground`) equals `--foreground`, and
`--sidebar-primary-foreground` equals `--primary-foreground`. `--foreground` on `--secondary` is 12.89:1
light and 12.0:1 dark, on `--accent` 13.33:1 and 10.83:1.

Every text pair in the table meets 4.5:1. The lowest is dark destructive text on the dark accent
(4.53:1), which has almost no margin: a later change to either colour can drop it below AA. The next
lowest are light muted text on `--secondary` (4.91:1) and muted text on the dark accent (5.00:1) and the
light accent (5.08:1). Olive text is 5.74:1 or more in light and 6.69:1 or more in dark. The ring meets
3:1 against the background in both themes. The `--sidebar-*` tokens follow the same values (`--sidebar`
= `--background`, `--sidebar-primary` = `--primary`, `--sidebar-accent` = `--accent`). The product
status badge stops painting the colour stored with the status, because white text on an arbitrary colour
cannot hold 4.5:1; it uses the `secondary` badge, and the `Status.color` column stays in the schema.

### Spacing and layout

- The Tailwind 4px scale, steps 1, 2, 3, 4, 6, 8, 12, 16, 24 only (4px–96px); no arbitrary spacing values.
- Storefront sections: `py-16` on mobile, `py-24` from `md`. Back-office pages: `p-6`, `gap-6` between
  blocks, `gap-4` inside forms and filters.
- Content is left-aligned; centred text only for an empty state or a single confirmation message.
- Structure only where it carries information: no eyebrow labels above headings, no numbered markers
  unless the content is a sequence, no `·`-joined meta strings. (`frontend-design`, visual structure is
  information.)

### Shape and depth

- `--radius: 0.5rem`. Buttons, inputs and selects `rounded-md` (6px); cards and images `rounded-lg`
  (8px); dialogs and sheets `rounded-xl` (12px); `rounded-full` only for avatars, badges and icon
  buttons. No arbitrary radii such as `rounded-[2.5rem]`. (`impeccable` quieter: simplify shapes.)
- Cards are separated by a border, not a shadow. `shadow-sm` on popovers and menus, `shadow-lg` on
  dialogs and sheets, nothing else. No `backdrop-blur` except a sticky header that needs it to stay
  legible. `.hoverEffect` and `.glass-layer` are removed from `globals.css`. (`impeccable` quieter:
  remove decorative effects.)

### Motion

Motion answers what the user did and nothing else. (`emil-motion` duration budgets and easing;
`taste`, when not to animate; `frontend-design`, no scattered entrance effects.)

| What | Duration | Property and easing |
| --- | --- | --- |
| Press feedback | 100ms | `transform: scale(0.97)` |
| Hover on buttons, rows, links | 150ms | `background-color`, `border-color`, `opacity`; ease-out |
| Dropdowns, selects, popovers | 150–200ms | scale 0.95 → 1 and opacity, from the trigger (`--radix-popper-transform-origin`) |
| Dialogs, sheets | 200–300ms | opacity and transform; ease-out in, ease-in out |
| Toasts | 250–350ms | the `sonner` default |

- Ease-out `cubic-bezier(0.16, 1, 0.3, 1)` for appearing, ease-in `cubic-bezier(0.4, 0, 1, 1)` for
  leaving. Never `transition-all`, never a transition on `color`, never bounce.
- No page-load or scroll entrances, no hover lift or scale on cards, no looping animation. Skeletons may
  pulse while loading.
- The add-to-cart mount fade may stay: it shows the button becoming usable. Its disabled opacity must
  keep 4.5:1 in both themes (CONTRIBUTING, Pitfalls).
- The `prefers-reduced-motion` block in `globals.css` stays.

### Copy

- Plain, sentence-case copy that names things the way a shopper or shop owner would: "Sign in", "Email",
  "Orders", "No orders yet". No console vocabulary ("protocol", "registry", "terminal", "sector",
  "vault", "voices") and no `SNAKE_CASE` labels. The brand is Daydream. (`frontend-design`, writing.)
- A button says what it does, and the result uses the same verb: "Add to cart" → "Added to cart".
- No claims the demo cannot keep: delivery times, shipping regions, "100% organic".
- Every string is in both `messages/en.json` and `messages/pl.json`; Polish copy follows the same rules.

### Review

Each task's pull request is checked against these rules and the before/after screenshots, with
`impeccable` (critique and polish) as the quality bar. Before review the author runs `break-ui` on the
changed screens (long names, empty states, many items, Polish text) and `review-animations` when motion
changes. Component polish follows `emil-design-eng`; any motion follows `emil-motion`. `pick-ui-library`
is used only if a task cannot be done with shadcn/ui and Tailwind (ADR 0002).

## Alternatives considered

- **Caprasimo** as the display face — a closer homage to 1970s natural-food packaging, but its single
  very heavy weight brings back the loudness the redesign removes.
- **Bricolage Grotesque** — a characterful sans, but too close to Geist to be clearly distinct, and the
  storefront would lose the label-like voice.
- **Fraunces or another soft serif from the common defaults** — reads as the template for warm,
  food-and-craft sites.
- **A committed colour strategy** (olive as large fields) — the owner chose restrained colour.
- **Keeping the current identity and only toning it down** — the owner chose a new storefront look.

## Consequences

- The tokens and fonts change the whole site at once; the area tasks then remove the loud classes and
  console copy page by page.
- The home page task is the first to show the display face; if the owner rejects it there, the face is
  swapped in `app/[locale]/layout.tsx` and this ADR before the later storefront tasks.
- E2E tests that find elements by the old copy are updated in the task that changes the copy.
- The e-mail templates still use the old look until a later goal brings them in line with these rules.
