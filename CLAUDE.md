# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

Payment tracking app for CR microbusinesses (kindergartens, condos, gyms, ASADAs). The operator (sister) tracks recurring charges, records payments, and views a dashboard. Phase 1A is complete and in production. Phase 1B (PocketBase migration + auth) is in progress. Planning docs live at `/Users/aarongomez/p/deas/herramientas/pagos/`.

**Phase status:**
- Phase 1A (local SQLite CRUD + dashboard) — ✅ DONE, in production
- Phase 1B (PocketBase on GCP + operator auth) — 🔄 in progress
- Phase 2+ (recurring charges, reminders, PDFs, multi-tenant, client app, SINPE) — planned

## Commands

```bash
npm start                        # Expo dev server
npm run ios                      # run on iOS simulator
npm run android                  # run on Android emulator
```

ESLint is configured (`eslint.config.js`). Run with `npm run lint` or `npm run lint:fix`.

## Architecture

### Routing

expo-router with a tab-based layout. Three tabs live under `app/(tabs)/`: Dashboard (`index.tsx`), Contacts (`contacts.tsx`), and Templates (`templates.tsx`). Detail and form screens are nested route folders: `app/charges/[id]/`, `app/contacts/[id]/`, `app/templates/[id]/`, each containing `new.tsx` or a detail screen. Note: routes use `contacts/` not `clients/` — renamed during Phase 1A implementation.

### Data Model

Five domain entities (matches both the SQLite schema and the PocketBase collections):

- **`contacts`** — parent/client CRUD (name, phone, notes, active)
- **`charge_templates`** — reusable catalog entries (concept, amount, type: `recurring` | `extra`)
- **`contact_templates`** — junction: which templates are assigned to which contacts (used at charge generation time)
- **`charges`** — charge header (contact_id, due_date, status derived from lines)
- **`charge_lines`** — line items per charge (concept, amount, type, status, payment_method, paid_at). Each line is paid independently.

`charge_lines.type` controls overdue behavior: only `recurring` lines go overdue; `extra` lines stay `pending` indefinitely.

### Database (Phase 1A — current)

`db/database.ts` opens a singleton SQLite database and runs inline migrations. Domain modules:

- `db/charges.ts` — CRUD + `markOverdue()` (call on dashboard load), `markPaid()`, `unmarkPaid()`, `listCharges(filters)`
- `db/contacts.ts` — contact CRUD
- `db/chargeTemplates.ts` — template CRUD
- `db/chargeLines.ts` — line CRUD + per-line pay/unpay

All IDs are UUIDs generated with `expo-crypto` (`randomUUID()`) — don't use `uuid` or `Math.random()`. Amounts are stored as integers (colones, no decimals).

`markOverdue()` transitions stale pending `recurring` lines to overdue — must be called each time the dashboard loads.

### Database (Phase 1B — in progress)

The `db/` folder will be replaced entirely with PocketBase SDK calls. Only `db/` changes — all screens, components, and format helpers stay untouched. Key files added:

- `db/pocketbase.ts` — PocketBase client init (`EXPO_PUBLIC_POCKETBASE_URL`)
- `db/auth.ts` — `login()`, `logout()`, `isAuthenticated()`
- `db/contacts.ts`, `db/charges.ts`, `db/chargeLines.ts`, `db/chargeTemplates.ts`, `db/contactTemplates.ts` — same function signatures as Phase 1A, mapped to PocketBase SDK

Auth guard lives in `app/_layout.tsx`: redirect to `/login` when `pb.authStore.isValid` is false.

### Charge Status State Machine

```
PENDING → PAID       (operator marks line paid)
PENDING → OVERDUE    (line is recurring AND charge.due_date < today)
OVERDUE → PAID       (operator marks late line paid)
PAID    → PENDING    (operator unmarks — reverts based on due date)
```

`charges.status` is derived from its lines after every line change: `overdue` if any recurring line is overdue; `paid` if all lines are paid; `pending` otherwise.

### Types & Utilities

Shared types are in `lib/types.ts`: `Contact`, `Charge`, `ChargeLine`, `ChargeTemplate`, `ContactTemplate`, `ChargeStatus`, `PaymentMethod`, `LineType`, `Summary`, `ChargeFilters`. Formatting helpers are in `lib/format.ts`: `formatColones(amount)` → `₡35,000`, `formatDate("YYYY-MM-DD")` → `"15 abr 2026"`.

### Styling

NativeWind v4 (Tailwind v3 — **do not upgrade to Tailwind v4**). Global styles in `global.css`. Gluestack UI v3 for UI primitives. `lucide-react-native` for icons.

## React Conventions

Extract a component when it genuinely simplifies the code — e.g. the logic is reused in multiple places, or the JSX block is large enough that inlining it obscures the parent's intent. Don't extract for its own sake: a small, one-off piece of JSX belongs inline.

JSX section label comments (`{/* Header */}`, `{/* Save button */}`, etc.) are encouraged in screens and large components — they orient the reader without explaining logic.

## Navigation / UX Conventions

Use a chevron `›` (right-aligned, `text-gray-300`) on tappable cards that navigate to an edit or detail screen. This follows the iOS settings pattern and signals interactivity without adding visual noise.

## Localization

UI and labels are in Spanish. Code identifiers (table/collection names, column names, types, variables) are in English.

All user-visible strings live in `constants/labels.ts` (`LABELS` const, grouped by domain). Import from there; don't hardcode strings in components.

## Component Catalog

Reusable components are documented in `docs/component-catalog.md`. Check it before creating new components — props, behavior, and usage examples are there. When adding a new reusable component, add an entry to the catalog.
