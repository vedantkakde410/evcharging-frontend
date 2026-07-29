# Deployment Guide

Covers both repositories that make up this app:

- **Backend** (`evcharging/`, Spring Boot) → [Railway](https://railway.app)
- **Frontend** (`evcharge-ui/`, Vite/React) → [Vercel](https://vercel.com)

They are two separate git repositories today (confirmed via `git remote -v`
in each) and deploy independently. Nothing in this module changed any
application behavior — see `CHANGELOG.md` Module P0 for exactly what moved
from hardcoded to environment-variable-driven, and why.

---

## 0. Before you start

- A MySQL database reachable from wherever the backend runs (Railway's
  MySQL plugin, PlanetScale, RDS, etc. — anything MySQL-compatible works,
  since the app connects via a standard JDBC URL).
- A real SMTP provider if you want OTP emails to actually deliver in
  production (Gmail with an App Password, SendGrid, Mailgun, Postmark,
  etc.). Without one, registration/password-reset OTP emails will fail to
  send (`502 EMAIL_SEND_FAILED`) — the app does not fake email delivery
  (`AUTHENTICATION_DESIGN.md` §6).
- A generated `JWT_SECRET` — do **not** reuse the dev-only fallback baked
  into `application.properties`. Generate one with, e.g.:
  ```
  openssl rand -base64 48
  ```

---

## 1. Database setup

The backend expects `spring.jpa.hibernate.ddl-auto=none` — nothing
auto-creates or auto-migrates the schema. Before the backend's first
deploy against a **fresh** database, run these SQL files in order against
it (a MySQL client pointed at the Railway MySQL instance, or Railway's own
web-based query console):

1. Whatever created the original `users`/`stations`/`chargers`/`bookings`/
   `reviews`/`vehicles` tables in your existing dev database (this repo
   never carried a from-scratch schema script for those — they predate
   the auth rebuild). If you're moving an existing dev database to
   production via `mysqldump`/restore instead of starting fresh, this
   step is already covered by the restore.
2. `evcharging/src/main/resources/sql/auth_redesign_migration.sql` —
   adds `password_hash`/`email_verified`/timestamps to `users`, creates
   `email_verification_otp`, `password_reset_otp`, `refresh_tokens`.
   **Read the comments at the top first** — it includes a pre-flight
   duplicate-email check you should run before the `ALTER TABLE`.
3. `evcharging/src/main/resources/sql/module9_authorization_hardening_migration.sql`
   — creates `revoked_tokens`, drops the legacy plaintext `password`
   column.

If you're restoring a `mysqldump` of the **existing dev database** (which
already has both migrations applied and passwords already BCrypt-hashed —
confirmed in `CHANGELOG.md` Modules 8/9), you don't need to re-run
anything; the dump already reflects the current schema.

---

## 2. Backend → Railway

1. Push the `evcharging/` repository to GitHub if it isn't already (its
   `origin` remote is currently a placeholder —
   `git remote set-url origin <your-real-repo-url>` and push).
2. In Railway: **New Project → Deploy from GitHub repo**, select the
   `evcharging` repo.
3. Railway auto-detects the Maven project (via `pom.xml`) and builds it
   with its Java/Nixpacks builder — no Dockerfile needed. If you'd rather
   pin the build explicitly, a minimal `railway.json` / `Procfile` isn't
   required for a standard Spring Boot Maven app, but you can add one
   later if auto-detection ever misbehaves.
4. Add a MySQL database: **New → Database → Add MySQL** in the same
   Railway project. Railway provisions it and exposes connection details
   as its own env vars (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`,
   `MYSQLPASSWORD`, `MYSQLDATABASE`).
5. On the backend service, set these environment variables (Railway's
   **Variables** tab). Where noted, reference Railway's MySQL plugin
   variables directly instead of retyping them — Railway supports
   `${{MySQL.MYSQLHOST}}`-style references between services in the same
   project:

   | Variable | Value |
   |---|---|
   | `DB_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}` |
   | `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` |
   | `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
   | `JWT_SECRET` | your generated secret (§0) — **required**, do not skip |
   | `JWT_ACCESS_EXPIRY_MS` | `86400000` (24h) — or your own choice |
   | `JWT_RESET_EXPIRY_MS` | `600000` (10min) — or your own choice |
   | `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | your real SMTP provider's values |
   | `MAIL_SMTP_AUTH` | `true` (real providers need this, unlike local MailHog) |
   | `MAIL_SMTP_STARTTLS` | `true` (real providers need this too) |
   | `MAIL_FROM` | a real sender address your provider is authorized to send as |
   | `CORS_ALLOWED_ORIGINS` | your Vercel frontend URL, e.g. `https://evcharge.vercel.app` (comma-separate multiple) |

   `PORT` does **not** need to be set manually — Railway injects it, and
   `application.properties` already reads `server.port=${PORT:8801}`.
6. Deploy. Check the deploy logs for `Started EvchargingApplication` and
   confirm `GET /health` on the Railway-assigned public URL returns
   `EV Charging API is running!`.
7. Run the migrations from §1 against this Railway MySQL instance before
   (or immediately after) the first successful deploy, if you haven't
   already via a restored dump.

---

## 3. Frontend → Vercel

1. Push `evcharge-ui/` to its GitHub repo (already configured —
   `ev-charging-frontend`).
2. In Vercel: **Add New → Project**, import that repo.
3. Framework preset: **Vite** (auto-detected). Defaults are already
   correct for this repo:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Set the one required environment variable, **Production** scope (and
   Preview if you want preview deployments to hit the same backend):

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | your Railway backend's public URL, e.g. `https://evcharging-production.up.railway.app` (no trailing slash) |

   This is read at **build time**, not runtime (`import.meta.env` is
   inlined by Vite when bundling — see `.env.example`'s comment) — if you
   change it later, trigger a new deploy, a redeploy of the same build
   won't pick it up.
5. Deploy. Once live, open the Vercel URL and confirm the Home page loads
   real station data (not a blank/error state) — that confirms
   `VITE_API_BASE_URL` and `CORS_ALLOWED_ORIGINS` are both correct and
   talking to each other.

---

## 4. Post-deploy smoke test

Run through this once after both are live — it mirrors the checks already
done locally in `CHANGELOG.md` Modules 8/9, just against the real URLs:

- [ ] `GET https://<railway-url>/health` → `200`, plain text confirmation.
- [ ] Home page on the Vercel URL loads real stations (confirms CORS +
      `VITE_API_BASE_URL` are both correct).
- [ ] Register a real account with an email you can check → OTP email
      actually arrives (confirms `MAIL_*` vars are correct) → verify →
      logged in.
- [ ] Log out, log back in with the same account.
- [ ] Visit `/owner` as a non-owner account → redirected to
      `/unauthorized` (confirms the backend's role enforcement survived
      the move).
- [ ] Open browser dev tools → Network tab → confirm API calls go to the
      Railway URL, not `localhost`.

---

## 5. Rollback

Both platforms keep prior deploys:

- **Railway:** the Deployments tab lets you redeploy any previous build
  with one click if a new deploy misbehaves.
- **Vercel:** same — the Deployments tab lets you "Promote to Production"
  any earlier deployment instantly.

Neither rollback touches the database — if a bad deploy included a schema
change (it shouldn't, per this module's "no functionality changes"
scope), that would need its own manual rollback, same as any other schema
migration.

---

## 6. Reference: all environment variables

See `evcharging/.env.example` (backend) and `evcharge-ui/.env.example`
(frontend) for the authoritative, commented list — this document
summarizes them but those files are the source of truth if the two ever
drift.
