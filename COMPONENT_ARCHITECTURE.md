# Component Architecture (Target State)

This defines the frontend architecture all future modules (see
`ROADMAP.md`) build toward. It follows `CLAUDE.md`: modify existing files
rather than rewrite, no duplicate components, composition over duplication,
no file over ~300 lines (extract sub-components once a page approaches
that).

## Folder organization

```
src/
├── main.jsx
├── App.jsx                      routes only — no logic
├── index.css                    Tailwind + shadcn theme tokens (see UI_DESIGN_SYSTEM.md)
│
├── app/
│   └── providers.jsx            composes AuthProvider (+ any future providers) around <App/>
│
├── context/
│   └── AuthContext.jsx          session state: user, token, role, login(), logout()
│
├── hooks/
│   ├── useAuth.js                consumes AuthContext
│   ├── useFetch.js                thin async-state wrapper (loading/error/data) around services/api.js calls
│   └── useRequireAuth.js         redirect-to-login helper for protected pages
│
├── routes/
│   └── ProtectedRoute.jsx        role-aware route guard, wraps <Outlet/>
│
├── services/
│   ├── api.js                    existing fetch wrapper (request(), BASE_URL) — extended, not replaced
│   ├── authApi.js                login, register
│   ├── stationApi.js             getStations, getChargers, getReviews, addReview (move out of api.js)
│   ├── bookingApi.js             getUserBookings, createBooking (once backend endpoint exists)
│   └── ownerApi.js               addStation, addCharger, updatePrice, getRevenue, getEnergy, getBookings
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.jsx        existing — Navbar + Outlet + Footer
│   │   ├── Navbar.jsx            existing — extend with auth-aware right side
│   │   └── Footer.jsx            existing, unchanged
│   │
│   ├── ui/                       shadcn primitives — generated, never hand-edited except via shadcn CLI
│   │
│   └── shared/                   hand-written, reusable across ≥2 pages
│       ├── StatusBadge.jsx        maps charger/booking status string → shadcn Badge variant + color
│       ├── EmptyState.jsx         "nothing here yet" placeholder (icon + text), replaces ad-hoc "No chargers available"
│       ├── ErrorState.jsx         inline error card with retry button, replaces alert()
│       ├── LoadingSkeleton.jsx    wraps shadcn Skeleton in common card/row/list shapes
│       ├── PageHeader.jsx         consistent page title + optional action button
│       └── RatingStars.jsx        renders a numeric rating (0–5) as stars, used by station cards + reviews
│
├── features/                     page-scoped components too specific for components/shared
│   ├── stations/
│   │   ├── StationCard.jsx        used by Home (featured) and a future StationList page
│   │   ├── ChargerCard.jsx        used by Station.jsx
│   │   └── ReviewList.jsx         used by Station.jsx
│   ├── bookings/
│   │   └── BookingCard.jsx        used by History.jsx and OwnerDashboard.jsx (different field subset via props)
│   └── owner/
│       ├── RevenueSummaryCards.jsx
│       ├── BookingsTable.jsx      shadcn Table, used by OwnerDashboard
│       ├── AddStationForm.jsx     new — Module 6
│       └── AddChargerForm.jsx     new — Module 6
│
├── lib/
│   └── utils.js                  existing cn() — unchanged
│
└── pages/
    ├── Home.jsx                   wire to stationApi instead of mock arrays
    ├── Station.jsx                rebuilt on ChargerCard/ReviewList + useFetch
    ├── History.jsx                rebuilt on BookingCard + useFetch
    ├── OwnerDashboard.jsx         rebuilt on RevenueSummaryCards/BookingsTable + Recharts
    ├── Login.jsx                  rebuilt on shadcn Input/Button/Card + AuthContext
    ├── Register.jsx               rebuilt on shadcn Input/Button/Card
    └── NotFound.jsx                new — catch-all route
```

## Reusable components — rules of thumb

- A component moves from `pages/` inline JSX to `components/shared/` the
  moment a **second** page needs the same shape (per `CLAUDE.md`: never
  duplicate, prefer composition). Until then, keep it local to the page —
  do not pre-build abstractions for hypothetical reuse.
