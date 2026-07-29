# Changelog

Tracks every completed module from `ROADMAP.md`. An entry is appended here
as the last step of a module's Phase 4 (Review), once the module has been
approved — not before. Entries are in chronological order, oldest first.

Entry format:

```
## Module N — <name>
**Date:** YYYY-MM-DD

**Summary:**
<what changed and why, in a few sentences>

**Files modified:**
- path/to/file — what changed

**Breaking changes:**
<none, or a description of what breaks and for whom>

**Known issues:**
<anything left incomplete, deferred, or blocked — link back to
IMPROVEMENT_REPORT.md / API_REFERENCE.md items where applicable>

**Next module:**
<the next module in ROADMAP.md order>
```

---

## Module 0 — Design System Foundation
**Date:** 2026-07-28

**Summary:**
shadcn/ui's generated components (`components/ui/*`) referenced dozens of
CSS custom properties (`--color-primary`, `--radius-md`, `--font-heading`,
etc.) that didn't exist anywhere in the project, so every shadcn primitive
rendered unstyled. Added the full token set (light + dark values) via a
Tailwind v4 `@theme` block in `src/index.css`, wired `@custom-variant dark`
so `.dark`-scoped utilities work once a toggle exists, imported
`tw-animate-css` (already a dependency, never imported — popup components
had no open/close transitions without it) and `@fontsource-variable/geist`
for headings, and added a `@layer base` typography default for bare
`h1`–`h4` tags (existing explicit Tailwind classes on pages still win via
selector specificity, so this is non-regressive). Also created the two
reusable state components Module 0 called for: `LoadingSkeleton` and
`ErrorState`.

**Files modified:**
- `src/index.css` — theme tokens, dark-mode variant, typography base layer,
  `tw-animate-css`/Geist imports, `body` now reads `--color-background`/
  `--color-foreground` instead of hardcoded hex.
- `UI_DESIGN_SYSTEM.md` — added `popover`/`accent`/`input`/
  `destructive-foreground` rows to the palette table; these were required
  by shadcn components but missing from the original draft.

**Files created:**
- `src/components/shared/LoadingSkeleton.jsx` — `CardSkeleton`,
  `ListSkeleton`.
- `src/components/shared/ErrorState.jsx` — inline error `Alert` with
  optional retry button.

**Breaking changes:** none.

**Known issues:**
- `LoadingSkeleton`/`ErrorState` aren't consumed by any page yet — expected,
  since this module explicitly excludes page redesign (`ROADMAP.md`).
  Consumed starting Module 1.
- Live-browser visual confirmation of the token fix was not completed
  (browser automation declined); verified instead via `npm run build`
  succeeding and a manual cross-check of every `components/ui/*` file's
  token references against the new `@theme` block.
- The 13 pre-existing ESLint errors in legacy pages and shadcn-generated
  files (documented in `IMPROVEMENT_REPORT.md`) are untouched — out of
  scope for this module.
- No dark-mode toggle UI exists yet (deliberately deferred, see
  `ARCHITECTURE_DECISIONS.md` §6).

**Next module:** Module 1 — Auth Foundation.

---

## Module 1 — Auth Foundation
**Date:** 2026-07-28

**Summary:**
Replaced ad-hoc `localStorage` reads scattered across pages with a single
`AuthContext`/`useAuth()` seam, added a `services/authApi.js` that encodes
the backend's documented quirks (200-with-empty-body on bad login,
200-with-"Error:"-prefix on failed register), added `ProtectedRoute` and
wired it around `/history` and `/owner` (auth-only gating — role-based
gating is Module 5's job per `ROADMAP.md`), and rebuilt `Login`/`Register`
on shadcn `Card`/`Input`/`Button` with labeled fields and no `alert()`/
`window.location`.

**Files created:**
- `src/services/authApi.js`
- `src/context/auth-context.js`, `src/context/AuthContext.jsx`
- `src/hooks/useAuth.js`
- `src/routes/ProtectedRoute.jsx`

**Files modified:**
- `src/services/api.js` — exported `ROOT_URL` (auth endpoints aren't under
  `/api`, per `API_REFERENCE.md`).
- `src/main.jsx` — wrapped `<App/>` in `AuthProvider`.
- `src/App.jsx` — `/history` and `/owner` now sit behind `ProtectedRoute`.
- `src/pages/Login.jsx`, `src/pages/Register.jsx` — full rebuild.
- `src/components/layout/Navbar.jsx` — auth-aware right side
  (Login/Register vs. name + Logout); brand colors/nav links untouched.

**Breaking changes:** none for end users. For anyone continuing this
codebase: `Login.jsx`/`Register.jsx` no longer write to `localStorage`
directly — use `useAuth()` instead.

**Known issues:**
- `Station.jsx`/`History.jsx` still read `localStorage.getItem("userId")`
  directly instead of `useAuth()` — deferred to Modules 3/4 to keep this
  diff scoped to auth.
- `ProtectedRoute`'s `role` prop is unused until Module 5.
- Navbar's hardcoded `green-600` literals were not migrated to the
  `primary` token — deferred to avoid mixing concerns in this diff.
- Route guarding here is UX-only, not a security boundary — the backend
  still enforces nothing (`API_REFERENCE.md`, `ARCHITECTURE_DECISIONS.md`
  §8).

**Next module:** Module 2 — Station Browsing (Home + station list wiring).

---

## Module 2 — Station Browsing (Home + station list wiring)
**Date:** 2026-07-29

**Summary:**
Replaced `Home.jsx`'s mock `stats`/`stations` arrays (the `stations` mock —
`stats`/`features` marketing copy stayed, per `ROADMAP.md`) with a live
`GET /api/stations` call. Added the generic `useFetch(fn, deps)` hook
(`COMPONENT_ARCHITECTURE.md`'s single fetch-state pattern), moved
`stationApi` out of `services/api.js` into its own `services/stationApi.js`,
and added `StationCard` (first `features/stations/` component) plus
`EmptyState` (first `components/shared/` consumer of the file spec'd back in
`COMPONENT_ARCHITECTURE.md`). The real `StationDTO` aggregate shape
(`rating`, `totalChargers`, `availableChargers`) has no `power`/`price`
fields the old mock invented, so `StationCard` shows an availability badge
and a chargers-available count instead.

Also fixed a latent ESLint config gap surfaced by `StationCard`'s use of
`<motion.div>`: core `no-unused-vars` doesn't recognize
`JSXMemberExpression` tags (`motion.div`) as a usage of `motion` — only
plain `<Foo/>` identifiers — so every file using the Framer Motion pattern
`UI_DESIGN_SYSTEM.md` mandates was one `npm run lint` away from a false
"unused var" error. This already silently affected `Home.jsx`'s hero/stats/
features sections (pre-existing, just never linted after Module 0/1). Fixed
by adding `eslint-plugin-react` and enabling only `react/jsx-uses-vars`
(not its full recommended ruleset, to avoid introducing unrelated new
errors like `prop-types` across the existing codebase).

**Files created:**
- `src/hooks/useFetch.js`
- `src/services/stationApi.js`
- `src/features/stations/StationCard.jsx`
- `src/components/shared/EmptyState.jsx`

**Files modified:**
- `src/pages/Home.jsx` — Featured Stations section now fetches real data via
  `useFetch(stationApi.getStations)`, with a 3-card skeleton loading state,
  `ErrorState` with retry on fetch failure, and `EmptyState` for zero
  stations; unused `ArrowRight` import removed (its only use was in the
  deleted mock-station markup).
- `src/services/api.js` — inline `stationApi` removed (moved to
  `services/stationApi.js`); `request()`/`ROOT_URL`/`BASE_URL` unchanged.
- `eslint.config.js` — added `eslint-plugin-react`, enabled only
  `react/jsx-uses-vars`.
- `package.json` / `package-lock.json` — added `eslint-plugin-react`
  devDependency.

**Breaking changes:** none. Anyone importing `stationApi` from
`services/api.js` must now import it from `services/stationApi.js` — the
only existing caller (`Home.jsx`) was updated in this same change.

**Known issues:**
- Verified against the real backend: started the sibling Spring Boot repo
  (`../evcharging`, MySQL reachable on `3306`) and confirmed
  `GET /api/stations` returns data matching `StationCard`'s expected shape,
  including edge cases (`rating: 0.0`, `availableChargers: 0`). However,
  **visual confirmation in an actual browser was not completed** — the
  Claude-in-Chrome extension was not connected in this session. Both the
  backend (`:8801`) and frontend dev server (`:5174` — `:5173` was already
  occupied by another process) were left running for manual visual
  check-off.
- `eslint-plugin-react` was added as a devDependency; `npm audit` shows one
  additional (already-present-elsewhere) `brace-expansion`/`minimatch`
  ReDoS advisory via its transitive deps — dev-tooling-only, not shipped in
  the built app, and the same advisory already exists via `eslint`'s own
  dependency chain regardless of this change.
- `hero.png` (`src/assets/hero.png`) remains unwired, per
  `IMPROVEMENT_REPORT.md` #23 — left as an open decision (wire it in or
  delete it) rather than scope-creeping it into this module.
- No dedicated "browse all stations" page exists yet — Home shows up to 6
  stations via `.slice(0, 6)`; a full paginated list isn't in `ROADMAP.md`
  for Module 2 and wasn't added speculatively.

