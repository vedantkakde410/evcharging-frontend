# Architecture Decisions

This document is the long-term engineering reference for `evcharge-ui`. Where
the other planning docs describe *what exists* and *what to build next*
(`PROJECT_OVERVIEW.md`, `API_REFERENCE.md`, `COMPONENT_ARCHITECTURE.md`,
`UI_DESIGN_SYSTEM.md`, `ROADMAP.md`, `IMPROVEMENT_REPORT.md`), this document
explains **why** each standing decision was made, so a future contributor
(or a future session) doesn't have to re-derive the reasoning or
accidentally reverse a deliberate choice.

---

## 1. Project Vision

**Purpose:** `evcharge-ui` is the driver- and owner-facing frontend for an
EV charging marketplace. It exists to make two things fast: a driver
finding and booking an available charger, and a station owner seeing how
their stations are performing.

**Scope:** This repository owns the browser client only — routing, UI,
client-side state, and calling the existing Spring Boot API. It does not
own the API contract, the database schema, or business logic. Per
`CLAUDE.md`, the backend is a fixed dependency, not a co-evolving system —
we adapt to it, we don't redesign it from here.

**Non-goals (deliberately out of scope for this repository):**
- Backend logic, schema, or endpoint design — that's `evcharging/` (the
  Spring Boot repo), a separate concern with a separate owner.
- A generic, white-labelable "charging platform" — this is one product for
  one deployment, not a multi-tenant SDK. Abstractions are added when a
  second real use appears, not preemptively (see §2, Reusable Components).
- Native mobile apps — a responsive web app is the target (§9 revisits this
  as a possible future expansion, not a current goal).
