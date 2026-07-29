# EV Charging Marketplace Platform

This repository is an EV Charging Marketplace frontend.

The backend is already implemented using Spring Boot.

Your responsibility is ONLY the frontend unless explicitly instructed otherwise.

---

## Tech Stack

Frontend

- React 19
- Vite 8
- Tailwind CSS v4
- shadcn/ui
- Framer Motion
- Lucide React
- Recharts

Backend

- Spring Boot
- JWT
- MySQL

---

## Backend

Never redesign backend APIs.

Use the existing endpoints.

Base URL

http://localhost:8801/api

---

## Development Rules

Always modify existing files instead of rewriting the project.

Never create duplicate components.

Keep components reusable.

Never use inline CSS.

Use Tailwind utilities.

Use shadcn components whenever possible.

Prefer composition over duplication.

Keep files under approximately 300 lines by extracting reusable components.

---

## UI Style

Premium SaaS

Inspired by

- Tesla
- ChargeZone
- Stripe Dashboard
- Vercel

Animations

Framer Motion

Rounded cards

Modern spacing

Accessible UI

Responsive

Desktop first

Tablet

Mobile

---

## Coding Rules

Never leave TODO comments.

Never generate placeholders.

Never leave incomplete code.

Always keep the project compiling.

Always explain modified files.

---

## Workflow

Every module follows four phases, in order. Never skip a phase and never
continue to the next module automatically — always wait for approval.

### Phase 1 — Analyze

- Read the relevant planning documents (PROJECT_OVERVIEW.md,
  API_REFERENCE.md, COMPONENT_ARCHITECTURE.md, UI_DESIGN_SYSTEM.md,
  ROADMAP.md, IMPROVEMENT_REPORT.md, ARCHITECTURE_DECISIONS.md).
- Explain the implementation approach.
- Identify any risks or dependencies.
- If the planning documents turn out to be incorrect, stop and explain the
  issue before making changes — do not silently work around a wrong doc.

### Phase 2 — Implement

- Modify only the required files.
- Keep changes small and focused.
- Maintain a working build after every change.
- Reuse existing components whenever possible.

### Phase 3 — Verify

Before considering the module complete, verify:

- Project compiles
- No import errors
- No lint errors introduced
- Responsive on desktop/tablet/mobile
- No duplicate logic
- No dead code
- Accessibility maintained
- Consistent with UI_DESIGN_SYSTEM.md
- Consistent with ARCHITECTURE_DECISIONS.md
- Uses services/api.js where applicable

### Phase 4 — Review

Provide:

- Files created
- Files modified
- Why each change was made
- Any trade-offs
- Any remaining technical debt
- Suggested improvements for future modules

Once the module is approved, append an entry to CHANGELOG.md (module
number, date, summary, files modified, breaking changes, known issues,
next module) before starting the next module.

Then wait for approval before starting the next module.

Quality is more important than speed.