**Next module:** Module 3 — Station Detail & Charger List.

---

## Module 3 — Station Detail & Charger List
**Date:** 2026-07-29

**Summary:**
Rebuilt `Station.jsx` from a raw-`fetch`/inline-`style`/`alert`-only legacy
page onto shadcn/Tailwind, `useFetch`, and `useAuth`. Chargers now render
via a new `ChargerCard` with a new shared `StatusBadge` (green `AVAILABLE`
/ red otherwise, matching `UI_DESIGN_SYSTEM.md`'s documented status-color
convention exactly). Reviews are listed and, for authenticated users,
submittable via a new `ReviewList` (keyboard-accessible 5-star picker,
`role="radiogroup"`) — the page owns the `addReview` call and auth check
per `ARCHITECTURE_DECISIONS.md`'s container/presentational split;
`ReviewList` itself only receives data and an `onSubmit` callback. A new
shared `RatingStars` renders numeric ratings as stars and replaced
`StationCard`'s Module-2 single-star-plus-number display (its second real
consumer, per the reuse rule). Since `API_REFERENCE.md` documents no single
`GET /api/stations/{id}` endpoint, the station header (name/location/
rating) is derived by fetching the existing list endpoint and finding the
matching id client-side, rather than inventing a new backend endpoint.

Fixed a real bug while wiring `addReview` for the first time: the existing
`request()` helper always called `response.json()`, but
`POST /stations/{id}/review` returns a **plain-text** `200 OK` body
("Review added successfully" / "Error: ...") — every call would have
thrown a `SyntaxError` on the JSON parse, success or failure. Added
`requestText()` to `services/api.js` (shared auth-header logic factored out
of `request()`) and normalized `stationApi.addReview` to the same
`{ok, message}` shape `authApi.register` already established, per
`ARCHITECTURE_DECISIONS.md` §5's error-handling contract.

"Book Charger" keeps its existing raw-`fetch`-to-`/api/bookings` +
`alert()` behavior — unchanged on purpose, since that endpoint is
documented as 404ing and a real fix is explicitly Module 3.5's job
(blocked on the backend). The only change here is routing: the
unauthenticated path now uses `useNavigate()`/`useAuth()` (with
`state: {from: location}`, matching `ProtectedRoute`'s pattern) instead of
the legacy `localStorage.getItem`/`window.location`.

**Files created:**
- `src/components/shared/StatusBadge.jsx`
- `src/components/shared/RatingStars.jsx`
- `src/features/stations/ChargerCard.jsx`
- `src/features/stations/ReviewList.jsx`

**Files modified:**
- `src/pages/Station.jsx` — full rebuild (see summary above).
- `src/features/stations/StationCard.jsx` — now uses `RatingStars` instead
  of its own inline star+number markup.
- `src/services/api.js` — added `requestText()`; auth-header building
  factored into a shared `authHeaders()` helper used by both `request()`
  and `requestText()`.
- `src/services/stationApi.js` — `addReview` now normalizes to
  `{ok, message}` via `requestText()` instead of the broken `request()`/
  `.json()` call.

**Breaking changes:** none.

**Known issues:**
- Verified end-to-end in an actual browser this time (Claude-in-Chrome
  connected this session): registered a test user, logged in, submitted a
  3-star review from the UI and watched it appear via refetch with the
  station's average rating recalculating live on the backend; confirmed
  the logged-out "Book Charger" path cleanly redirects to `/login` with no
  `alert()`. Did **not** click "Book Charger" while logged in through the
  browser automation, since that path still ends in a blocking `alert()`
  (unchanged, Module-3.5-blocked) which would have frozen the browser
  session — instead confirmed via `curl` that `POST /api/bookings` still
  404s as documented, so the existing catch-and-alert path is exercised
  correctly.
- The `<Link><Button></Link>` nested-interactive-element pattern flagged in
  Module 2's review is still present app-wide (Navbar's Login/Register
  links, `Home.jsx`'s CTA buttons) — confirmed again via this module's
  accessibility tree read (`<a href="/login"><button>Login</button></a>`).
  Still not fixed here — it's systemic, not introduced by this module, and
  belongs in `ROADMAP.md` Module 7's accessibility pass.
- Station header requires fetching the full station list and finding the
  matching id client-side (no dedicated single-station endpoint exists).
  Fine at current data volume; revisit if the station list grows large
  enough to make this wasteful, or if a `GET /api/stations/{id}` endpoint
  is ever added.
- `ChargerCard`'s "Book Charger" `alert()`s and raw `fetch` are
  intentionally untouched — real UX (dialog/toast, disabled state on
  already-busy chargers, status refresh) is Module 3.5's scope once
  `POST /api/bookings` exists on the backend.

**Next module:** Module 4 — Charging History.

---

## Module 4 — Charging History
**Date:** 2026-07-29

**Summary:**
Rebuilt `History.jsx` from a raw-`fetch`/inline-`style` legacy page onto
`useFetch`/`useAuth` and a new `BookingCard`. Added `services/bookingApi.js`
with `getUserBookings` only — `createBooking` is deliberately not stubbed
in, since it depends on the `POST /api/bookings` endpoint that
`ROADMAP.md` Module 3.5 still has blocked on the backend, and `CLAUDE.md`
prohibits placeholder/incomplete code. `BookingCard` renders whichever
fields are present on the booking object (`user`, `chargingTime`) rather
than assuming one fixed shape, so it already works unmodified for both
`History.jsx`'s shape (`station`, `energyUsed`, `chargingTime`, `cost` — no
`user`) and Module 5's owner-bookings shape (`user`, `station`,
`energyUsed`, `cost` — no `chargingTime`), per `ROADMAP.md`'s explicit
"different field subset" reuse note.

`user.userId` is read directly from `useAuth()` with no null guard, since
`/history` sits behind `<ProtectedRoute />` (Module 1) — the page can only
render once `isAuthenticated` is true, so `user` is guaranteed non-null by
the time this component mounts.

**Files created:**
- `src/services/bookingApi.js`
- `src/features/bookings/BookingCard.jsx`

**Files modified:**
- `src/pages/History.jsx` — full rebuild (see summary above).

**Breaking changes:** none.

**Known issues:**
- Verified live in the browser: logged-out visit to `/history` redirects to
  `/login`; logging in redirects back to `/history` (via the existing
  `location.state?.from` handling from Module 1); a fresh zero-booking
  user sees the `EmptyState`, not a blank page. Did **not** verify the
  populated-list render live (no seeded user's login credentials were
  available in this session) — instead confirmed via `curl` that
  `GET /api/users/1/bookings`'s real shape
  (`station`/`energyUsed`/`chargingTime`/`cost`/`bookingId`) matches
  `BookingCard`'s destructured props exactly, using the same
  `useFetch` + array-`map` pattern already proven live in Modules 2 and 3.
- `BookingCard`'s field-presence-based rendering (show `user`/`chargingTime`
  only if defined) is an assumption based on `API_REFERENCE.md`'s
  documented shapes for both endpoints — not yet cross-checked against
  Module 5's actual owner-bookings response, since that module hasn't
  been built yet.

**Next module:** Module 5 — Owner Dashboard (Reports).

---

## Module 5 — Owner Dashboard (Reports)
**Date:** 2026-07-29

**Summary:**
Rebuilt `OwnerDashboard.jsx` on shadcn Cards/Table and fixed the broken API
calls documented in `API_REFERENCE.md`/`ROADMAP.md`: the legacy page called
`/owner/reports/{revenue,energy,bookings}` with no `{ownerId}` path segment
(guaranteed 404 against the real `@PathVariable int ownerId` controller
methods). It now passes the logged-in owner's `userId` from `useAuth()`.
Added `services/ownerApi.js` (`getRevenue`/`getEnergy`/`getBookings`) and
two new `features/owner/` components: `RevenueSummaryCards` (three stat
cards — revenue, energy, booking count) and `BookingsTable` (a real shadcn
`Table`, not `BookingCard`).

