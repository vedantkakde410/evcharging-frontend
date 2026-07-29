# UI Design System

Direction per `CLAUDE.md`: premium SaaS, inspired by Tesla, ChargeZone,
Stripe Dashboard, Vercel. Framer Motion for animation, rounded cards, modern
spacing, accessible, responsive.

## Current state (must read before Module 1)

`components.json` configures shadcn/ui with `style: "base-nova"`,
`baseColor: "neutral"`, `cssVariables: true`. shadcn's generated primitives
(`components/ui/button.jsx`, `card.jsx`, etc.) already reference dozens of
CSS custom properties and semantic Tailwind v4 tokens: `bg-primary`,
`text-primary-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`,
`text-muted-foreground`, `bg-destructive`, `text-destructive`, `bg-secondary`,
`--radius-md`, `--card-spacing`, `font-heading`, `ring-foreground/10`.

**None of these tokens are defined anywhere in the project.**
`src/index.css` currently contains only:
```css
@import "tailwindcss";
@import "@fontsource/inter";
```
with no `@theme` block and no `:root` custom properties. In Tailwind v4,
utilities like `bg-primary` only exist if a corresponding `--color-primary`
token is registered via `@theme`. Without it, every shadcn component in
`components/ui/` renders effectively unstyled (the class compiles to
nothing). This is the first thing Module 0 must fix — see `ROADMAP.md`.
Everything below is the token set that fix should introduce.

## Color palette

Base: shadcn "neutral" base color (grayscale UI chrome), with the existing
brand green promoted to the `primary` token so `Home.jsx`/`Navbar.jsx`'s
already-established green identity (`green-600`/`emerald-700`) becomes the
system's accent rather than a one-off hardcoded class.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--color-background` | `oklch(1 0 0)` | `oklch(0.16 0.01 260)` | page background |
| `--color-foreground` | `oklch(0.16 0.02 260)` | `oklch(0.96 0.01 260)` | body text |
| `--color-card` | `oklch(1 0 0)` | `oklch(0.20 0.01 260)` | Card background |
| `--color-card-foreground` | `oklch(0.16 0.02 260)` | `oklch(0.96 0.01 260)` | Card text |
| `--color-primary` | `oklch(0.62 0.17 152)` (≈ green-600) | `oklch(0.68 0.17 152)` | primary buttons, links, active nav |
| `--color-primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.12 0 0)` | text on primary |
| `--color-secondary` | `oklch(0.96 0.01 260)` | `oklch(0.27 0.01 260)` | secondary buttons |
| `--color-secondary-foreground` | `oklch(0.16 0.02 260)` | `oklch(0.96 0.01 260)` | text on secondary |
| `--color-muted` | `oklch(0.96 0.01 260)` | `oklch(0.24 0.01 260)` | subtle backgrounds |
| `--color-muted-foreground` | `oklch(0.48 0.02 260)` | `oklch(0.66 0.02 260)` | secondary text |
| `--color-popover` | same as `card` | same as `card` | dropdown/dialog/popover surfaces |
| `--color-popover-foreground` | same as `card-foreground` | same as `card-foreground` | text on popover surfaces |
| `--color-accent` | `oklch(0.94 0.03 152)` (green-tinted) | `oklch(0.28 0.03 152)` | menu-item hover states |
| `--color-accent-foreground` | same as `foreground` | same as `foreground` | text on accent hover |
| `--color-destructive` | `oklch(0.58 0.22 27)` | `oklch(0.62 0.22 27)` | errors, delete actions |
| `--color-destructive-foreground` | `oklch(0.99 0 0)` | `oklch(0.12 0 0)` | text on solid destructive fills |
| `--color-border` | `oklch(0.90 0.01 260)` | `oklch(0.30 0.01 260)` | borders |
| `--color-input` | same as `border` | same as `border` | form input borders/backgrounds |
| `--color-ring` | same as `primary` | same as `primary` | focus rings |

`popover`/`accent`/`input` were omitted from the original draft of this
table but are required by shadcn's `Dialog`, `DropdownMenu`, `Select`,
`Sheet`, `Popover`, `Input`, `Textarea`, and `Tabs` components — added when
Module 0 implemented the tokens (see `CHANGELOG.md`).

Status colors (charger/booking status — used by the `StatusBadge` shared
component from `COMPONENT_ARCHITECTURE.md`):

| Status | Color |
|---|---|
| `AVAILABLE` | `--color-primary` (green) |
| busy / any non-`AVAILABLE` value | `--color-destructive` (red) — matches existing `Station.jsx` convention of "red = busy" |

These are proposed starting values, not a hard requirement — the exact hues
can be tuned once applied visually, but the **token names** must match what
`components/ui/*` already expects, since those files are shadcn-generated
and shouldn't be hand-edited to use different names.

## Typography

- Body/UI text: **Inter** (`@fontsource/inter`, already installed and
  imported in `index.css`).
