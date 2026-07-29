# Roadmap

Modules are ordered by dependency, not by user-facing priority — later
modules assume earlier ones are merged. Each module ends with an explicit
approval checkpoint per `CLAUDE.md`'s workflow rules (explain → wait for
approval → next module). Nothing here is implemented yet; this is the plan.

---

## Module 0 — Design System Foundation

**Objective:** Make shadcn/ui components actually render as designed by
defining the missing theme tokens (see `UI_DESIGN_SYSTEM.md`). This blocks
every other visual module — building on top of undefined tokens now would
mean redoing the visual QA later.

**Files to create:** none.
**Files to modify:** `src/index.css` (add `@theme` block + `:root`/`.dark`
custom properties), `src/main.jsx` or a new minimal font import for Geist
headings.

**Dependencies:** none (first module).

**Acceptance criteria:**
- Every shadcn primitive already in `components/ui/` (Button, Card, Badge,
  Input, Dialog, etc.) visibly renders with correct colors, radius, and
  spacing — verified by rendering each on a scratch page, not just by
  reading the CSS.
- `Home.jsx` (currently the only fully-styled page) visually unchanged or
  improved, never regressed, after tokens are added.
- No hardcoded hex colors introduced outside the token definitions
  themselves.

**Estimated complexity:** Small (CSS-only, no logic).

**Testing checklist:**
- [ ] `npm run dev`, visually inspect Home, Navbar, Footer — no visual
      regression.
- [ ] Render one instance of each currently-unused `ui/*` component
      (Alert, Badge, Dialog, Tabs, Table, Tooltip) somewhere reachable and
      confirm it looks intentional, not unstyled.
- [ ] Toggle a dark-mode class manually (even if no toggle UI exists yet)
      and confirm dark tokens resolve.
- [ ] `npm run build` succeeds.

---

## Module 1 — Auth Foundation

**Objective:** Replace ad-hoc `localStorage` reads scattered across pages
with a single `AuthContext`, and rebuild `Login`/`Register` on shadcn
components. Establishes the pattern every protected page depends on.

**Files to create:** `src/context/AuthContext.jsx`, `src/hooks/useAuth.js`,
`src/services/authApi.js`, `src/routes/ProtectedRoute.jsx`.
**Files to modify:** `src/main.jsx` (wrap `<App/>` in `AuthProvider`),
`src/pages/Login.jsx`, `src/pages/Register.jsx`, `src/App.jsx` (wire
`ProtectedRoute` around `/history` and `/owner`), `src/components/layout/
Navbar.jsx` (auth-aware right side: Login/Register vs. user menu + Logout).

**Dependencies:** Module 0 (styled Input/Button/Card/Form primitives).

**Acceptance criteria:**
- Login/Register use shadcn `Input`/`Button`/`Card`, have labeled fields,
  and show inline validation/error state instead of `alert()`.
- Login failure (see `API_REFERENCE.md` — 200 with empty body) is detected
  and shown to the user, not silently treated as success.
- Session state (`user`, `token`, `role`) is readable via `useAuth()`
  anywhere; no page reads `localStorage` directly anymore.
- Navigation after login/register uses `useNavigate()`, not
  `window.location`.
- `/history` and `/owner` redirect to `/login` when unauthenticated.

**Estimated complexity:** Medium.

**Testing checklist:**
- [ ] Register a new user end to end against the real backend.
- [ ] Login with correct credentials → redirected, Navbar shows logged-in
      state.
- [ ] Login with wrong credentials → visible error, no crash.
- [ ] Visit `/history` logged out → redirected to `/login`.
- [ ] Logout clears session and Navbar reverts.
- [ ] Refresh the page while logged in → session persists (localStorage
      backing works).

---

## Module 2 — Station Browsing (Home + station list wiring)

**Objective:** Replace `Home.jsx`'s mock `stations`/`stats` arrays with real
data from `GET /api/stations`, introduce `StationCard` for reuse.