- Backend security hardening (auth enforcement, password hashing, JWT
  validation) — real gaps exist today (`IMPROVEMENT_REPORT.md` Critical
  #3/#4) but fixing them is backend work; this repo's responsibility is to
  not misrepresent the current state as secure (§8).

---

## 2. Architectural Principles

Each principle below is paired with *why it applies here specifically* —
these aren't generic best practices copy-pasted in; they're chosen because
of concrete pain already observed in this codebase (see
`IMPROVEMENT_REPORT.md` for the evidence).

- **Separation of concerns.** Pages fetch and orchestrate; components
  render; services talk to the network; hooks hold reusable stateful
  logic. This directly fixes the current state where `Station.jsx`,
  `History.jsx`, `OwnerDashboard.jsx` each inline their own `fetch()`
  calls, inline styles, and rendering in one file — impossible to reuse
  and hard to test in isolation.
- **Reusable components, built from real duplication, not predicted
  duplication.** A component graduates from page-local JSX to
  `components/shared/` or `features/*` only once a *second* page needs the
  same shape (`COMPONENT_ARCHITECTURE.md`). Building shared abstractions
  before a second consumer exists tends to guess wrong about the actual
  variation points and creates premature, awkward prop APIs — worse than
  the duplication it was meant to prevent.
- **Single responsibility.** A page component's job is "assemble this
  screen from data + child components," not also "know how to format
  currency," "know the shape of a fetch error," or "own inline CSS." Those
  responsibilities move to `lib/format.js`, `hooks/useFetch.js`, and
  Tailwind/shadcn respectively — so a change to how errors are displayed,
  for instance, touches one file instead of five.
- **Composition over inheritance.** React and this component set (shadcn)
  are built around composition (children, slots, wrapping) — there is no
  class-inheritance mechanism in play anywhere in this stack, so this
  principle mostly means: extend a shadcn primitive by *wrapping* it
  (`StatusBadge` wraps `Badge`), never by copy-pasting and modifying the
  generated file, so future `shadcn` CLI updates don't conflict with
  hand edits.
- **API abstraction.** Every network call goes through `services/*Api.js`
  (§5) instead of components calling `fetch()` directly. This exists
  because five files currently hardcode the same base URL independently
  (`IMPROVEMENT_REPORT.md` High #10) — a single seam means the base URL,
  auth header injection, and error-shape normalization are each defined
  exactly once.
- **Accessibility first.** Treated as a correctness requirement, not a
  final pass — labeled form fields, keyboard reachability, and
  `prefers-reduced-motion` are part of a component's definition of done
  (§10), not a Module 7 cleanup item bolted on afterward. It's listed
  under "Engineering Standards" for that reason: it belongs in code review,
  not a separate audit.
- **Mobile-first responsive utilities, desktop-first build priority.**
  Tailwind's utility classes remain mobile-first by convention
  (`md:grid-cols-4` layers *up* from a base mobile layout), but per
  `CLAUDE.md` the *build and visual-QA order* is desktop → tablet →
  mobile, because the dashboard/marketplace use case is primarily
  evaluated on desktop first. These are two different axes (CSS mechanism
  vs. QA order) and are not in conflict — `UI_DESIGN_SYSTEM.md` states
  this explicitly because it's easy to conflate the two.

---

## 3. State Management Strategy

**Why the Context API is sufficient today:**
- This app has exactly one piece of genuinely global, cross-cutting state:
  the authenticated session (`user`, `token`, `role`). Everything else
  (stations, chargers, bookings, reports) is page-scoped server data that
  is fetched, displayed, and discarded — it doesn't need to be shared
  between distant, simultaneously-mounted components.
- A single `AuthContext` (`COMPONENT_ARCHITECTURE.md`) covers that one
  global need with no external dependency, no boilerplate action/reducer
  pattern, and no learning curve for a small team. Redux/Zustand solve
  problems this app doesn't have yet: large numbers of interdependent
  global slices, cross-slice derived state, or a need for
  time-travel/devtools debugging of complex state transitions.
- Context re-render cost (the usual argument against using Context for
  frequently-changing state) is a non-issue here because the one thing
  in context — the session — changes at most a few times per user visit
  (login, logout), not on every keystroke or every render.

**When Redux or Zustand would become necessary** (concrete triggers, not
hypothetical ones — revisit this decision if any of these actually occur):
- Multiple independent features need to read *and* write overlapping
  server-derived state simultaneously (e.g., a live map of station
  availability that both the Home page and a persistent nav widget must
  update in real time) — Context works poorly for high-frequency,
  fan-out updates.
- The app needs cross-tab state sync, undo/redo, or time-travel debugging
  of state transitions — none of which Context provides out of the box.
- Server-state caching needs (dedup in-flight requests, background
  refetch, stale-while-revalidate) grow beyond what a `useFetch` hook can
  reasonably hand-roll — at that point, reach for a dedicated server-state
  library (TanStack Query) *specifically for server state*, which is a
  different problem than Redux/Zustand solve (client state) and is the
  more likely next step for this app if it grows, not a general state
  library.
- A genuine second global concern appears (e.g., a shopping-cart-style
  multi-step booking flow spanning several routes) that doesn't fit
  naturally as a second Context — at that point, evaluate whether a
  second Context is enough before reaching for a library, since two
  Contexts is still simpler than introducing a new dependency.

---

## 4. Component Design Philosophy

- **Container vs. presentational components.** Pages (`src/pages/*`) are
  containers: they own data-fetching (`useFetch` + a `services/*Api.js`
  call), auth checks, and navigation. Everything under `components/` and
  `features/` is presentational: it receives data and callbacks via props
  and has no knowledge of `fetch`, `localStorage`, or routing. This split
  exists so a presentational component (e.g., `ChargerCard`) can be
  rendered with mock props in isolation — for visual QA or a future test —
  without needing a running backend.
- **Reusable UI components (`components/ui/`)** are shadcn-generated and
  treated as vendored code: never hand-edited beyond what the shadcn CLI
  produces, so `npx shadcn add` / future upgrades stay conflict-free.
  Anything project-specific wraps them (`components/shared/`) rather than
  forking them.
- **Page components** stay thin — assemble child components, hold at most
  the local UI state a single screen needs (a dialog's open/close flag,
  form field values), and delegate everything else. `CLAUDE.md`'s
  ~300-line guideline is a symptom check: a page approaching that size is
  a signal that a sub-component should be extracted, not that the limit
  itself is the goal.
- **Shared layouts** (`MainLayout`, `Navbar`, `Footer`) are the one place
  allowed to know about the overall page chrome; individual pages never
  render their own header/nav.
- **Hooks** hold reusable *stateful logic* that isn't tied to one screen's
  markup — `useAuth`, `useFetch`, `useRequireAuth`. A hook is the right
  extraction when the logic needs `useState`/`useEffect`; if it's a pure
  function with no state, it belongs in `lib/` instead (see next).
- **Utilities (`lib/`)** hold pure, stateless functions — `cn()` today,
  `formatCurrency`/`formatEnergy`/`formatDuration` once a second consumer
  needs them (same reuse-triggered-by-second-consumer rule as
  components). Utilities never import React and never touch the network.

---

## 5. API Strategy

**Why every request goes through `services/api.js` (and its per-domain
extensions `stationApi.js`, `authApi.js`, `bookingApi.js`, `ownerApi.js`):**
the backend's base URL, auth header, and error shape are each defined in
exactly one place. Today, five different page files hardcode
`http://localhost:8801/...` independently — changing environments or
adding a header today means editing five files and hoping none are missed.
Centralizing this is not about elegance; it's about not repeating a fact
(the base URL) that will need to change.

**Authentication flow:** login/register call `authApi.js`, which calls the
backend's `/auth/login`/`/auth/register`. On success, the returned
`{token, userId, name, role}` is stored via `AuthContext`, which persists
it to `localStorage` and makes it available to the rest of the app via
`useAuth()`. Because the backend does not actually validate this token on
any endpoint (`API_REFERENCE.md`), this flow is documented as **client-side
session bookkeeping and UX gating only** — not a security mechanism. That
distinction must stay visible in code comments/PR descriptions wherever
auth is touched, so nobody later assumes a protected route is
backend-enforced when it isn't.

**Token handling:** the token is attached as a `Bearer` header by
`services/api.js`'s `request()` wrapper (already implemented) for every
call, unconditionally — this costs nothing when the backend ignores it
today, and means zero frontend changes are needed the day the backend
does start validating it.

**Retry strategy:** no automatic retries. The backend's write endpoints
are not idempotent-safe by inspection (plain `INSERT`s with no
idempotency key), so blindly retrying a failed `POST` (e.g., add review,
create booking) risks a duplicate write. If retries are needed later, they
should be limited to safe `GET` requests and implemented explicitly in
`useFetch`, not as a blanket wrapper behavior.

**Error handling:** because the backend returns `200 OK` for both success
and failure on several write endpoints (`API_REFERENCE.md` — register,
addReview, owner add/update all do this), `services/*Api.js` functions
are responsible for inspecting the **response body**, not just
`response.ok`, and normalizing to a consistent `{ok, message}`-style
result that `useFetch`/calling components can treat uniformly. This
normalization lives in the service layer specifically so page components
never need to know which backend quirk they're working around.

**Loading strategy:** `useFetch` exposes `{data, loading, error}` from
every call; pages render a skeleton (shadcn `Skeleton`, per
`UI_DESIGN_SYSTEM.md`) while `loading` is true, and never render a bare
blank screen while data is in flight — the current biggest gap
(`IMPROVEMENT_REPORT.md` High #7).

**Caching strategy:** none, deliberately, for now. Every fetch is
request-on-mount, no shared cache across components. This app's data
(station lists, chargers, bookings) changes often enough and is viewed
infrequently enough per session that a caching layer would add complexity
without a measurable win. Revisit if/when the same data is fetched by
multiple simultaneously-mounted components and a visible "flash of stale
then fresh data" becomes a real user-facing problem — at that point,
introduce a dedicated server-state library (TanStack Query) rather than
hand-rolling a cache inside `useFetch`.

**Future WebSocket support:** anticipated for real-time charger
availability (§9) — e.g., a charger's status flipping from `AVAILABLE` to
busy while a user is viewing the station page. When added, it should live
behind its own `services/realtime.js` (or a `useChargerAvailability` hook)
that updates the same local component state a polling implementation
would have updated — i.e., components should not need to know whether
availability data arrived via polling or a socket. Introducing this now
would be speculative; it becomes real work only once `POST /api/bookings`
exists (§ROADMAP Module 3.5) and there's an actual live-status backend
endpoint to subscribe to.

---

## 6. Styling Philosophy

- **Tailwind CSS v4** is the only styling mechanism — no CSS Modules, no
  styled-components, no hand-written `.css` files beyond the single
  `index.css` entry point (which itself is mostly Tailwind imports + theme
  tokens). This is a hard rule in `CLAUDE.md` ("never use inline CSS") and
  exists so styling stays greppable/consistent and doesn't fragment across
  three different mechanisms.
- **shadcn/ui** provides the component primitives (Button, Card, Dialog,
  etc.) rather than hand-building them, because it gives accessible,
  composable defaults (focus rings, ARIA wiring already built into
  `button.jsx`) for free — reinventing these has a real cost in
  accessibility bugs that shadcn has already solved.
- **Design tokens** (`UI_DESIGN_SYSTEM.md`) are the single source of truth
  for color/radius/spacing values, defined once in `index.css`'s `@theme`
  block and consumed everywhere via semantic Tailwind classes
  (`bg-primary`, not `bg-green-600`) so a future rebrand or dark-mode pass
  is a token change, not a find-and-replace across every page. The
  current gap — these tokens don't exist yet — is exactly why Module 0
  exists and blocks everything else.
- **Animations** use Framer Motion exclusively, following the two patterns
  already established in `Home.jsx` (fade/slide entrance, hover lift/scale)
  rather than inventing new motion idioms per page — consistency of motion
  language matters as much as consistency of color for the "premium SaaS"
  feel `CLAUDE.md` asks for.
- **Dark mode strategy:** tokens are defined for both light and dark
  (`UI_DESIGN_SYSTEM.md`'s table includes both columns) using shadcn's
  standard `.dark` class convention, and `next-themes` is already an
  installed dependency for this exact purpose. No dark-mode toggle UI
  exists yet — defining the tokens now (Module 0) means turning on the
  toggle later is a small addition (a `ThemeProvider` + a switch in
  `Navbar`), not a retrofit across every component.

---

## 7. Performance Strategy

- **Lazy loading:** route-level code is the natural split boundary in this
  app — `React.lazy()` per page component (`Home`, `Station`, `History`,
  `OwnerDashboard`, `Login`, `Register`) once the bundle is large enough
  that initial load time is measurably affected. Not done preemptively
  today because the app is small enough that splitting now would add
  Suspense-boundary complexity for negligible bytes saved — revisit once
  `Recharts` (already installed, heavy) is actually wired into
  `OwnerDashboard` (Module 5), since that's the first page likely to
  justify its own chunk.
- **Code splitting:** follows from route-based lazy loading above — Vite
  handles this automatically per dynamic `import()`, no manual
  chunk-config needed at this scale.
- **Memoization:** used deliberately, not by default. `React.memo`/
  `useMemo`/`useCallback` are reached for only when a measured re-render
  cost exists (e.g., a large list like `BookingsTable` re-rendering on
  every keystroke of an unrelated filter input) — not applied
  speculatively to every component, which adds cognitive overhead and can
  even hurt performance when misused on cheap components.
- **Image optimization:** the one current image asset (`hero.png`) should
  be sized/compressed appropriately for its rendered dimensions and served
  via a modern format (WebP/AVIF with a fallback) once it's actually wired
  into the Home hero (currently unused — `IMPROVEMENT_REPORT.md` #23).
  Vite's asset pipeline handles hashing/caching automatically; no
  additional image CDN is justified at this scale.
- **Bundle size:** kept in check by removing genuinely unused dependencies
  as they're identified (e.g., resolving the two-toast-library duplication
  in `ROADMAP.md` Module 7) rather than by a dedicated bundle-analysis
  step — at this app's size, dependency hygiene during normal development
  is sufficient; a `vite-bundle-visualizer` pass is worth adding only if
  the app grows enough that this stops being obviously true.
- **Route-based loading:** covered by lazy loading above — each route's
  page component is the unit of splitting; shared layout/nav/footer stay
  in the main bundle since they're needed on every route regardless.

---

## 8. Security Considerations

- **Frontend responsibilities:** never store anything more sensitive than
  a session token/role/user id in `localStorage`; never render
  user-supplied content (review comments, station names) without React's
  default escaping (i.e., never use `dangerouslySetInnerHTML` on backend
  data); validate form input shape/required-ness client-side as a UX
  courtesy, understanding it is not a security boundary since the backend
  performs no equivalent validation today (`API_REFERENCE.md`); route
  guarding (`ProtectedRoute`) is a UX feature, explicitly not a security
  control, and must not be described as one in user-facing copy or code
  comments.
- **Backend responsibilities (out of this repo's scope, documented for
  awareness):** enforcing authentication/authorization per request,
  hashing passwords, validating the JWT it issues, and not committing
  plaintext database credentials to source control. All four are current
  gaps (`IMPROVEMENT_REPORT.md` Critical #3–#5) that this repository
  cannot and should not attempt to work around from the client side —
  doing so (e.g., hiding UI for a role the backend doesn't actually check)
  would create a false sense of security without closing the actual hole.
- **JWT handling:** the frontend attaches whatever token the backend
  issues as a `Bearer` header on every request, unconditionally, via
  `services/api.js`. It does not attempt to decode, validate, or make
  authorization decisions based on the JWT's contents client-side (e.g.,
  trusting a role claim embedded in the token) — the token today isn't
  even a real JWT (`API_REFERENCE.md`: `AuthService.login()` returns the
  literal string `"dummy-token"`), so any such logic would be meaningless
  now and should stay meaningless-by-design later: role/permission
  decisions belong server-side, once the backend actually makes them.
- **XSS:** React's default JSX escaping is the primary defense and is
  sufficient as long as `dangerouslySetInnerHTML` is never introduced —
  user-generated content (station reviews, names) is always rendered as
  text, never as HTML.
- **CSRF:** low risk in this architecture specifically because
  authentication is bearer-token-based (attached manually in a header by
  `services/api.js`), not cookie-based — CSRF exploits rely on a browser
  automatically attaching credentials (cookies) to a cross-site request,
  which doesn't happen with a manually-attached `Authorization` header.
  This would need re-evaluating if the backend ever switches to
  cookie-based sessions.
- **Input validation:** client-side validation (required fields, email
  format, etc.) exists purely to give fast feedback and reduce obviously-
  bad requests — it is explicitly not relied upon as the actual data
  integrity boundary, since the backend performs minimal validation of
  its own (`API_REFERENCE.md`: `role` accepts any string, no schema
  validation observed in the DTOs).
- **Secrets management:** the frontend has no secrets to manage — the API
  base URL is configuration, not a secret, and should move to an
  environment variable (`IMPROVEMENT_REPORT.md` #25) for
  environment-switching convenience, not for confidentiality. No API keys
  or credentials should ever be introduced into frontend source or
  bundled JS, since anything shipped to the browser is public by
  definition.

---

## 9. Future Expansion

Each item below is noted with what it would require *of this
architecture* specifically — not a general feature description.

- **Admin panel:** would likely be a second route tree (`/admin/*`) behind
  a stronger role guard, reusing `components/ui/` and most of
  `components/shared/` — probably justifies its own top-level `pages/
  admin/` folder rather than mixing into existing owner pages, once (and
  only once) the backend has a real admin role/endpoints to support it.
- **Maps (station location visualization):** would introduce the first
  third-party visual SDK into the project — evaluate bundle size and
  whether it can be lazy-loaded per-route (Station/Home only) before
  adopting, per §7.
- **Payments:** would need its own `services/paymentApi.js` and almost
  certainly a hosted checkout flow (Stripe Elements or similar) rather
  than handling raw card data in this frontend — PCI scope should stay
  with a payment provider, never with this codebase directly.
- **Notifications (booking confirmations, charger-availability alerts):**
  in-app toasts already have a home (§6, once the sonner/react-hot-toast
  duplication is resolved); push notifications would require a service
  worker, which also sets up the PWA groundwork below.
- **Real-time charger availability:** the clearest near-term candidate —
  see §5's WebSocket note. Should be additive to the existing
  `useFetch`-based data flow (a subscription updates the same local
  state a fetch would have populated), not a parallel data-fetching
  system.
- **PWA:** would add a service worker/manifest via Vite's PWA plugin —
  compatible with the current architecture since routing/state are
  already client-side; primarily an additive build-config change, not a
  restructuring.
- **Mobile app:** if pursued, treat it as a separate codebase consuming
  the same backend/`API_REFERENCE.md`, not a wrapper around this web
  app — trying to share this React DOM codebase directly with a
  React Native target would fight both platforms' idioms more than it
  would save.

---

## 10. Engineering Standards

- **Naming conventions:** `PascalCase` for components and their files
  (`StationCard.jsx`), `camelCase` for functions/hooks/variables
  (`useFetch`, `getStations`), hooks always prefixed `use`. Service
  functions are named as verbs matching the action (`getStations`,
  `addReview`, `createBooking`) to mirror the HTTP verb they perform,
  matching the pattern already established in the existing `stationApi`
  object in `services/api.js`.
- **Folder conventions:** as laid out in `COMPONENT_ARCHITECTURE.md` —
  `components/ui` (shadcn, vendored), `components/shared` (hand-written,
  reused across ≥2 pages), `features/<domain>` (page-adjacent, reused
  within a domain), `pages` (route-level containers), `hooks`, `services`,
  `lib`. A file's location should be inferable from this doc without
  needing to ask; if it isn't obvious where something goes, that's a
  signal the categories need revisiting, not that the file should go
  wherever's convenient.
- **Commit conventions:** conventional, imperative-mood subject lines
  (`fix: handle empty login response`, `feat: wire Home to live station
  data`) scoped to one module/concern per commit, mirroring
  `ROADMAP.md`'s module boundaries — a commit (or small commit series)
  per module keeps history reviewable against the plan.
- **Testing strategy:** no test suite exists today. Given the app's
  current size, prioritize in this order as modules land: (1) manual
  testing checklists per module, already specified in `ROADMAP.md` — the
  minimum bar before any module is considered done; (2) once a shared
  `services/*Api.js`/`useFetch` layer exists, add unit tests for the
  error-normalization logic in §5 specifically, since that's the part
  most likely to silently regress and hardest to catch by eye; (3)
  component/integration tests (React Testing Library) for the
  booking flow once it's unblocked (§ROADMAP Module 3.5), since it's the
  highest-value user path. Not pursuing a large test suite now is a
  deliberate scope decision, not an oversight — revisit if the team or
  codebase grows enough that manual checklists stop catching regressions.
- **Documentation strategy:** the six planning docs
  (`PROJECT_OVERVIEW.md`, `API_REFERENCE.md`, `COMPONENT_ARCHITECTURE.md`,
  `UI_DESIGN_SYSTEM.md`, `ROADMAP.md`, `IMPROVEMENT_REPORT.md`) plus this
  one are living documents — update the relevant doc in the same PR/session
  that changes the thing it describes (e.g., a new endpoint used → update
  `API_REFERENCE.md`; a new shared component → update
  `COMPONENT_ARCHITECTURE.md`). Stale docs are worse than no docs, so
  updating them is part of a module's definition of done, not a
  follow-up task.
- **Definition of Done** (applies to every module in `ROADMAP.md`): code
  compiles and lints clean; no inline styles; uses existing shared
  components where one fits, extracted to `components/shared/`
  or `features/*` if a second use just appeared; loading/error/empty
  states handled for any new data fetch; keyboard-accessible with
  labeled inputs; the module's own testing checklist in `ROADMAP.md`
  passes against the real backend (not assumed from reading the code);
  any doc affected by the change is updated in the same pass; and, per
  `CLAUDE.md`, the change is explained (what/why/risk) and approved
  before moving to the next module.