- Headings: **Geist** (`@fontsource-variable/geist` is already an installed
  dependency but currently unused/unimported) — matches the
  Vercel-inspired direction in `CLAUDE.md`. Map it to the `font-heading`
  token that `card.jsx`'s `CardTitle` already references.
- Scale (Tailwind defaults, used consistently): `text-sm` (14px) body/labels,
  `text-base` (16px) default, `text-xl`–`text-2xl` card titles, `text-4xl`–
  `text-6xl` hero/section headings (already the pattern in `Home.jsx`).
- Weight: `font-medium` for UI labels/buttons, `font-bold`/`font-black` for
  marketing headings (as in `Home.jsx`'s hero).

## Spacing system

Tailwind's default 4px base scale, used via utility classes — no custom
spacing scale needed. Section rhythm already established in `Home.jsx` and
should be reused everywhere: `py-16`–`py-28` for full-width sections,
`px-6` page gutters, `max-w-7xl mx-auto` content width, `gap-6`–`gap-8`
for card grids.

## Border radius

shadcn `base-nova` style convention: `rounded-lg`/`rounded-xl` for cards and
buttons (matches `Home.jsx`'s `rounded-2xl` station/feature cards — align on
`rounded-xl` as the system default so `components/ui/card.jsx`'s
`rounded-xl` and hand-built page sections don't visually disagree).
`--radius-md`/`--radius-lg` tokens should be defined in `@theme` since
`button.jsx` already references `var(--radius-md)`.

## Shadows

Soft, low-elevation shadows only (Stripe/Vercel style — no heavy drop
shadows): Tailwind's `shadow` / `shadow-lg` utilities, as already used in
`Home.jsx` (`shadow`, hover states via Framer Motion `whileHover={{ y: -6 }}`
rather than shadow-intensity changes).

## Icons

`lucide-react`, already in use. Convention observed in existing code:
`size={16}`–`size={18}` inline in text/buttons, `size={28}`–`size={30}` for
feature/brand icons. Keep one icon per concept — don't mix icon sets.

## Animations (Framer Motion)

Reuse the two patterns already established in `Home.jsx` rather than
inventing new ones:
- **Entrance**: `initial={{ opacity: 0, y: 30 }}` → `animate={{ opacity: 1,
  y: 0 }}`, optional `transition={{ delay }}` for staggered reveals.
- **Hover**: `whileHover={{ y: -6 }}` (cards lifting) or `whileHover={{ scale:
  1.03 }}` (feature tiles) — pick one per component type and keep it
  consistent (don't mix lift and scale on the same grid of cards).
- Respect `prefers-reduced-motion`: wrap entrance animations so they no-op
  for users with reduced-motion enabled (Framer Motion's `useReducedMotion`
  hook) — not present today, should be added when Module 0 lands.

## Responsive breakpoints

Tailwind v4 defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px.
Per `CLAUDE.md`, design **desktop-first** (build/verify the desktop layout
first, since that's the primary dashboard/marketplace use case), then adapt
down through `lg`/`md` (tablet) and base (mobile) — this is a build/QA
priority order, not a CSS methodology change; Tailwind utility classes
remain mobile-first (`md:grid-cols-4` etc.) as already used throughout
`Home.jsx`.

## Component design guidelines

- Always compose from `components/ui/*` (shadcn) first; only drop to raw
  `div`/Tailwind when no shadcn primitive fits.
- No inline `style={{}}` anywhere (hard rule in `CLAUDE.md`) — this is the
  single biggest gap in `Station.jsx`, `History.jsx`, `OwnerDashboard.jsx`,
  `Login.jsx`, `Register.jsx` today (all currently inline-styled) and is the
  first thing each page's migration module fixes.
- Buttons: `variant="default"` (primary green) for the main action per
  view, `variant="outline"`/`"ghost"` for secondary actions, `variant=
  "destructive"` for delete/cancel actions — matching `button.jsx`'s
  existing variant set.
- Cards: use `Card`/`CardHeader`/`CardContent`/`CardFooter` composition
  instead of ad-hoc `div`s with manual padding (replaces the manual
  `border/padding/margin` divs in the legacy pages).

## Accessibility guidelines

- All interactive elements must be reachable via keyboard and show the
  `focus-visible` ring already built into `button.jsx`
  (`focus-visible:ring-3 focus-visible:ring-ring/50`) — don't override it
  away.
- Form inputs need associated `<label>`s (current `Login.jsx`/`Register.jsx`
  use bare `placeholder`-only inputs with no label — must be fixed during
  migration, not carried forward).
- Color is never the only status signal — `StatusBadge` pairs color with
  text (`"AVAILABLE"` / `"BUSY"`), not color alone.
- Maintain WCAG AA contrast for text-on-background token pairs listed
  above; verify once real hex/oklch values are finalized, not just assumed
  from the formula.
- Respect `prefers-reduced-motion` (see Animations above).
