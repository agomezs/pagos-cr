# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                        # Expo dev server
npm run ios                      # run on iOS simulator
npm run android                  # run on Android emulator
```

ESLint is configured (`eslint.config.js`). Run with `npm run lint` or `npm run lint:fix`.

## Architecture

### Routing

expo-router with a tab-based layout. Three tabs live under `app/(tabs)/`: Dashboard (`index.tsx`), Clients (`clients.tsx`), and Templates (`templates.tsx`). Detail and form screens are nested route folders: `app/charges/[id]/`, `app/clients/[id]/`, `app/templates/[id]/`, each containing `new.tsx` or a detail screen.

### Database

`db/database.ts` opens a singleton SQLite database (`pagos.db`) and runs inline migrations on first open. All schema lives in `runMigrations()` — add new tables or columns there. Three domain modules wrap queries:

- `db/charges.ts` — CRUD + `markOverdue()` (call on dashboard load), `markPaid()`, `unmarkPaid()`, `listCharges(filters)`
- `db/clients.ts` — client CRUD
- `db/chargeTemplates.ts` — template CRUD

All IDs are UUIDs generated with `expo-crypto` (`randomUUID()`) — don't use `uuid` or `Math.random()`. Amounts are stored as integers (colones, no decimals).

`markOverdue()` in `db/charges.ts` transitions stale pending charges to overdue — it must be called each time the dashboard loads, not just on app start.

### Types & Utilities

Shared types are in `lib/types.ts`: `Client`, `Charge`, `ChargeTemplate`, `ChargeStatus`, `PaymentMethod`, `Summary`, `ChargeFilters`. Formatting helpers are in `lib/format.ts`: `formatColones(amount)` → `₡35,000`, `formatDate("YYYY-MM-DD")` → `"15 abr 2026"`.

### Styling

NativeWind v4 (Tailwind v3 — **do not upgrade to Tailwind v4**). Global styles in `global.css`. Gluestack UI v3 for UI primitives. `lucide-react-native` for icons.

## React Conventions

Extract a component when it genuinely simplifies the code — e.g. the logic is reused in multiple places, or the JSX block is large enough that inlining it obscures the parent's intent. Don't extract for its own sake: a small, one-off piece of JSX belongs inline.

JSX section label comments (`{/* Header */}`, `{/* Save button */}`, etc.) are encouraged in screens and large components — they orient the reader without explaining logic.

## Navigation / UX Conventions

Use a chevron `›` (right-aligned, `text-gray-300`) on tappable cards that navigate to an edit or detail screen. This follows the iOS settings pattern and signals interactivity without adding visual noise.

## Component Catalog

Reusable components are documented in `docs/component-catalog.md`. Check it before creating new components — props, behavior, and usage examples are there. When adding a new reusable component, add an entry to the catalog.