**Files to create:** `src/features/stations/StationCard.jsx`,
`src/services/stationApi.js` (move `stationApi` out of `services/api.js`),
`src/hooks/useFetch.js`.
**Files to modify:** `src/pages/Home.jsx` (fetch real stations, keep
`stats`/`features` marketing copy static — those aren't backend data),
`src/services/api.js` (keep `request()`/`BASE_URL`, re-export or deprecate
the inline `stationApi`).

**Dependencies:** Module 0.

**Acceptance criteria:**
- "Featured Stations" section on Home renders live backend data (name,
  location, rating, availability), loading skeleton while fetching, graceful
  empty state if zero stations.
- `StationCard` is the single implementation used here and (later) by any
  future full station-list page — no copy-pasted card markup.

**Estimated complexity:** Small–Medium.

**Testing checklist:**
- [ ] Home loads stations from the real backend (verify against DB
      contents, not assumed).
- [ ] Zero-stations case renders an empty state, not a blank/broken layout.
- [ ] Backend down → error state shown, no unhandled promise rejection in
      console.

---

## Module 3 — Station Detail & Charger List

**Objective:** Rebuild `Station.jsx` on shadcn/Tailwind; wire chargers list
via `stationApi.getChargers`; add reviews list/submission via
`getReviews`/`addReview` (currently backend-ready but unused by any page).

**Files to create:** `src/features/stations/ChargerCard.jsx`,
`src/features/stations/ReviewList.jsx`, `src/components/shared/
StatusBadge.jsx`, `src/components/shared/RatingStars.jsx`.
**Files to modify:** `src/pages/Station.jsx`.

**Dependencies:** Modules 0–2.

**Acceptance criteria:**
- No inline `style={}` remains in `Station.jsx`.
- Charger status renders via `StatusBadge` (green `AVAILABLE` / red
  otherwise), matching the current color convention.
- Reviews are listed under the charger list; an authenticated user can
  submit a review via `addReview`.
- "Book Charger" click behavior is addressed in Module 3.5 below — do not
  block this module on it.

**Estimated complexity:** Medium.

**Testing checklist:**
- [ ] Visit `/station/:id` for a real station id, chargers render.
- [ ] Invalid/non-existent station id → empty state, not a crash.
- [ ] Submit a review while logged in → appears in the list (re-fetch or
      optimistic update).
- [ ] Submit a review while logged out → prompted to log in, not a silent
      backend call with `userId: undefined`.

---

## Module 3.5 — Booking Flow ⚠️ Blocked

**Objective:** Wire "Book Charger" to a real booking-creation call.

**Status: blocked on backend.** Per `API_REFERENCE.md`, no
`POST /api/bookings` (or equivalent) controller method exists, despite
`CreateBookingRequest`/`BookingResponse` DTOs already sitting unused in the
backend source tree. Per `CLAUDE.md`, the frontend does not redesign
backend APIs — this module cannot be completed until that endpoint is
added on the backend side.

**Recommended action:** request the backend implement
`POST /api/bookings` accepting `CreateBookingRequest`
(`{ userId, vehicleId, chargerId }`) and returning `BookingResponse`
(`{ bookingId, energyUsed, chargingTime, cost, message }`) — this exactly
matches what the frontend already sends and what the unused DTOs already
model, so no frontend rework will be needed once it exists.

**Files to create (once unblocked):** `src/services/bookingApi.js`
(`createBooking`), a `BookingConfirmDialog` (shadcn `Dialog`) in
`src/features/bookings/`.
**Files to modify (once unblocked):** `src/pages/Station.jsx` (replace the
`bookCharger` raw fetch + `alert()` with the service call + toast/dialog).

**Acceptance criteria (once unblocked):** clicking "Book Charger" on an
`AVAILABLE` charger creates a real booking, shows a success confirmation
(no `alert()`), and the charger's status reflects the change (re-fetch or
optimistic update).

**Estimated complexity:** Small (frontend side only, once backend exists).

**Testing checklist (once unblocked):**
- [ ] Book an available charger while logged in → success confirmation,
      booking appears in `/history`.
- [ ] Attempt to book while logged out → redirected/prompted to log in
      (existing behavior, keep it, just remove the raw `alert`).
- [ ] Attempt to book an already-busy charger → button/action is disabled
      client-side (already partially true — `Station.jsx` hides the button
      for non-`AVAILABLE` chargers).

---

## Module 4 — Charging History

**Objective:** Rebuild `History.jsx` on shadcn Cards/Table.

**Files to create:** `src/features/bookings/BookingCard.jsx`.
**Files to modify:** `src/pages/History.jsx`.

**Dependencies:** Modules 0–1 (needs `useAuth` for the current `userId`
instead of a raw `localStorage.getItem`).