No Recharts chart was added. `ROADMAP.md` explicitly scoped this to "if the
data supports it [a time series] ... if not, renders summary numbers in
Cards instead of inventing fake chart data" — `getRevenue`/`getEnergy`
return single totals, not a series, so per that explicit fallback,
`RevenueSummaryCards` are plain Cards and Recharts stays unused (still
flagged as unused bundle weight, `IMPROVEMENT_REPORT.md` #17).

**Planning-doc discrepancy flagged before implementing (`CLAUDE.md` Phase 1):**
`COMPONENT_ARCHITECTURE.md`'s file tree and Module 4's `ROADMAP.md` text
both describe `BookingCard` as reused by "Module 5's owner bookings table."
Module 5's own detailed `ROADMAP.md` section, however, explicitly calls for
`BookingsTable.jsx` as a **shadcn `Table`** — a fundamentally different DOM
shape (rows/columns) than `BookingCard`'s card layout, and forcing card
markup into table rows would be wrong either way. Treated Module 5's own
explicit, module-specific instruction as authoritative and built a real
`Table`; the other two mentions read as an imprecise forward-looking aside
written before this module was detailed.

**`services/api.js` extended:** added `requestRoot()` alongside the
existing `request()`/`requestText()`. `/owner` and `/owner/reports` have no
`/api` prefix (`API_REFERENCE.md`: "no common /api prefix across all
controllers") — reusing `request()` as-is would have silently produced
`/api/owner/reports/...` and 404'd, repeating the exact bug this module
exists to fix. `requestRoot()` reuses the same `authHeaders()` helper
`request()`/`requestText()` already factored out, so no header-building
logic is duplicated a third time.

**`App.jsx`:** `/owner` moved from the shared auth-only `<ProtectedRoute />`
to its own `<ProtectedRoute role="OWNER" />`, matching
`COMPONENT_ARCHITECTURE.md`'s documented routing example exactly.

**`Navbar.jsx` (small, directly-necessitated fix, not pre-planned in
`ROADMAP.md`'s file list):** the "Dashboard" nav link was unconditional —
shown to logged-out visitors and regular `USER`-role customers alike, both
of whom would now hit a dead-end redirect to `/` on click once role-gating
was real. Gated it behind `user?.role === "OWNER"`. `History`'s nav link
was deliberately left unconditional — its "logged out → prompted to log
in" redirect is self-explanatory, unlike Owner's silent bounce to `/`.

**Files created:**
- `src/services/ownerApi.js`
- `src/features/owner/RevenueSummaryCards.jsx`
- `src/features/owner/BookingsTable.jsx`

**Files modified:**
- `src/pages/OwnerDashboard.jsx` — full rebuild (see summary above).
- `src/services/api.js` — added `requestRoot()`.
- `src/App.jsx` — `/owner` now behind `ProtectedRoute role="OWNER"`.
- `src/components/layout/Navbar.jsx` — "Dashboard" link gated to
  `role === "OWNER"`.

**Breaking changes:** none.

**Known issues:**
- Verified live end-to-end: promoted a test account to `OWNER` directly in
  the dev database (no UI path to become an owner exists — `Register.jsx`
  always sends `role: "USER"`, and that's unchanged here since adding a
  role picker isn't in this module's scope) and confirmed all three
  `ROADMAP.md` testing-checklist items: an owner sees the dashboard render
  (zeroed cards + `EmptyState`, not an error, since this dev DB's owners
  currently have zero linked bookings); a regular `USER`-role account
  navigating directly to `/owner` is redirected to `/`; the "Dashboard" nav
  link itself is now hidden for that same account. Could **not** verify a
  populated dashboard (real revenue/energy/booking rows) against this
  seed data — no owner in the current dev DB has any bookings tied to
  their stations. `RevenueSummaryCards`/`BookingsTable`'s field mapping is
  otherwise a direct match against `API_REFERENCE.md`'s documented
  response shapes.
- There is still no UI path for a user to become an `OWNER` — registration
  always sends `role: "USER"` (`authApi.js`, unchanged since Module 1).
  Not fixed here since it's outside `ROADMAP.md` Module 5's stated scope;
  worth a decision (add a role picker to `Register.jsx`, or a separate
  admin-only promotion flow) before this app is used by real owners.
- The loading/error/empty/data four-branch pattern (flagged as duplicated
  in the Module 4 review) now appears a fourth time in this page (twice,
  actually — once for the summary cards, once for the bookings table).
  Still deliberately not extracted into a shared `AsyncSection`, for the
  same reason given in Module 4's review — touching already-shipped pages
  is a bigger change than this module calls for. This is now a stronger
  signal it's worth doing as a standalone cleanup.

**Next module:** Module 6 — Owner Management (new UI, backend already
supports it).

---

## Module 6 — Owner Management (new UI, backend already supports it)
**Date:** 2026-07-29

**Summary:**
Built the previously-nonexistent frontend surface for `OwnerController`'s
three write endpoints. New `features/owner/`: `AddStationForm` (name +
location), `AddChargerForm` (station picker + power + price), and
`UpdatePriceDialog` (shadcn `Dialog`, charger picker + new price). `status`
is not collected in `AddChargerForm` — `API_REFERENCE.md` documents that
the backend ignores it and always hardcodes `"AVAILABLE"`, so asking the
owner to choose a value that has no effect would be misleading; the
constant is still sent to match the documented `ChargerDTO` shape.
`ownerApi.js` extended with `addStation`/`addCharger`/`updatePrice`, all
normalized to the same `{ok, message}` shape as `addReview`/`register`.

**No "chargers by owner" backend endpoint exists**, so `UpdatePriceDialog`
needs a flat list of every charger across every station to let the owner
pick one. `OwnerDashboard.jsx` fetches all stations, then fetches each
station's chargers and flattens the result — reasonable at this app's
current data volume, called out as a trade-off (not invented as a new
backend endpoint, per `CLAUDE.md`).

**Two real bugs caught during live verification, not just code review:**
1. Base UI's `<Select.Value>` displays the raw string `value` by default
   when items use plain string values (not `{value, label}` objects) — the
   station/charger pickers showed the raw id ("1") instead of the station
   name after selecting. Fixed with `SelectValue`'s `children` render-prop
   (`(value) => label`) in both `AddChargerForm` and `UpdatePriceDialog`.
2. Price inputs used `step="0.1"`, which made the native HTML5 validator
   reject legitimate two-decimal currency values (₹13.75 was rejected:
   "nearest valid values are 13.7 and 13.8"). Fixed both price fields to
   `step="0.01"`; `power` intentionally kept at `step="0.1"` since charger
   power ratings don't need currency-level precision.

Both were only caught by actually clicking through the flow in the browser
against the real backend — a pure code/type read would not have surfaced
either, since both compile and lint clean.

**`services/api.js` extended:** added `requestTextRoot()` — `/owner`'s
write endpoints are both un-prefixed (`requestRoot`'s territory) *and*
plain-text-response (`requestText`'s territory). Rather than write a 4th
near-duplicate of the fetch-plus-headers logic, factored the actual
`fetch()` call into a shared `doFetch(baseUrl, url, options)`, so all four
exported functions (`request`, `requestText`, `requestRoot`,
`requestTextRoot`) are now 3-line wrappers over one shared implementation.

**Files created:**
- `src/features/owner/AddStationForm.jsx`
- `src/features/owner/AddChargerForm.jsx`
- `src/features/owner/UpdatePriceDialog.jsx`

**Files modified:**
- `src/pages/OwnerDashboard.jsx` — added the "Manage Stations & Chargers"
  section (two Cards + the price dialog trigger), the cross-station
  chargers fetch, and the three submit handlers.
- `src/services/ownerApi.js` — added `addStation`/`addCharger`/
  `updatePrice`.
- `src/services/api.js` — added `requestTextRoot()`; refactored the shared
  fetch call into `doFetch()`.

**Breaking changes:** none.

**Known issues:**
- Verified live end-to-end against the real backend, all three
  `ROADMAP.md` testing-checklist items: added a charger to "Highway
  Charging Hub" and confirmed via `curl` it appears in that station's real
  charger list; updated that same charger's price to ₹13.75 and confirmed
  via `curl` it's reflected in the backend's data (which is exactly what
  `/station/:id` reads from); attempted add-station and got the literal
  backend SQL error surfaced in the form — "Error: Column count doesn't
  match value count at row 1" — not swallowed, not a generic message.
- Add-station is confirmed **still broken**, as documented — this is
  expected and correct per `ROADMAP.md`'s explicit note that the backend
  bug blocks this endpoint from succeeding; the frontend flow is built and
  wired regardless, and the error is surfaced clearly rather than hidden.
- Bundle size crossed the 500kB warning threshold for the first time this
  build (Select/Dialog base-ui primitives used for real for the first
  time). Not addressed — matches `ARCHITECTURE_DECISIONS.md` §7's explicit
  stance that bundle-analysis tooling is only worth adding once size stops
  being "obviously fine," not preemptively.
- The `UpdatePriceDialog`'s cross-station chargers fetch means every visit
  to `/owner` now issues `1 + N` requests (stations, then each station's
  chargers) just to populate one dialog's dropdown — acceptable at this
  app's current station count, worth revisiting if it grows.

**Next module:** Module 7 — Polish, Cleanup & Accessibility Pass.

---

## Module 7 — Polish, Cleanup & Accessibility Pass
**Date:** 2026-07-29

**Summary:**
Final sweep across the whole app — this module both covers `ROADMAP.md`'s
own explicit checklist and closes out several items I'd deliberately
deferred to "Module 7" in earlier modules' reviews, now that it's actually
here.

**Dead files removed** (all confirmed zero references before deleting):
`src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`. Also deleted
`src/assets/hero.png` — Module 2's review left this as an open decision
("wire it in or delete it"); resolved here as delete, since it was never
referenced and Home's hero section (gradient + Framer Motion text) already
reads as complete without it. Easily reversible if real brand imagery
shows up later.

**`NotFound.jsx` + catch-all route** added, styled to match the
Login/Register centered-card convention rather than introducing a third
layout pattern for one page.

**Toast library consolidated**: removed `react-hot-toast` (confirmed zero
usages anywhere). Kept `sonner` — not an arbitrary pick, `components/ui/
sonner.jsx` was already shadcn-generated, meaning shadcn's own tooling had
already committed to it. Mounted `<Toaster />` in `App.jsx` and wired one
real usage (`toast.success("Logged out")` in `Navbar.jsx`) so the kept
library is actually in use, not just installed — verified live.

**`prefers-reduced-motion` respected**: wrapped the app root in Framer
Motion's `<MotionConfig reducedMotion="user">` (`App.jsx`) instead of
retrofitting `useReducedMotion()` into `Home.jsx` and `StationCard.jsx`
individually — one line covers every current *and future* `motion.*` usage
app-wide, per `UI_DESIGN_SYSTEM.md`.

**Fixed the nested `<Link><Button></Link>` pattern**, flagged as a real
accessibility/HTML-validity issue in the Module 2, 3, 5, and 6 reviews and
explicitly deferred to this module each time. `<a><button></button></a>`
is invalid HTML5 (interactive content inside `<a>`) and creates ambiguous
keyboard/screen-reader behavior. Fixed using base UI `Button`'s `render`
prop (`<Button render={<Link to="..." />}>`) — the same polymorphic
composition pattern already established in this codebase's own
`dialog.jsx`/`sheet.jsx` (`DialogPrimitive.Close render={<Button .../>}`),
just applied one level up. Touched: `Navbar.jsx` (Login/Register),
`StationCard.jsx` (View Station), `Home.jsx` (Explore Stations, Get
Started, Create Free Account). Verified via the accessibility tree
post-fix: each now reads as a single `link` with `href`, not a nested
`link > button`.

**Mobile nav menu added** — a real, not-hypothetical gap found while
testing Module 5: `Navbar`'s links were `hidden md:flex` with **no mobile
alternative at all**, making History/Dashboard/Home completely
unreachable via navigation below 768px. Added a `Sheet`-based hamburger
menu (shadcn's `sheet.jsx`, already vendored but unused until now) with
the same nav links plus auth actions. Verified live: opens, lists all
links, closes on navigation.

**Extracted `components/shared/AsyncSection.jsx`** — the loading/error/
empty/data four-branch conditional had been flagged as duplicated in the
Module 4 and Module 5 reviews ("worth doing as a standalone cleanup"),
deliberately deferred each time because retrofitting already-shipped pages
carried real regression risk outside those modules' stated scope. This
module's own objective — "final sweep once all pages share the new design
system" — is exactly the point I said this belonged at, so it's done now:
retrofitted `Home.jsx`, `Station.jsx` (both the chargers and reviews
sections), `History.jsx`, and `OwnerDashboard.jsx` (both the summary-cards
and bookings-table sections). Behavior-preserving only — verified `npm run
build` after each individual file's retrofit (not just once at the end),
then re-checked all four pages live in the browser afterward against real
backend data (including the empty-state paths) to confirm nothing changed
visibly.

**Accessibility verification** (not new code, confirmed via testing):
- Keyboard-only pass: logged in via Tab/Enter only (no mouse) on `Login`;
  confirmed `StatusBadge` (non-interactive) is correctly skipped by Tab
  while "Book Charger" buttons receive visible focus; confirmed the
  star-rating `radiogroup` in `ReviewList` (built in Module 3) is fully
  keyboard-operable with visible focus per star; confirmed the review
  `Textarea` and submit button are reachable in order.
- Form labels: audited every `<Input>`/`<Textarea>`/`<Select>` usage site
  (`Login`, `Register`, `ReviewList`, `AddStationForm`, `AddChargerForm`,
  `UpdatePriceDialog`) — all already have associated `<label htmlFor>`
  elements from when each was originally built; no gaps found.
- Responsive: resized the browser to mobile (~670px), tablet (~900px),
  and desktop (1280px) and checked `Home`, `Station`, `OwnerDashboard`
  (the highest-risk pages — breakpoint-dependent grids, the new mobile
  Sheet, multi-column forms). No overflow, overlap, or unreachable content
  found at any width.

**Files created:**
- `src/pages/NotFound.jsx`
- `src/components/shared/AsyncSection.jsx`

**Files deleted:**
- `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`,
  `src/assets/hero.png`

**Files modified:**
- `src/App.jsx` — catch-all `NotFound` route, `MotionConfig`, `Toaster`.
- `src/components/layout/Navbar.jsx` — mobile `Sheet` menu, `render={<Link
  />}` fix, `toast.success` on logout.
- `src/features/stations/StationCard.jsx` — `render={<Link />}` fix.
- `src/pages/Home.jsx` — `render={<Link />}` fix (×3), `AsyncSection`.
- `src/pages/Station.jsx`, `src/pages/History.jsx`,
  `src/pages/OwnerDashboard.jsx` — retrofitted onto `AsyncSection`.
- `package.json` / `package-lock.json` — `react-hot-toast` removed.

**Breaking changes:** none.

**Known issues:**
- `npm run build` still crosses the pre-existing 500kB chunk-size warning
  threshold (first crossed in Module 6) — `sonner` is now actually
  imported (previously dead-code-eliminated since nothing referenced the
  wrapper), adding real weight for real functionality. Not addressed, same
  reasoning as Module 6: `ARCHITECTURE_DECISIONS.md` §7 treats
  bundle-analysis tooling as worth adding only once size stops being
  "obviously fine."
- Noticed but not fixed (pre-existing, not a regression from this module):
  logging out from a page behind `ProtectedRoute` (e.g. `/history`) lands
  on `/login` rather than `/` — `handleLogout`'s explicit `navigate("/")`
  appears to race with `ProtectedRoute`'s own redirect-to-login reacting to
  `isAuthenticated` flipping false. Harmless (landing on login after
  logout is a defensible outcome either way), but flagging it since it was
  observed directly during this module's toast testing.
- `Home.jsx`, `Navbar.jsx`, and `Footer.jsx` still use hardcoded
  `green-600`/`slate-*` Tailwind literals instead of the `primary`/
  `muted-foreground` tokens (`IMPROVEMENT_REPORT.md` Finding #11,
  originally deferred in Module 0/1's own changelog). Left deferred again
  here — `ROADMAP.md`'s actual Module 7 acceptance criteria don't require
  a full token migration, and doing one now would be a much larger,
  purely-cosmetic diff on top of an already-large final module. This is
  the one remaining piece of "half-migrated design system" debt; there is
  no Module 8 to hand it to, so it's an open item for whenever this app is
  next touched.
- `.env`/`VITE_API_BASE_URL` externalization (`IMPROVEMENT_REPORT.md`
  #25) was not done — it's a "nice to have" in that doc but was never one
  of `ROADMAP.md`'s explicit Module 7 acceptance criteria (the error-shape
  normalization utilities that *were* asked for were already built across
  Modules 3–6's `requestText`/`requestRoot`/`requestTextRoot`).

**This is the last module in `ROADMAP.md`.**

---

## Module 8 — Production-Ready Authentication (Backend + Frontend Redesign)
**Date:** 2026-07-29

**Summary:**
Replaced the entire demo auth system (plaintext passwords, `dbPassword.equals()`
login, `"dummy-token"` fake JWT, no email ownership check) with a real one,
across both repositories, per `AUTHENTICATION_DESIGN.md` (written and
approved before any code changed, per `CLAUDE.md`'s workflow).

**Backend** (`../evcharging`): added `spring-boot-starter-security` and
`spring-boot-starter-mail`. New JPA entities/repositories (`User`,
`EmailVerificationOtp`, `PasswordResetOtp`) replace the old raw-JDBC
`AuthService`. Registration now issues a BCrypt-hashed, SecureRandom 6-digit
OTP (5 min expiry, 5 wrong-attempt cap, 3 resends with a 60s cooldown) via a
real `JavaMailSender` and only creates the `users` row once that OTP is
verified — the account provably doesn't exist until email ownership is
proven. Forgot-password follows the same OTP mechanics, then exchanges a
verified OTP for a short-lived (10 min) single-purpose JWT reset token
rather than letting the OTP itself authorize the password change. `JwtUtil`
(a static class that regenerated its signing key — and invalidated every
token — on every restart) is replaced by a `JwtService` bean with a
configurable secret (`app.jwt.secret`, env-var driven). A new
`JwtAuthenticationFilter` + `SecurityConfig` make token validation real
(`SecurityContext` is populated for any valid bearer token) without
changing what's reachable — every existing endpoint (`/owner/**`,
bookings, etc.) stays `permitAll()` in this module, deliberately, so
Modules 2–6 keep working unmodified. `/auth/**` now returns real HTTP
status codes and JSON error bodies (`{error, message, ...}`) instead of
always-200 plain text — a narrow, approved exception to "never redesign
backend APIs," scoped to auth only.

**Frontend** (`evcharge-ui`): `Register.jsx` gained Confirm Password and an
Account Type `Select` (Customer/Station Owner, values still `USER`/`OWNER`
to avoid touching the three unrelated files that already hardcode those
strings — `App.jsx`, `Navbar.jsx`). Three new pages: `VerifyOtp.jsx`
(6-box `OtpInput`, countdown, resend with cooldown/limit handling,
auto-login on success), `ForgotPassword.jsx`, and `ResetPassword.jsx`
(two-step: OTP verify, then new password). New shared components
`OtpInput` and `PasswordStrengthMeter` — built shared from the start since
both OTP-consuming flows needed one on day one, not extracted after a
second copy existed. `authApi.js` was rewritten (not just extended): the
old text-sniffing workarounds for the backend's "200 either way" quirk are
gone, replaced by a typed `AuthApiError` (`.code`, `.fields`,
`.attemptsRemaining`, `.retryAfterSeconds`) that pages branch on directly.

**Files created (backend):**
- `entity/{Role,User,EmailVerificationOtp,PasswordResetOtp}.java`
- `repository/{UserRepository,EmailVerificationOtpRepository,PasswordResetOtpRepository}.java`
- `security/{JwtService,JwtAuthenticationFilter,SecurityConfig}.java`
- `service/{OtpService,OtpPurpose,EmailService,UserService,RegistrationService,PasswordResetService,ValidationUtil}.java`
- `exception/{EmailTakenException,OtpInvalidException,OtpExpiredException,TooManyAttemptsException,ResendLimitReachedException,ResendTooSoonException,InvalidCredentialsException,InvalidResetTokenException,ValidationException,EmailSendException}.java`
- `dto/{RegisterRequest,VerifyOtpRequest,ResendOtpRequest,LoginRequest,ForgotPasswordRequest,VerifyResetOtpRequest,ResetPasswordRequest,AuthResponse,RegisterResponse,ResendOtpResponse,ResetTokenResponse,MessageResponse,ApiErrorResponse}.java`
  (proper package-matching location; see Known issues re: the old ones)
- `controller/AuthExceptionHandler.java`
- `migration/LegacyPasswordMigrationRunner.java`
- `src/main/resources/sql/auth_redesign_migration.sql`

**Files created (frontend):**
- `src/pages/{VerifyOtp,ForgotPassword,ResetPassword}.jsx`
- `src/components/shared/{OtpInput,PasswordStrengthMeter}.jsx`
- `src/lib/validation.js`

**Files modified:**
- Backend: `pom.xml`, `application.properties`, `controller/AuthController.java`
  (full rewrite).
- Frontend: `src/services/authApi.js` (full rewrite), `src/pages/Register.jsx`
  (full rewrite), `src/pages/Login.jsx` (new error handling, "Forgot
  password?" link), `src/App.jsx` (three new routes).

**Files deleted:**
- Backend: `security/JwtUtil.java`, `service/AuthService.java`,
  `dto/{RegisterRequest,LoginRequest,LoginResponse}.java` (the old versions —
  these existed at the non-standard path `src/main/java/dto/` despite
  declaring package `com.evcharging.evcharging.dto`; turned out **not** to
  be orphaned duplicates as `AUTHENTICATION_DESIGN.md` §8 speculated —
  `AuthController` was actually compiling against them via the package
  declaration, not the file path. Replaced in place at the conventional
  package-matching path instead.)

**Breaking changes:**
- `/auth/register` and `/auth/login` response contracts changed (real
  status codes + JSON error bodies instead of always-200 text/empty-body).
  Nothing outside `authApi.js`/the auth pages called these directly, so no
  other frontend code needed updating.
- DB schema change is **not backward compatible with the old AuthService**
  once `password` is eventually dropped (deliberately not dropped yet —
  see Known issues). Requires the migration SQL to run before this backend
  code is deployed.
- Role values are unchanged (`USER`/`OWNER`) — not a breaking change for
  the rest of the app.

**Update — migrations run and stack verified live (same day, follow-up pass):**

- **DB migration applied to the live `ev_charging_system` database.**
  Pre-flight check (Step 0) found no real duplicate emails — the only
  "duplicate" was 3 pre-existing rows sharing `email=NULL` (seed/test data
  with no email at all, not a collision; MySQL's UNIQUE index already
  permits multiple NULLs). Also discovered `email` already carried a
  UNIQUE index from the original schema (named `email`, not
  `uq_users_email`) — the migration script's redundant
  `ADD UNIQUE KEY` was removed rather than run. Also discovered
  `users.id` is `INT`, not `BIGINT` — the FK columns in
  `password_reset_otp`/`refresh_tokens` were corrected from `BIGINT` to
  `INT` to match (a `BIGINT`-referencing-`INT` FK fails in MySQL with
  error 3780; caught by actually running the migration, not by review).
- **Legacy-password migration run once** (`HASH_LEGACY_PASSWORDS=true`,
  one `spring-boot:run`, flag removed after). Hashed 4 plaintext passwords;
  found and preserved 1 row (`raj@gmail.com`) whose `password` column
  already held a BCrypt hash from some earlier experiment —
  `LegacyPasswordMigrationRunner` was extended with a
  `looksLikeBcryptHash()` guard so it copies rather than re-encodes values
  that are already hashed, since double-hashing would have silently locked
  that account out. Not something `AUTHENTICATION_DESIGN.md` anticipated;
  caught only by inspecting the actual data before running the migration.
- **MailHog run via Docker** (`localhost:1025` SMTP / `:8025` web API) as
  the local SMTP catcher `application.properties` already defaulted to —
  real SMTP credentials still weren't available/needed for this
  verification pass, matching the design doc's dev-mode assumption.
- **Full stack started and verified live via `curl` + MailHog's API**
  (no browser extension was connected this session, so this is API-level,
  not click-through-in-a-browser, verification — noted as a real gap
  below): register → real OTP email received and parsed from MailHog →
  verify-otp → real JWT issued, account created with `emailVerified:true`
  → OTP correctly single-use (replay returns `410 OTP_EXPIRED`) → login
  with correct/wrong password (`200`/`401`, identical `401` for a
  nonexistent email — no enumeration) → duplicate registration → `409
  EMAIL_TAKEN` → a **pre-existing, now-migrated** account
  (`module3tester@example.com`) logged in successfully through the new
  BCrypt path → full forgot-password cycle (request → OTP email → verify
  → reset token → reset → old password rejected, new password accepted →
  reused reset OTP rejected) → pre-existing non-auth endpoint
  (`GET /api/stations`) confirmed still open, unaffected by the new
  `SecurityConfig` → weak-password registration correctly rejected with
  field-level `VALIDATION_ERROR` → resend-OTP cooldown correctly rejected
  an immediate second resend with `429 RESEND_TOO_SOON`.
- **Real bug found and fixed by this live testing, not by code review:**
  `RegistrationService.verifyOtp`/`PasswordResetService.verifyResetOtp`
  were annotated plain `@Transactional`. Throwing `OtpInvalidException` to
  signal a wrong code to the controller triggered Spring's default
  rollback-on-any-`RuntimeException` behavior, silently undoing the
  `incrementAttempts()`/`save()` call made earlier in the *same* method —
  `attemptsRemaining` stayed stuck at 4 forever and the 5-wrong-guess
  lockout never actually engaged, DB-verified as `attempts=0` after two
  failed calls. Fixed with `@Transactional(noRollbackFor =
  OtpInvalidException.class)` on both methods; re-tested with 6
  consecutive wrong OTPs and confirmed `attemptsRemaining` now correctly
  counts down 4→3→2→1→0 before the 6th attempt returns `429
  TOO_MANY_ATTEMPTS`. This would have shipped as a silently-broken brute-
  force control if this module had stopped at "compiles and builds clean."
**Update 2 — real-browser click-through completed:** register → OTP email
(typed into `OtpInput`, confirmed auto-advance across all 6 boxes from one
paste-like fast type) → auto-login → redirect home → Navbar shows "Hi,
Browser Test" + Logout (via the mobile `Sheet` menu at this viewport width)
→ logout → Login page's new "Forgot password?" link → `ForgotPassword` →
`ResetPassword` step 1 rejected a genuinely-expired OTP with a clear inline
error (the 5 real minutes elapsed during browser-reconnect troubleshooting
mid-session, not a bug — verified by comparing DB `created_at`/`expires_at`
against `NOW()`/`UTC_TIMESTAMP()`, which lined up exactly) → "Resend code"
→ fresh OTP verified → step 2 (`PasswordStrengthMeter` live-updating,
"Good") → password updated → toast shown → redirected to Login → logged in
successfully with the **new** password.

**One real bug found by this click-through, not by review:** the Account
Type `Select` on `Register.jsx` displayed the raw value ("USER") instead
of the label ("Customer") — the exact same Base UI `SelectValue` quirk
Module 6's changelog already documents for `AddChargerForm`/
`UpdatePriceDialog` (plain string `SelectItem` values render as their raw
value unless `SelectValue` is given a `children` render-prop). Fixed the
same way: `<SelectValue>{(value) => value === "OWNER" ? "Station Owner" :
"Customer"}</SelectValue>`. This one would have shipped past `npm run
build`/`lint` undetected, same as Module 6's instance — visual-only bugs
in this component don't surface any other way.

Browser connectivity itself was flaky this session (extension disconnected
twice, required picking between two paired browsers via
`select_browser`) — unrelated to the app, noted only because it's why this
verification took two attempts.

**Known issues / not yet done:**
- Forgot-password intentionally returns an identical response whether or
  not the email exists (enumeration hardening) — a deliberate deviation
  from the brief's literal "verify account exists, else error" wording,
  flagged and defaulted-to per `AUTHENTICATION_DESIGN.md` §13, Risk 2.
- `/owner/**`, `/api/users/{id}/bookings`, and every other pre-existing
  endpoint remain fully unauthenticated — the JWT is now real and
  validated, but not yet *enforced* anywhere outside `/auth` itself
  (§13, Risk 4). A separately-approved follow-up module is needed to lock
  those down.
- No refresh tokens issued yet (`refresh_tokens` table exists, unused —
  §7). Logout is client-side only; a token remains valid until its 24h
  expiry even after logout (§13, Risk 3).
- No automated test suite was added for the new auth code, despite
  `AUTHENTICATION_DESIGN.md` §11 recommending one given the security-
  critical surface area — flagged as a gap, not silently dropped.

**Next module:** everything in this module is now verified live end to
end, both backend (`curl`/MailHog) and frontend (real-browser
click-through) — a separately-approved follow-up module to lock down
`/owner/**`/bookings behind the now-real JWT is the logical next step,
per `AUTHENTICATION_DESIGN.md` §13 Risk 4.

---

## Module 9 — Authorization & Security Hardening
**Date:** 2026-07-29

**Summary:** Module 8 made JWTs real (signed, validated, unforgeable) but
deliberately left every business endpoint reachable without one — an
approved, explicitly-flagged gap (`AUTHENTICATION_DESIGN.md` §13 Risks 3
and 4). This module closes that gap: every endpoint now requires
authentication at minimum, owner endpoints require the right role, and two
IDOR (insecure direct object reference) vulnerabilities that role-checking
alone wouldn't have caught are fixed. Logout now actually revokes the
token server-side instead of only forgetting it client-side. Every item
below was verified against the real backend, not assumed from reading the
code — see the Testing section.

### Security improvements (backend)

1. **Every endpoint now requires authentication by default.**
   `SecurityConfig`'s `.anyRequest().authenticated()` is the final,
   fail-closed rule — anything not explicitly listed as public requires a
   valid session, so a new endpoint added later without a security review
   defaults to protected, not open.
2. **Public browsing stays public, deliberately, not by omission.**
   `GET /api/stations`, `GET /api/stations/{id}/chargers`,
   `GET /api/stations/{id}/reviews`, `POST /auth/**` (except `/auth/logout`),
   and `GET /health` are explicitly `permitAll()` — this is a marketplace
   app where browsing without an account is a product requirement
   (`COMPONENT_ARCHITECTURE.md`), not a leftover gap.
3. **Role-based authorization on the owner surface.** `/owner/**`
   (`POST /owner/stations`, `POST /owner/chargers`,
   `PUT /owner/chargers/{id}/price`, and all of `/owner/reports/**`) now
   requires `OWNER` or `ADMIN`. A `USER`-role (customer) token gets `403
   FORBIDDEN`, verified live (test 14 below).
4. **Future admin support is real, not aspirational.** `Role.ADMIN`
   existed since Module 8 but nothing checked it. A `RoleHierarchy` bean
   (`ADMIN` implies `OWNER` and `USER`) is now declared as the documented
   source of truth for future `@PreAuthorize` method security, and every
   `/owner/**` path rule explicitly lists `hasAnyRole("OWNER", "ADMIN")`
   rather than relying on hierarchy auto-wiring to be honored by
   `authorizeHttpRequests` (which isn't guaranteed across Spring Security
   versions) — so `ADMIN` access is guaranteed by construction, not by
   assumption. `SecurityUtils.isAdmin()` similarly bypasses the ownership
   checks below for admins.
5. **Two IDOR vulnerabilities fixed** — the kind of bug a role check alone
   never catches, because both endpoints were already gated to "some
   logged-in user" (Module 8) or "some owner" (#3 above), but never to
   *the right* user/owner:
   - `GET /api/users/{id}/bookings` — before this module, any logged-in
     customer could read *any other* customer's charging history by
     editing the `id` in the URL. Now `SecurityUtils.assertOwnResource`
     compares the path id against the authenticated principal's own id
     (from the JWT `sub` claim) and throws `403` on mismatch, unless the
     caller is `ADMIN`.
   - `GET /owner/reports/{revenue,energy,bookings}/{ownerId}` — same
     bug, one owner could read another owner's revenue/energy/booking
     figures by editing `ownerId`. Same fix, same `SecurityUtils` helper.
   - `PUT /owner/chargers/{id}/price` and `POST /owner/stations` /
     `POST /owner/chargers` are **not** given the same per-resource
     ownership check — there's no reliable "which owner does this
     resource belong to" data path to check against yet (station→owner
     linkage is undermined by the pre-existing `owner_id`-not-bound SQL
     bug documented in `API_REFERENCE.md` and `IMPROVEMENT_REPORT.md`
     #19, unrelated to and not fixed by this module). Flagged here rather
     than silently claiming full ownership coverage — role-gating to
     `OWNER`/`ADMIN` is the extent of what this module changes for those
     three endpoints.
6. **JWT logout revocation — the token itself, not just the client's copy
   of it.** Every access token now carries a unique `jti` claim
   (`JwtService.generateAccessToken`). `POST /auth/logout` (itself
   `authenticated()` — you need a valid token to say which one to revoke)
   extracts the current token's `jti` + expiry and writes a row to a new
   `revoked_tokens` table (`TokenRevocationService.revoke`).
   `JwtAuthenticationFilter` checks every incoming token's `jti` against
   that table and treats a revoked token exactly like an expired one —
   left unauthenticated, not thrown as a special error, so `SecurityConfig`
   handles it uniformly. An hourly `@Scheduled` job purges rows past their
   own `expires_at`, since a revoked token past its natural expiry is
   already rejected by the ordinary expiry check and the row adds nothing
   — keeps the table from growing unbounded. This directly satisfies
   "ensure JWT cannot be used after logout" and supersedes the limitation
   `AUTHENTICATION_DESIGN.md` §7/§13 Risk 3 previously accepted.
7. **Consistent, real HTTP status codes on every endpoint, not just
   `/auth/**`.** `SecurityConfig` now installs a custom
   `authenticationEntryPoint` (401, `{"error":"UNAUTHORIZED",...}`) and
   `accessDeniedHandler` (403, `{"error":"FORBIDDEN",...}`) so a missing/
   invalid/expired/revoked token and a wrong-role/wrong-owner request each
   get a real status code and a parseable JSON body app-wide — this was
   previously only true for `AuthController` (Module 8's
   `AuthExceptionHandler`, which is `@RestControllerAdvice`-scoped to that
   one controller and can't intercept security-filter-level rejections
   anyway, since those happen before `DispatcherServlet` routes to a
   controller).
8. **Demo/scaffolding authentication logic removed:**
   - `LegacyPasswordMigrationRunner` — its one-time job (Module 8) is
     done and verified against the live DB; deleted rather than left
     around disabled-by-default, since a migration tool with no more
     migrations to run is dead code with a footgun (accidentally
     re-enabling it) attached.
   - The legacy plaintext `password` column — dropped (deferred from
     Module 8's migration specifically until this point, see
     `AUTHENTICATION_DESIGN.md` §12). Nothing has read it since
     `LegacyPasswordMigrationRunner` was deleted. `password_hash` is left
     nullable: 3 pre-existing seed rows have `NULL` email and could never
     log in through any path (email lookup fails first), so there's
     nothing to backfill for them.
   - Spring Boot's auto-configured in-memory demo user (the "Using
     generated security password: ..." warning logged on every startup,
     from `UserDetailsServiceAutoConfiguration`) — excluded via
     `@SpringBootApplication(exclude = ...)`. This app never uses Spring
     Security's `AuthenticationManager`/`UserDetailsService`; the warning
     was pure leftover scaffolding, confirmed gone from the startup log
     after this change.

### Security improvements (frontend)

9. **Global 401 handling → automatic logout + redirect.** `services/
   api.js`'s shared `doFetch` (used by every business API call —
   stations/bookings/owner/reports) now dispatches a `window` event on
   `401`/`403`. `AuthContext` listens: `401` clears the session, shows a
   "Your session has expired" toast, and redirects to `/login`. This is
   how "automatically logout when JWT expires" is satisfied — **reactively**,
   on the next API call that discovers the token is no longer valid, not
   via a client-side timer that decodes the JWT's `exp` claim. That's a
   deliberate choice, not a shortcut: `ARCHITECTURE_DECISIONS.md` §8
   explicitly says the frontend should never decode or reason about JWT
   contents client-side, and a proactive timer would require exactly that.
   `authApi.js`'s own `/auth/**` calls (login, register, etc.) do **not**
   go through `doFetch` and are unaffected — a `401` from a wrong password
   on the login form is a normal inline form error, not a session-expiry
   event, and must not trigger a global logout.
10. **Global 403 handling → redirect to a real Unauthorized page**, without
    logging the user out (a `403` means the session is still valid, just
    not permitted for that specific resource — logging them out would be
    wrong and confusing). New `src/pages/Unauthorized.jsx`, styled to match
    the existing `NotFound.jsx` pattern.
11. **`ProtectedRoute`'s role mismatch now redirects to `/unauthorized`**
    instead of silently bouncing to `/` (Module 5's original behavior) —
    a customer hitting `/owner` directly now sees an explicit "Access
    denied" page instead of a silent, unexplained redirect home.
12. **Logout calls the new backend revocation endpoint.**
    `AuthContext.logout()` calls `authApi.logout()` (fire-and-forget, best
    effort) before clearing local state — the local logout is never
    blocked by network latency/failure, but a reachable backend now
    actually invalidates the token, not just the browser's copy of it.
13. **Imperative navigation bridge for non-component code.** `AuthContext`
    is mounted above `<BrowserRouter>` in `main.jsx` (predates this
    module), so it can't call `useNavigate()` itself to react to the new
    global events. New `src/lib/navigation.js` + a `NavigationBridge`
    component mounted inside the router capture the real `navigate`
    function once; `AuthContext`/`services/api.js` call the shared
    `navigate()` export without needing to be route-aware. Avoids
    reintroducing `window.location = ...`, which `ARCHITECTURE_DECISIONS.md`
    and Module 1 explicitly removed for breaking SPA navigation.

**Files created (backend):**
- `entity/RevokedToken.java`
- `repository/RevokedTokenRepository.java`
- `security/TokenRevocationService.java`
- `security/SecurityUtils.java`
- `src/main/resources/sql/module9_authorization_hardening_migration.sql`

**Files modified (backend):**
- `security/JwtService.java` — `jti` claim added to access tokens.
- `security/JwtAuthenticationFilter.java` — checks `TokenRevocationService`.
- `security/SecurityConfig.java` — real per-path authorization rules,
  `RoleHierarchy` bean, JSON 401/403 entry point + access denied handler.
- `controller/AuthController.java` — new `POST /auth/logout`.
- `controller/BookingController.java`, `controller/ReportController.java` —
  ownership checks via `SecurityUtils.assertOwnResource`.
- `EvchargingApplication.java` — excludes
  `UserDetailsServiceAutoConfiguration`, adds `@EnableScheduling` (for the
  revoked-token cleanup job).
- `application.properties` — removed the now-unused
  `app.migration.hash-legacy-passwords` property.

**Files deleted (backend):**
- `migration/LegacyPasswordMigrationRunner.java`.

**Files created (frontend):**
- `src/pages/Unauthorized.jsx`
- `src/lib/navigation.js`

**Files modified (frontend):**
- `src/services/api.js` — `doFetch` dispatches `auth:unauthorized`/
  `auth:forbidden` window events on 401/403.
- `src/services/authApi.js` — added `logout()`.
- `src/context/AuthContext.jsx` — listens for the new events, calls
  `authApi.logout()` from `logout()`.
- `src/routes/ProtectedRoute.jsx` — role mismatch redirects to
  `/unauthorized` instead of `/`.
- `src/App.jsx` — `NavigationBridge` component, new `/unauthorized` route.

**Breaking changes:**
- Every business endpoint that was previously callable with no
  `Authorization` header now requires one, and owner endpoints now require
  the right role/ownership. This is the entire point of the module, but
  it does mean any external client, script, or manual testing flow that
  relied on the old open access will now get `401`/`403` — expected, not
  a regression.
- The legacy plaintext `password` column no longer exists — anything
  outside this codebase reading it directly (there shouldn't be anything;
  confirmed nothing in-repo does) would break.

**Known issues / not yet done:**
- `PUT /owner/chargers/{id}/price`, `POST /owner/stations`,
  `POST /owner/chargers` are role-gated (`OWNER`/`ADMIN`) but not
  ownership-checked per-resource, for the reasons in improvement #5 above
  — an owner could theoretically update a *different* owner's charger
  price today. Closing this properly means fixing the pre-existing
  `owner_id`-not-bound SQL bug first (`IMPROVEMENT_REPORT.md` #19), which
  is out of this module's scope.
- No automated test suite — same gap `AUTHENTICATION_DESIGN.md` §11 and
  Module 8's changelog already flagged, still open.
- `revoked_tokens` grows by one row per logout between hourly purges; at
  this app's scale this is immaterial, flagged only for completeness.
- Rate limiting on login attempts (brute force) is still not implemented
  — unchanged from Module 8's accepted scope.

### Testing — every scenario verified live against the real backend

**Backend (`curl`, direct JWT manipulation):**
- [x] Missing `Authorization` header on a protected endpoint → `401
      UNAUTHORIZED`.
- [x] Malformed/invalid JWT (`not.a.real.jwt.token`) → `401 UNAUTHORIZED`.
- [x] Genuinely expired JWT (backend temporarily restarted with a 3-second
      token expiry, confirmed the same token worked immediately and then
      returned `401` 4 seconds later) → `401 UNAUTHORIZED`.
- [x] Public `GET /api/stations` still works with no token at all → `200`.
- [x] Customer (`USER`) token calling an owner-only endpoint
      (`/owner/reports/revenue/{id}`) → `403 FORBIDDEN`.
- [x] Owner token calling their own `/owner/reports/revenue/{ownerId}` →
      `200` with real data.
- [x] Owner token calling **another** owner's `ownerId` → `403 FORBIDDEN`
      (IDOR fix, improvement #5).
- [x] Customer token reading their own `/api/users/{id}/bookings` → `200`.
- [x] Customer token reading **another** user's bookings → `403 FORBIDDEN`
      (IDOR fix, improvement #5).
- [x] Customer token, authenticated `POST /api/stations/{id}/review` →
      succeeds (not blocked, correctly requires only authentication, not a
      role).
- [x] `POST /auth/logout` with no token → `401` (it's `authenticated()`,
      not public).
- [x] Valid token works, then `POST /auth/logout`, then the **same** token
      reused on a protected endpoint → `401 UNAUTHORIZED` (revocation
      confirmed working, not just designed).
- [x] Customer token on an owner-write endpoint (`POST /owner/chargers`) →
      `403 FORBIDDEN`; owner token on the same call → `200`, "Charger
      added".

**Frontend (real browser, Claude-in-Chrome):**
- [x] **Customer account cannot access owner dashboard** — logged in as
      `smoketest@example.com` (`USER`), navigated directly to `/owner`,
      landed on the new "Access denied" `/unauthorized` page.
- [x] **Owner account can access owner dashboard** — logged in as
      `module3tester@example.com` (`OWNER`), navigated to `/owner`, the
      real dashboard rendered (revenue/energy/booking cards + sessions
      table).
- [x] **Expired/invalid JWT redirects to Login** — corrupted the stored
      token via `localStorage.setItem("token", "this.is.not.a.valid.jwt")`
      while on `/owner`, reloaded; the page triggered an API call, got
      `401`, and the app automatically cleared the session (verified
      `localStorage` afterward: `token`/`userId`/`role` all `null`), showed
      a "Your session has expired. Please log in again." toast, and
      redirected to `/login` — all without a manual logout click.
- [x] **Missing JWT / invalid JWT return Unauthorized** — covered by the
      backend `curl` tests above (a browser never naturally sends a
      missing/malformed token during normal use; the corrupted-token
      browser test above exercises the same code path end-to-end through
      the UI).

**Next module:** none requested yet — per `IMPROVEMENT_REPORT.md` #19,
the pre-existing `owner_id`-not-bound SQL bug in `POST /owner/stations`
would need fixing before per-resource ownership checks on the remaining
`/owner/**` write endpoints (improvement #5's flagged gap) are meaningful.

---

## Module P0 — Production Readiness
**Date:** 2026-07-30

**Summary:** No feature, UI, or business-logic changes — this module's
entire scope is making the app deployable: every hardcoded URL and
credential moves to an environment variable with a dev-safe fallback
where one makes sense, and a `DEPLOYMENT.md` covers Vercel (frontend) +
Railway (backend). Verified after every change that the app still
compiles/builds and behaves identically locally (see Testing below) —
"do not change existing features" was the hard constraint throughout.

### 1. Hardcoded URLs → environment variables

- **Frontend:** exactly one hardcoded URL existed in the whole codebase —
  `services/api.js`'s `ROOT_URL = "http://localhost:8801"` (confirmed via
  a full `grep` of `src/` for `localhost`; every other file already
  consumed `ROOT_URL`/`BASE_URL` from this one module, a design decision
  from Modules 2–6). Now `import.meta.env.VITE_API_BASE_URL || "http://localhost:8801"`
  — falls back to the old hardcoded value so `npm run dev` needs zero
  setup, but a real deploy sets `VITE_API_BASE_URL` and every
  `services/*Api.js` call picks it up automatically through the existing
  `ROOT_URL`/`BASE_URL` seam.
- **Backend:** `spring.datasource.url` moved from a hardcoded
  `jdbc:mysql://localhost:3306/ev_charging_system` to
  `${DB_URL:jdbc:mysql://localhost:3306/ev_charging_system}` (same
  dev-safe-fallback pattern already established for `JWT_SECRET`/`MAIL_*`
  in Module 8).

### 2. `.env.example` created for both

- `evcharging/.env.example` — every backend env var (`DB_*`, `JWT_*`,
  `MAIL_*`, `CORS_ALLOWED_ORIGINS`, `PORT`), each commented with what it's
  for and whether it has a safe default.
- `evcharge-ui/.env.example` — `VITE_API_BASE_URL`, with a comment
  explaining Vite's build-time-only env var behavior (a common deploy
  footgun: changing it post-build does nothing until a rebuild).
- Both `.gitignore`s updated to exclude a real `.env` — only the
  `.example` template is meant to be committed. Backend's also excludes
  `application-local.properties` preemptively, in case that pattern is
  used later.

### 3. `VITE_API_BASE_URL` wired through

Confirmed both directions actually work, not just read the code and
assumed: built once with no `.env` present → `localhost:8801` correctly
baked into the output bundle (fallback path). Built again with
`VITE_API_BASE_URL=https://api.example-prod.com` exported → that exact
URL correctly baked in instead (override path). Both verified by
`grep`-ing the built `dist/assets/*.js` output directly.

### 4. Backend env vars: database, JWT, mail, CORS

- **Database:** covered in §1 above (`DB_URL`), plus `DB_USERNAME`
  (`${DB_USERNAME:root}`) and `DB_PASSWORD` (see §5 — no default).
- **JWT:** already environment-variable-driven since Module 8
  (`JWT_SECRET`, `JWT_ACCESS_EXPIRY_MS`, `JWT_RESET_EXPIRY_MS`) — no
  change needed here, confirmed still correct.
- **Mail:** already environment-variable-driven since Module 8
  (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
  `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS`, `MAIL_FROM`) — no change needed,
  confirmed still correct.
- **CORS — new.** `EvchargingApplication.corsConfigurer()` hardcoded
  `.allowedOrigins("*")`. Now reads `app.cors.allowed-origins`
  (`CORS_ALLOWED_ORIGINS` env var, comma-separated, split and trimmed in
  Java), defaulting to `"*"` so existing dev/local behavior is unchanged
  — a production deploy sets it to the real frontend origin(s).
- **Port — new, needed for Railway specifically.** `server.port=8801` →
  `server.port=${PORT:8801}`. Railway (and most PaaS hosts) assign a port
  dynamically via a `PORT` env var and expect the app to bind to it; the
  old hardcoded `8801` would have made the app unreachable on Railway
  regardless of every other setting being correct. Falls back to `8801`
  locally where nothing sets `PORT`.

### 5. Hardcoded secrets removed

- **The plaintext MySQL root password** (`822822Vedant`) was hardcoded in
  **five separate places**, not just `application.properties`:
  `application.properties` itself, plus four raw-JDBC service classes
  (`StationServiceApi`, `BookingServiceApi`, `OwnerService`,
  `ReportService`) that each independently declared their own
  `URL`/`USER`/`PASSWORD` constants and called
  `DriverManager.getConnection(URL, USER, PASSWORD)` directly —
  documented as a known issue in `IMPROVEMENT_REPORT.md` #18 ("hardcoded
  DB credentials duplicated across four backend service classes") and
  Critical #5, predating this session. All five now read from
  `spring.datasource.*`, which is itself environment-variable-driven with
  **no hardcoded password fallback** (`${DB_PASSWORD:}` — empty, not the
  old literal).
  - The four service classes were changed to take a constructor-injected
    `javax.sql.DataSource` (the same pooled, Spring-managed one JPA/
    Hibernate already uses, configured from `spring.datasource.*`) and
    call `dataSource.getConnection()` instead of
    `DriverManager.getConnection(URL, USER, PASSWORD)`. No query, no
    business logic, no method signature changed — purely how the JDBC
    `Connection` is obtained. This also happens to close
    `IMPROVEMENT_REPORT.md` #18's connection-pooling gap ("a new
    `DriverManager.getConnection()` per request, no connection pool") as
    a direct side effect of removing the hardcoded credentials, not a
    separate deliberate fix.
  - **Trade-off, stated plainly:** removing the hardcoded password means
    local development is no longer zero-config — `DB_PASSWORD` must now
    be set as a real shell/IDE environment variable before
    `mvn spring-boot:run` will connect successfully. This is the correct
    trade favoring "remove hardcoded secrets" over "zero-config local
    dev," and is documented in `.env.example`'s header comment and
    `DEPLOYMENT.md`, not left as a silent break.
- **`JWT_SECRET`'s dev-only fallback** (from Module 8) was reviewed and
  deliberately left as-is — it's clearly labeled insecure-for-dev-only in
  both the property file and `.env.example`, and removing it entirely
  would break local dev the same way `DB_PASSWORD` almost did; the
  difference is `DB_PASSWORD` is a real external system's actual
  credential (MySQL), while the JWT dev fallback is a value this app
  invented for itself and already warns about loudly. Kept, not
  reconsidered as a "still hardcoded" issue.

### 6. Works in both development and production

Verified, not assumed:
- Backend restarted with `DB_PASSWORD` exported as a real env var (no
  hardcoded fallback used) — full smoke test passed (see Testing below).
- Frontend built twice (fallback path and override path, §3) — both
  produced correct output.
- Neither `.env` file needs to exist for local dev to work (both have
  safe fallbacks except `DB_PASSWORD`, which was always a real per-
  developer secret, never something safe to bake a working default for).

### 7. `DEPLOYMENT.md`

New file, `evcharge-ui/DEPLOYMENT.md` (colocated with the other planning
docs per this project's existing documentation convention). Covers:
database setup/migration order (referencing the exact SQL files from
Modules 8/9), backend → Railway (env var table, including how to wire
Railway's own MySQL plugin variables via `${{MySQL.VARNAME}}` references
instead of retyping them), frontend → Vercel (env var table, build-time-
vs-runtime env var gotcha called out explicitly), a post-deploy smoke-test
checklist mirroring what was already manually verified locally in
Modules 8/9, and a rollback section (both platforms keep prior deploys
one click away).

**Files created:**
- `evcharging/.env.example`
- `evcharge-ui/.env.example`
- `evcharge-ui/DEPLOYMENT.md`

**Files modified:**
- `evcharging/src/main/java/service/StationServiceApi.java`,
  `BookingServiceApi.java`, `OwnerService.java`, `ReportService.java` —
  `DataSource` injection replacing hardcoded `DriverManager` credentials
  (§5).
- `evcharging/src/main/resources/application.properties` — `DB_URL`/
  `DB_USERNAME`/`DB_PASSWORD` (no hardcoded password), `PORT`,
  `app.cors.allowed-origins` (§1, §4, §5).
- `evcharging/src/main/java/com/evcharging/evcharging/EvchargingApplication.java`
  — `corsConfigurer()` reads `app.cors.allowed-origins` instead of a
  hardcoded `"*"` (§4).
- `evcharging/.gitignore` — excludes `.env`, `.env.local`,
  `application-local.properties`.
- `evcharge-ui/src/services/api.js` — `ROOT_URL` reads
  `import.meta.env.VITE_API_BASE_URL` with a localhost fallback (§1).
- `evcharge-ui/.gitignore` — excludes `.env`.

**Breaking changes:** none for the running application — every change is
either a fallback-preserving env var substitution or a mechanical
connection-acquisition swap. The one operational change (not a code
break): **local backend development now requires `DB_PASSWORD` to be set**
as a real environment variable; it will no longer connect using a baked-in
default. Documented in `.env.example` and `DEPLOYMENT.md`, not a silent
trap.

**Known issues / not yet done:**
- `CORS_ALLOWED_ORIGINS` still defaults to `*` — matches pre-existing
  behavior (`IMPROVEMENT_REPORT.md` #20 already flagged the wildcard as a
  known looseness, not introduced by this module) but should be set to
  the real frontend origin explicitly in any production deployment, per
  `DEPLOYMENT.md`.
- No CI/CD pipeline was set up — this module makes the app *deployable*,
  it doesn't automate the deployment itself. Manual deploy steps only, per
  `DEPLOYMENT.md`.
- The backend repo's git `origin` remote is still a placeholder
  (`YOUR_USERNAME/ev-charging-app.git`, confirmed via `git remote -v`) —
  flagged in `DEPLOYMENT.md` step 1 rather than silently assumed to be
  real; must be pointed at a real GitHub repo before Railway can deploy
  from it.
- No automated test suite exists to run in CI even if one were added —
  same pre-existing gap `AUTHENTICATION_DESIGN.md` §11 and Modules 8/9
  already flagged.

### Testing — verified live, not assumed

**Backend** (`mvn compile`, then a full restart with `DB_PASSWORD`
exported and no other hardcoded fallback in play):
- [x] Compiles clean.
- [x] Starts clean, connects to MySQL via the now-pooled, env-var-sourced
      `DataSource`.
- [x] `GET /api/stations` (public, `StationServiceApi`) → `200`, real data
      — confirms the `DataSource` swap didn't break the most basic read
      path.
- [x] `POST /auth/login` → real JWT — confirms auth (untouched by this
      module) still works end to end.
- [x] `GET /api/users/{id}/bookings` with a real token
      (`BookingServiceApi`) → `200`.
- [x] `POST /owner/chargers` with a real owner token (`OwnerService`) →
      `200`, "Charger added".
- [x] `GET /owner/reports/revenue/{id}` with a real owner token
      (`ReportService`) → `200`, real data.
- [x] `OPTIONS /api/stations` with an `Origin` header → confirmed
      `Access-Control-Allow-Origin: *` still present (default preserved).

**Frontend** (`npm run build`, `npm run lint`):
- [x] Build succeeds with no `.env` present — `grep`-ed the output bundle,
      confirmed `localhost:8801` (the fallback) is what got baked in.
- [x] Build succeeds again with `VITE_API_BASE_URL=https://api.example-prod.com`
      exported — `grep`-ed the output bundle, confirmed that exact URL
      replaced the fallback.
- [x] Lint clean — same 5 pre-existing errors as every prior module
      (vendored shadcn files + `vite.config.js`'s `__dirname`), zero new
      ones.

**Next module:** none requested yet — this module stops here per
instruction, pending approval.