- `components/ui/` is shadcn-owned. Extend a shadcn component by wrapping it
  (e.g., `StatusBadge` wraps `Badge`), never by hand-editing the generated
  file, so future `shadcn add`/updates stay conflict-free.
- `features/*` components may import `components/shared/*` and
  `components/ui/*`, but not the reverse.

## Shared hooks

- **`useFetch(fn, deps)`** — the single pattern for "call a service function,
  track `{data, loading, error}`". Replaces the repeated
  `useEffect(() => { fetch(...).then(setState) }, [])` pattern found in
  `Station.jsx`, `History.jsx`, `OwnerDashboard.jsx` today, and centralizes
  the error-shape handling required by the backend's inconsistent error
  contract (see `API_REFERENCE.md`).
- **`useAuth()`** — reads `AuthContext`; returns `{ user, token, role,
  isAuthenticated, login, logout }`.
- **`useRequireAuth(role?)`** — used inside pages (or `ProtectedRoute`) to
  redirect to `/login` if unauthenticated, or to a "not authorized" state if
  `role` doesn't match.

## Context providers

- **`AuthContext`** — the only global context needed at this scale. Holds
  session state currently scattered across raw `localStorage` reads in
  `Login.jsx`/`Station.jsx`/`History.jsx`. Persists to `localStorage` under
  the hood but every component reads through the context, never
  `localStorage` directly, so logout/login updates propagate without a full
  page reload (`window.location = "/"` is being removed — see
  `IMPROVEMENT_REPORT.md`).
- No Redux/Zustand/Jotai — one context plus local component state is
  sufficient for this app's size; introducing a state library would violate
  `CLAUDE.md`'s "keep components reusable" / avoid-unneeded-complexity
  intent.

## Utility functions

- `lib/utils.js` (`cn()`) stays as the only cross-cutting utility file.
- Formatting helpers (currency `₹`, kWh, duration) that currently appear
  inline (e.g., `₹{station.price}`, `{energy} kWh`) move to
  `lib/format.js` (`formatCurrency`, `formatEnergy`, `formatDuration`) once
  a second page needs the same formatting — same reuse rule as components.

## Layout hierarchy

```
main.jsx
 └─ providers.jsx (AuthProvider)
     └─ App.jsx (BrowserRouter, Routes)
         ├─ Route: MainLayout (Navbar + Outlet + Footer)
         │    ├─ / → Home
         │    ├─ /station/:id → Station
         │    ├─ /history → History (ProtectedRoute)
         │    └─ /owner → OwnerDashboard (ProtectedRoute role="OWNER")
         ├─ /login → Login (no layout)
         ├─ /register → Register (no layout)
         └─ * → NotFound (no layout, or a minimal centered layout)
```

`ProtectedRoute` wraps the routes that need it, e.g.:
```jsx
<Route element={<ProtectedRoute />}>
  <Route path="/history" element={<History />} />
</Route>
<Route element={<ProtectedRoute role="OWNER" />}>
  <Route path="/owner" element={<OwnerDashboard />} />
</Route>
```
Reminder from `API_REFERENCE.md`: this guards **UX only** — the backend
does not enforce authorization, so this is not a security control by
itself.

## State management strategy

- **Server state** (stations, chargers, bookings, reports): fetched via
  `services/*Api.js` + `useFetch`, held in local page/component state. No
  caching layer (React Query, SWR) is introduced yet — the app's data
  volume and update frequency don't justify it today. Revisit only if a
  page needs shared/cached server state across siblings simultaneously.
- **Client/session state** (auth): `AuthContext`, backed by `localStorage`.
- **Ephemeral UI state** (form inputs, dialog open/close, tab selection):
  local `useState` in the owning component — no lifting beyond what's
  needed.

## Routing strategy

- `react-router-dom` v7, `BrowserRouter`, as already set up in `App.jsx`.
- All authenticated navigation uses `useNavigate()` / `<Link>` —
  `window.location = "..."` is removed everywhere (breaks SPA state, forces
  full reloads) per `IMPROVEMENT_REPORT.md`.
- Route param access (`useParams`) stays page-local (`Station.jsx` already
  does this correctly).
- A catch-all `<Route path="*" element={<NotFound />} />` is added — none
  exists today.