**Acceptance criteria:**
- No inline styles; uses `BookingCard` (reusable — also used by
  Module 5's owner bookings table with a different field subset via props).
- Empty state ("no charging history yet") instead of a blank list.
- Loading skeleton while fetching.

**Estimated complexity:** Small.

**Testing checklist:**
- [ ] Logged-in user with bookings sees their history.
- [ ] New user with zero bookings sees the empty state, not a blank page.
- [ ] Logged-out visit redirects to login (via `ProtectedRoute`).

---

## Module 5 — Owner Dashboard (Reports)

**Objective:** Rebuild `OwnerDashboard.jsx` on shadcn Cards + Recharts, and
**fix the broken API calls** — the current page calls
`/owner/reports/revenue` etc. with no `ownerId`, which 404s against the
real backend (see `API_REFERENCE.md`). The fix is to pass the logged-in
user's id as `ownerId`.

**Files to create:** `src/services/ownerApi.js`, `src/features/owner/
RevenueSummaryCards.jsx`, `src/features/owner/BookingsTable.jsx`, a simple
Recharts bar/line chart component for revenue-over-time if the data
supports it (current `getRevenue`/`getEnergy` return single totals, not a
time series — a chart may only be feasible once/if the backend exposes a
breakdown; if not, this module renders summary numbers in Cards instead of
inventing fake chart data).

**Files to modify:** `src/pages/OwnerDashboard.jsx`.

**Dependencies:** Module 1 (`useAuth` for the owner's id), Module 0.

**Acceptance criteria:**
- Dashboard calls `/owner/reports/{revenue,energy,bookings}/{ownerId}`
  with the real logged-in id — verified against the actual backend, not
  assumed to work from reading the code.
- No inline styles; uses `BookingsTable` (shadcn `Table`).
- Route is guarded to the owner role via `ProtectedRoute role="OWNER"`.

**Estimated complexity:** Medium.

**Testing checklist:**
- [ ] Log in as a user whose `role` is the owner role, visit `/owner`,
      confirm real revenue/energy/bookings render (cross-check against DB).
- [ ] Log in as a non-owner user, visit `/owner` → blocked/redirected.
- [ ] Owner with zero bookings sees zeroed summary cards, not an error.

---

## Module 6 — Owner Management (new UI, backend already supports it)

**Objective:** Build the currently-nonexistent UI for the three
`OwnerController` write endpoints that have no frontend surface at all:
add station, add charger, update charger price.

**Files to create:** `src/features/owner/AddStationForm.jsx`,
`src/features/owner/AddChargerForm.jsx`, `src/features/owner/
UpdatePriceDialog.jsx` (shadcn `Dialog` + `Input`), extend
`src/services/ownerApi.js` (`addStation`, `addCharger`, `updatePrice`).
**Files to modify:** `src/pages/OwnerDashboard.jsx` (add entry points to
these forms).

**Dependencies:** Modules 0, 1, 5.

**Note:** `API_REFERENCE.md` documents a known backend SQL bug in
`addStation` (`owner_id` column referenced but never bound — will throw at
runtime). This module can still build the frontend form/flow, but the
"add station" acceptance criterion below cannot fully pass until that
backend bug is fixed; call this out explicitly rather than silently
working around it from the frontend.

**Acceptance criteria:**
- Add-charger and update-price flows work end to end against the real
  backend.
- Add-station flow is built and wired, with its known-blocked backend bug
  called out to the user rather than hidden.
- All forms validate required fields client-side before submitting (no
  empty-string `POST`s).

**Estimated complexity:** Medium.

**Testing checklist:**
- [ ] Add a charger to an existing station → appears in that station's
      charger list.
- [ ] Update a charger's price → reflected on `/station/:id`.
- [ ] Attempt add-station → confirm the currently-known backend error is
      surfaced clearly, not swallowed.

---

## Module 7 — Polish, Cleanup & Accessibility Pass

**Objective:** Final sweep once all pages share the new design system.

**Files to create:** `src/pages/NotFound.jsx`, `src/services/*` currently
missing `Content-Type`/error-shape normalization utilities if not already
covered.
**Files to modify:** `src/App.jsx` (add `*` → `NotFound` route).
**Files to delete:** `src/App.css` (unused Vite-template leftover),
`src/assets/react.svg`, `src/assets/vite.svg` (unused starter assets) —
confirm zero remaining references before deleting.

**Dependencies:** all prior modules.

**Acceptance criteria:**
- No dead files remain.
- Every interactive element keyboard-navigable; labels present on all
  form inputs; `prefers-reduced-motion` respected (per
  `UI_DESIGN_SYSTEM.md`).
- Full desktop → tablet → mobile pass on every route (per `CLAUDE.md`'s
  desktop-first priority).
- One consistent toast library in use (`sonner` or `react-hot-toast`, not
  both) — the unused one removed from `package.json`.

**Estimated complexity:** Small–Medium.

**Testing checklist:**
- [ ] `npm run build` succeeds with zero warnings introduced by this pass.
- [ ] `npm run lint` clean.
- [ ] Manual keyboard-only pass through Login → book a charger → view
      history.
- [ ] Resize/DevTools device pass at desktop, tablet (`md`), and mobile
      (`base`) widths on every route.
