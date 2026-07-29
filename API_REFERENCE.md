# API Reference

Source of truth: `evcharging/src/main/java/com/evcharging/evcharging/controller/*.java`,
`evcharging/src/main/java/dto/*.java`, `evcharging/src/main/java/service/*.java`
(read directly from the sibling backend repo on 2026-07-28). This is a
description of what the backend **actually does**, including its bugs — not
a spec for how it should behave. Per `CLAUDE.md`, the frontend must adapt to
these endpoints as-is; nothing here should be used to justify changing
backend code.

Base URL: `http://localhost:8801`

There is **no common `/api` prefix across all controllers** — note the base
path per section below.

---

## Authentication

**There is no server-side authentication enforcement.** There is no Spring
Security filter chain, no JWT filter, and no interceptor anywhere in the
codebase. Every endpoint below is publicly callable with no `Authorization`
header at all, regardless of role.

- `AuthService.login()` does **not** call `JwtUtil` — it returns the literal
  string `"dummy-token"` as the token. `JwtUtil.generateToken` /
  `validateToken` exist but are never invoked from anywhere in the codebase
  (dead code).
- Passwords are compared with plain `String.equals()` against the stored
  value — there is no hashing (`spring-security-crypto` is a declared
  Maven dependency but unused).
- Practical implication for the frontend: treat `token`/`role`/`userId` as
  **client-side-only convenience state**, not a real security boundary. Any
  route-guarding you build (see `ROADMAP.md`) protects UX, not data — the
  backend will serve the data to anyone who calls the URL directly. Do not
  represent it to users as secure until backend auth is implemented.

---

## `/auth` — AuthController

### `POST /auth/register`

Request body (`RegisterRequest`):
```json
{
  "name": "Asha Rao",
  "email": "asha@example.com",
  "password": "plaintext-password",
  "role": "USER"
}
```

Response: `200 OK`, `Content-Type: text/plain`, body is one of two literal
strings — there is no structured success/error distinction and **no
non-200 status code is ever returned**, even on failure:
```
User registered successfully
```
or
```
Registration failed
```
`role` is not validated against any enum server-side — any string is
accepted and stored verbatim.

### `POST /auth/login`

Request body (`LoginRequest`):
```json
{ "email": "asha@example.com", "password": "plaintext-password" }
```

Response (`LoginResponse`), `200 OK`:
```json
{
  "token": "dummy-token",
  "userId": 12,
  "name": "Asha Rao",
  "role": "USER"
}
```

**Failure case is unhandled**: if the email doesn't exist or the password
doesn't match, `AuthService.login()` returns Java `null`. Spring serializes
a null `@RestController` return value as an **empty body with HTTP 200**,
not a 4xx. The frontend must treat "200 with an empty/unparseable body" as
a login failure — checking `response.ok` alone is not sufficient and the
current `Login.jsx` does not handle this case (see `IMPROVEMENT_REPORT.md`).

---

## `/api/stations` — StationController

### `GET /api/stations`

No auth header required (none enforced). Returns computed aggregates, not
the raw `StationDTO` shape:
```json
[
  {
    "id": 1,
    "name": "GreenCharge Hub",
    "location": "Mumbai",
    "rating": 4.2,
    "totalChargers": 6,
    "availableChargers": 3
  }
]
```
`rating` is `AVG(reviews.rating)`, defaults to `0` if no reviews.
`totalChargers`/`availableChargers` are live `COUNT`s over the `chargers`
table.

### `GET /api/stations/{id}/chargers`

```json
[
  { "id": 5, "power": 60.0, "pricePerKwh": 15.0, "status": "AVAILABLE" }
]
```
`status` is a free-text column value; observed values in frontend code:
`"AVAILABLE"` vs. anything else (treated as busy). There is no enum — do
not assume only two values exist.

### `POST /api/stations/{id}/review`

Request body (`ReviewDTO`):
```json
{ "userId": 12, "stationId": 1, "rating": 5, "comment": "Fast and clean." }
```
Note `stationId` in the body is accepted but ignored — the path `{id}` is
what's actually used in the `INSERT`. Response: `200 OK`, plain text
`"Review added successfully"` or `"Error: <exception message>"` (again, no
non-200 status on failure).

### `GET /api/stations/{id}/reviews`

```json
[
  { "userId": 12, "rating": 5, "comment": "Fast and clean." }
]
```

---

## `/api` — BookingController

### `GET /api/users/{id}/bookings`

```json
[
  {
    "bookingId": 88,
    "station": "GreenCharge Hub",
    "energyUsed": 12.4,
    "chargingTime": 0.8,
    "cost": 186.0
  }
]
```

