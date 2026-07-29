# Improvement Report

A senior-level review of the current codebase (both the `evcharge-ui`
frontend and, where relevant, the sibling Spring Boot backend it depends
on). Findings are grouped by severity/category. Per `CLAUDE.md`, backend
findings are documented for awareness/coordination only — the frontend
will not attempt to fix them.

---

## Critical

**1. shadcn theme tokens are undefined — `components/ui/*` is currently
unstyled.** `src/index.css` has no `@theme` block and no CSS custom
properties, yet every generated shadcn component (`button.jsx`, `card.jsx`,
etc.) references tokens like `bg-primary`, `bg-card`, `--radius-md`,
`font-heading`. Verified by grepping the entire `src/` tree for `@theme` —
zero matches. Any component built from these primitives before this is
fixed will look broken. This is `ROADMAP.md` Module 0, and should be first.

**2. The "book a charger" flow is non-functional end to end.**
`Station.jsx` calls `POST /api/bookings`; no such endpoint exists in
`BookingController` (only `GET /api/users/{id}/bookings` is defined).
`CreateBookingRequest`/`BookingResponse` DTOs exist unused in the backend,
strongly suggesting this was planned but never wired up. This is the
platform's core value proposition and it currently 404s. Backend
coordination needed (see `API_REFERENCE.md`, `ROADMAP.md` Module 3.5).

**3. No backend authentication/authorization enforcement exists.**
No Spring Security filter chain, no JWT filter/interceptor anywhere.
`AuthService.login()` returns a hardcoded string `"dummy-token"` — it
never calls the `JwtUtil` class that already exists in the codebase (dead
code). Every endpoint, including owner-report and owner-write endpoints, is
callable by anyone with no header at all. Any frontend route guarding
(Module 1/`ProtectedRoute`) improves UX but is not a security boundary —
this must not be represented to end users as secure.

**4. Passwords are stored and compared in plaintext.**
`AuthService.login()`: `dbPassword.equals(password)` against a raw DB
column value; `register()` inserts the raw password with no hashing.
`spring-security-crypto` is a declared Maven dependency and is unused.
Backend-only fix, flagged for awareness.

**5. Hardcoded database credentials duplicated across four backend service
classes**, and a plaintext DB password committed to
`evcharging/src/main/resources/application.properties` in the backend
repo. Not reproduced in this document. Flagging for awareness only — this
is backend/ops scope, not something the frontend should act on, but it is
a real secret-in-source-control exposure worth raising with whoever owns
that repo.

---

## High

**6. `OwnerDashboard.jsx` calls broken URLs.** It fetches
`/owner/reports/revenue`, `/owner/reports/energy`, `/owner/reports/bookings`
with no `{ownerId}` — the backend controller requires that path segment.
As written, these calls will 404 against the real backend right now. Fix
tracked in `ROADMAP.md` Module 5.

**7. No error handling or loading states** in `Station.jsx`,
`History.jsx`, `OwnerDashboard.jsx`. A failed/slow fetch leaves the page
silently blank (or, per Finding 6, permanently broken) with nothing shown
to the user. `Station.jsx`'s initial chargers fetch has no `.catch` at all
— an exception there is silently swallowed by the unhandled promise.

**8. No route protection.** `/owner` and `/history` are reachable by
anyone, logged in or not — `role` is stored in `localStorage` after login
but never read anywhere to gate UI.

**9. `window.location = "/..."` used for navigation** in `Login.jsx` and
implicitly relied on elsewhere, instead of `react-router`'s `useNavigate()`
— forces full page reloads, defeating the purpose of an SPA and dropping
any in-memory state.

**10. Two competing data-fetching patterns.** `src/services/api.js`
provides a proper `request()` wrapper + `stationApi`, but it's imported
and unused in `Home.jsx` (which uses hardcoded mock arrays instead), while
every other page bypasses it entirely with raw `fetch()` calls to
hardcoded absolute URLs (`http://localhost:8801/...` repeated verbatim in
five different files). No single source of truth for the API base URL.

**11. Half-migrated design system.** `Home.jsx` is fully built on
Tailwind/shadcn/Framer Motion; `Station.jsx`, `History.jsx`,
`OwnerDashboard.jsx`, `Login.jsx`, `Register.jsx` are still inline-styled
(`style={{...}}` throughout) with no shared components — a direct
violation of `CLAUDE.md`'s "never use inline CSS" rule, predating this
plan. This is the bulk of `ROADMAP.md`'s modules 1–5.

---

## Medium

**12. Two toast libraries installed** (`sonner` and `react-hot-toast`),
neither actually used by the legacy pages (which use `alert()` instead).
Pick one, remove the other, per `ROADMAP.md` Module 7.

