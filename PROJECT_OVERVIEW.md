# Project Overview — EV Charging Marketplace

## What this is

A marketplace-style web app that connects EV drivers with charging station
owners. Drivers discover nearby stations, check live charger availability,
book a charger, and review their charging history. Station owners manage
their stations/chargers and see revenue and energy-delivery reports.

This document describes the **product** as implied by the existing backend
(Spring Boot, MySQL) and the in-progress frontend (React 19 + Vite). It is a
factual description of what exists today, not aspirational marketing copy —
gaps are called out explicitly so the roadmap can address them.

## Business goals

- Let EV owners find and book chargers quickly, without phone calls or
  guesswork about availability.
- Let station owners (a second-sided market) list stations/chargers, keep
  pricing current, and track revenue/utilization without needing their own
  software.
- Build trust via reviews/ratings per station.

## Target users

- **Drivers (`USER` role)** — search stations, view charger status and price,
  book a charger, view past charging sessions and cost.
- **Station owners (`OWNER` role, inferred)** — add stations/chargers, update
  pricing, view aggregate revenue/energy/booking reports for stations they
  own.

There is currently no `ADMIN` role or account-management surface (no user
profile edit, no password reset).

## User roles

Role is a free-text string (`"USER"`, presumably `"OWNER"`) chosen at
registration (`RegisterRequest.role`) and stored on the `users` table. Nothing
in the backend validates the value against an enum, and nothing on the
frontend currently reads or enforces it (see `IMPROVEMENT_REPORT.md`).

## Core features

| Feature | Status |
|---|---|
| Browse stations | Backend ready (`GET /api/stations`); frontend `Home.jsx` still shows mock data |
| View chargers for a station | Backend ready; frontend `Station.jsx` wired but unstyled (raw fetch, inline CSS) |
| Book a charger | **Not implemented on backend** — frontend calls an endpoint that doesn't exist (see `API_REFERENCE.md`) |
| Charging history | Backend ready (`GET /api/users/{id}/bookings`); frontend wired but unstyled |
| Station reviews | Backend ready (`GET`/`POST /api/stations/{id}/reviews`); no frontend UI yet |
| Register / Login | Backend ready but auth is not production-grade (plaintext password check, no real JWT validation) |
| Owner: add station / add charger / update price | Backend ready; **no frontend UI exists** |
| Owner: revenue / energy / booking reports | Backend ready, requires `ownerId`; frontend calls it without one (broken) |

## Tech stack

**Frontend**
- React 19, Vite 8
- React Router 7
- Tailwind CSS v4
- shadcn/ui (`base-nova` style, `@base-ui/react` primitives)
- Framer Motion (animation)
- Lucide React (icons)
- Recharts (charts, installed, not yet used)
- `class-variance-authority`, `clsx`, `tailwind-merge` (styling utilities)

**Backend** (`../evcharging`, sibling Maven project, Spring Boot 4.0.3, Java 17)
- Spring Boot Web (`spring-boot-starter-web`)
- Spring Data JPA dependency present but **unused** — all data access is raw
  JDBC (`java.sql.DriverManager`) in `service/*.java`
- MySQL (`ev_charging_system` database), driver `mysql-connector-j`
- `io.jsonwebtoken` (jjwt) present but effectively unused — see
  `API_REFERENCE.md` auth section
- `spring-security-crypto` dependency present but unused — passwords are
  compared with plain `String.equals`

## Architecture

```
Browser (React SPA)
   │  fetch() — CORS, allowedOrigins("*")
   ▼
Spring Boot app (port 8801)
   ├─ /auth/*            AuthController → AuthService      (raw JDBC)
   ├─ /api/stations*     StationController → StationServiceApi (raw JDBC)
   ├─ /api/users/*/bookings  BookingController → BookingServiceApi (raw JDBC)
   ├─ /owner/*           OwnerController → OwnerService     (raw JDBC)
   ├─ /owner/reports/*   ReportController → ReportService   (raw JDBC)
   └─ /health            HealthController
                              │
                              ▼
                         MySQL: ev_charging_system
                         (users, stations, chargers, bookings, reviews)
```

Notable architectural facts (not opinions — verified by reading the code):

- There is **no unified API prefix** — controllers live under `/auth`,
  `/api`, `/owner`, `/owner/reports`, and `/health` independently.
- There is **no security filter chain** — every endpoint is reachable by
  anyone regardless of the `Authorization` header. The frontend sends a
  bearer token; the backend never reads it.
- Each service method opens its own JDBC connection via
  `DriverManager.getConnection(...)` with credentials hardcoded per-class —
  there is no shared `DataSource` bean or connection pool.

## Folder structure (frontend, `evcharge-ui/`)

```
evcharge-ui/
├── CLAUDE.md                  agent operating rules
├── components.json            shadcn/ui config (style: base-nova)
├── index.html
├── vite.config.js             @ alias → src/
├── src/
│   ├── main.jsx                app entry
│   ├── App.jsx                 routes
│   ├── App.css                 unused Vite-template leftover (dead file)
│   ├── index.css               Tailwind import + base styles (missing shadcn theme tokens)
│   ├── assets/                 hero.png, react.svg, vite.svg (svgs unused)
│   ├── lib/
│   │   └── utils.js            cn() helper (clsx + tailwind-merge)
│   ├── services/
│   │   └── api.js              fetch wrapper + stationApi (only client used consistently)
│   ├── components/
│   │   ├── layout/              Navbar, Footer, MainLayout
│   │   └── ui/                  shadcn-generated primitives (Button, Card, Dialog, ...)
│   └── pages/
│       ├── Home.jsx             modern (Tailwind/shadcn/motion), uses mock data
│       ├── Station.jsx          legacy style (inline CSS, raw fetch)
│       ├── History.jsx          legacy style
│       ├── OwnerDashboard.jsx   legacy style
│       ├── Login.jsx            legacy style
│       └── Register.jsx         legacy style
```

Full technical debt inventory, security concerns, and per-page issues are in
`IMPROVEMENT_REPORT.md`. Endpoint-level detail is in `API_REFERENCE.md`. The
target frontend architecture is in `COMPONENT_ARCHITECTURE.md`. The build
plan is in `ROADMAP.md`.