### ⚠️ Missing: booking creation

There is **no endpoint to create a booking**. `BookingController` only
declares the `GET` above. However:

- `Station.jsx` (frontend) already calls `POST http://localhost:8801/api/bookings`
  with `{ userId, vehicleId, chargerId }`.
- `dto/CreateBookingRequest.java` and `dto/BookingResponse.java` exist in the
  backend source tree, matching that exact shape — but **no controller
  method anywhere references either class**. They are unused, orphaned DTOs.

This means the "book a charger" flow is currently non-functional end to end
— the frontend fetch will 404. This is a backend gap, not a frontend bug.
Per `CLAUDE.md` the frontend must not redesign or invent backend behavior;
flag this to the backend owner. `ROADMAP.md` treats the booking-flow module
as **blocked** on this endpoint being implemented, and specifies exactly the
request/response shape to request (matching the existing unused DTOs, so no
frontend rework is needed once it lands).

---

## `/owner` — OwnerController

No auth/role check — anyone can call these.

### `POST /owner/stations`

Request (`StationDTO`):
```json
{ "id": 0, "name": "New Hub", "location": "Chennai" }
```
⚠️ **Known backend bug** (documented for awareness, not to be fixed from the
frontend): the SQL is `INSERT INTO stations(name,location,owner_id)
VALUES(?,?)` — three columns, two placeholders, and `owner_id` is never
bound. This will throw a SQL exception at runtime; the endpoint currently
cannot succeed. The `catch` block returns `"Error: " + e.getMessage()` as a
`200 OK` plain-text body.

### `POST /owner/chargers`

Request (`ChargerDTO`):
```json
{ "id": 0, "stationId": 1, "power": 60, "pricePerKwh": 15, "status": "AVAILABLE" }
```
Note: the request's `status` field is ignored — the insert always hardcodes
`"AVAILABLE"`. Response: `200 OK`, `"Charger added"` or `"Error: ..."`.

### `PUT /owner/chargers/{id}/price`

Request (`ChargerDTO`, only `pricePerKwh` is read):
```json
{ "pricePerKwh": 17.5 }
```
Response: `200 OK`, `"Price updated"` or `"Error: ..."`.

There is currently **no frontend UI** calling any of these three endpoints
(see `ROADMAP.md` Module 6).

---

## `/owner/reports` — ReportController

All three require an `{ownerId}` **path** parameter — there is no
"current owner" inference from a token (there couldn't be; no auth is
enforced).

### `GET /owner/reports/revenue/{ownerId}`
```json
{ "totalRevenue": 18200.0 }
```

### `GET /owner/reports/energy/{ownerId}`
```json
{ "totalEnergyDelivered": 940.5 }
```

### `GET /owner/reports/bookings/{ownerId}`
```json
[
  {
    "bookingId": 88,
    "user": "Asha Rao",
    "station": "GreenCharge Hub",
    "energyUsed": 12.4,
    "cost": 186.0
  }
]
```

### ⚠️ Inconsistency: frontend omits `{ownerId}`

`OwnerDashboard.jsx` currently calls:
```
GET /owner/reports/revenue
GET /owner/reports/energy
GET /owner/reports/bookings
```
with no `ownerId` segment at all. Since the controller methods require
`@PathVariable int ownerId`, these requests will **404** as written. The
fix is frontend-side: pass the logged-in owner's `userId` (from the login
response / stored session) as `ownerId` in the URL. Tracked in
`ROADMAP.md` Module 5.

---

## `/health` — HealthController

### `GET /health`
```
EV Charging API is running!
```
Plain text, `200 OK`. Note: not under `/api` — do not prefix with the API
base URL used elsewhere if a shared client base URL is introduced.

---

## Error-handling summary (apply this uniformly on the frontend)

The backend has **no consistent error contract**:
- Successful writes return `200` with a plain-text success message.
- Failed writes also return `200`, with a plain-text `"Error: ..."` message
  — never a 4xx/5xx status.
- `login` returns `200` with an empty body on invalid credentials.
- Uncaught server exceptions elsewhere would surface as a default Spring
  Boot `500` with an HTML/JSON error page — the one path this doesn't apply
  to is anything already caught in a service's own `try/catch`.

Frontend error handling therefore cannot rely on HTTP status codes for the
write endpoints (`register`, `addReview`, owner add/update). It must inspect
the **response body text** for the literal `"Error"` prefix, which is
fragile but matches current backend behavior. This is documented as a
backend limitation in `IMPROVEMENT_REPORT.md`, not something to silently
work around with guesses.