**13. `alert()` used for all user feedback** (booking success/failure,
login/register failure) — jarring, blocks the main thread, not
accessible, inconsistent with the "premium SaaS" direction in
`CLAUDE.md`.

**14. Form inputs have no associated `<label>` elements** in `Login.jsx`/
`Register.jsx` — placeholder-only inputs are an accessibility gap (screen
readers have no accessible name once the field has a value).

**15. Free-text status strings with no shared constant.**
`charger.status === "AVAILABLE"` is a string literal repeated ad hoc;
should be a shared constant/enum once `StatusBadge` (Module 3) is built,
so a typo can't silently create an "always busy" bug.

**16. `stationApi` in `services/api.js` is imported into `Home.jsx` but
never called** — dead import, and the mock data it should be replacing
(`stats`, `stations` arrays) is presented as if live.

**17. `Recharts` is a listed dependency and never imported/used anywhere**
— fine for now (planned for Module 5), but worth noting as currently
unused weight in the bundle.

**18. Backend: raw JDBC with a new `DriverManager.getConnection()` per
request, no connection pool, no shared `DataSource`.** Every service class
independently opens/closes connections; under concurrent load this will
exhaust MySQL's connection limit well before the app becomes otherwise
slow. `spring-boot-starter-data-jpa` is a declared dependency and
completely unused — backend-only, flagged for awareness.

**19. Backend: `POST /owner/stations` has a SQL bug** — `INSERT INTO
stations(name,location,owner_id) VALUES(?,?)` declares three columns with
only two `?` placeholders, and `owner_id` is never bound via
`ps.setInt(...)`. This will throw a SQL exception at runtime, so the
endpoint currently cannot succeed. Backend-only, flagged for awareness and
called out again in `ROADMAP.md` Module 6 since it blocks that module's
full completion.

**20. Backend: CORS is wide open** (`allowedOrigins("*")`,
`allowedMethods("*")`, `allowedHeaders("*")` in
`EvchargingApplication.corsConfigurer()`), and there is no unified `/api`
path prefix across controllers (`/auth`, `/api`, `/owner`,
`/owner/reports`, `/health` all coexist). Backend-only, flagged for
awareness — the frontend's `services/api.js` should account for this
inconsistency (see `API_REFERENCE.md`) rather than assume a single base
path.

**21. Backend error contract is inconsistent** — successful and failed
writes both return `200` with a plain-text body; the only signal of
failure is a string prefix (`"Error: ..."`) or, for login, an empty body.
The frontend cannot rely on HTTP status codes for these endpoints (see
`API_REFERENCE.md` for the full breakdown) — this materially affects how
`useFetch`/error-handling should be built in Module 1+, so it's called out
here as a design constraint, not just a backend gripe.

---

## Low / Housekeeping

**22. `src/App.css` is dead code** — leftover default Vite template CSS
(`.hero`, `#next-steps`, `.ticks`, etc.), not imported anywhere in the
project. Confirmed via search — zero references. Delete in Module 7.

**23. All three files in `src/assets/` are currently unreferenced** —
`react.svg`, `vite.svg`, and `hero.png` (verified: zero matches for any of
the three filenames anywhere under `src/`). `hero.png` was presumably
intended for the Home hero section but isn't wired in yet. Delete the two
template leftovers in Module 7; either wire up `hero.png` during Module 2
(Home) or delete it too if it's not needed.

**24. No 404/NotFound route** — an unmatched path currently renders
nothing inside `MainLayout`'s `<Outlet/>` (or nothing at all for
unmatched top-level paths, since `Login`/`Register` sit outside
`MainLayout`). Added in `ROADMAP.md` Module 7.

**25. No `.env`/environment-variable handling** — `BASE_URL` is a string
literal in `services/api.js`, repeated as further string literals in every
page that bypasses it. Should be `import.meta.env.VITE_API_BASE_URL` with
a committed `.env.example`, so switching environments doesn't require a
find-and-replace across five files.

---

## Suggested refactoring priority

This mirrors `ROADMAP.md`'s module order and is repeated here as a
one-line summary for quick reference:

1. Fix theme tokens (Critical #1) — nothing else visually verifiable
   until this lands.
2. Escalate the missing booking endpoint (Critical #2) and the auth gaps
   (Critical #3/#4) to whoever owns the backend — these are outside
   frontend scope to fix but block real functionality and cannot be
   worked around safely from the frontend.
3. Build `AuthContext`/`ProtectedRoute` once (High #8/#9), then migrate
   each legacy page onto shared components (High #11) one module at a
   time per `ROADMAP.md`, fixing that page's specific bugs (#6, #7) as
   part of its migration rather than as separate passes.
4. Housekeeping (#22–25) as a final sweep once no page still depends on
   the old patterns.
