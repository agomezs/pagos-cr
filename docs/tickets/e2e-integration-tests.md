# Integration Tests

Tests call the public `db/` functions directly and assert on their return values — no knowledge of the storage layer. This keeps the test bodies stable across the Phase 1A → 1B migration: only the infrastructure changes, not the scenarios.

---

## Flows to test

| # | Flow | DB functions under test |
|---|------|------------------------|
| 1 | Create contact | `createContact`, `listContacts` |
| 2 | Add charge to contact | `createCharge`, `createChargeLine`, `listChargesByContact` |
| 3 | Mark line as paid — charge status recalculated | `markPaid`, `deriveChargeStatus` |
| 4 | Revert payment — charge status recalculated | `unmarkPaid`, `deriveChargeStatus` |
| 5 | Overdue detection on past-due recurring line | `markOverdue` |
| 6 | Create / edit / delete template | `createTemplate`, `updateTemplate`, `deleteTemplate` |
| 7 | Assign template to contact / remove | `assignTemplate`, `removeTemplate` |
| 8 | Export payment history | `listChargesForExport` |

### Key scenarios

- Full happy path: create contact → assign template → add charge → mark paid → charge status is `paid`
- Partial payment: two lines, one paid → charge status stays `pending` or `overdue`
- `markOverdue` only transitions `recurring` lines; `extra` lines stay `pending`
- Revert on a multi-line charge with mixed statuses recalculates correctly

---

## Infrastructure

### Phase 1A — SQLite (deferred, add once PocketBase is in place)

1. Install `better-sqlite3` as a dev dependency
2. Add Jest `moduleNameMapper`: `expo-sqlite` → `__mocks__/expo-sqlite-shim.js`
3. Shim wraps `better-sqlite3` with the synchronous API shape (`openDatabaseSync`, `runSync`, `getAllSync`, `execSync`)
4. Each test suite opens a fresh in-memory DB and runs the schema migrations from `db/database.ts`

### Phase 1B — PocketBase (migration)

Only the infrastructure changes. Test bodies are untouched.w

**Docker Compose** is the right approach — a throwaway PocketBase container that starts clean, runs tests, and stops. Never point tests at the production instance.

```yaml
# docker-compose.test.yml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    ports:
      - "8090:8090"
    command: ["serve", "--http=0.0.0.0:8090", "--dev"]
    tmpfs:
      - /pb_data   # in-memory — wiped on container stop, same as better-sqlite3 today
```

```json
// package.json
"test:integration": "docker compose -f docker-compose.test.yml up -d && jest --testPathPattern=integration && docker compose -f docker-compose.test.yml down"
```

**Schema bootstrap** — PocketBase requires collections to exist before any SDK call works. Write a migration script (PocketBase supports JS migrations via `pb migrate`) that creates all five collections with the correct fields and rules. The Docker container runs this on startup so the test environment is fully configured without manual steps.

Steps to migrate:

1. Remove the `better-sqlite3` shim and `moduleNameMapper` entry
2. Add `docker-compose.test.yml` with `tmpfs` mount
3. Write PocketBase migration script for all five collections
4. Replace `beforeEach` DB init with a helper that deletes all records between tests (collections stay, data is wiped)
5. Set `EXPO_PUBLIC_POCKETBASE_URL=http://localhost:8090` in the test environment
6. `db/` function signatures stay the same — tests import and call them identically

---

## Feature backlog

| # | Ticket | Impact | Complexity | Notes |
|---|--------|--------|------------|-------|
| 1 | Period column on charges | 🔴 Critical | Medium | Unblocks 3 other items — do first |
| 2 | Period charge generation UI | 🔴 Critical | Low | Core operator workflow; DB logic already in ticket #1 |
| 3 | Contact detail — status summary | 🟠 High | Low | Operator's primary "does this person owe?" signal |
| 4 | Dashboard — default to overdue+pending | 🟠 High | Low | One-liner filter + toggle; removes noise on every load |
| 5 | Contact payment history screen | 🟡 Medium | Low | New screen but simple read-only list; needed once history accumulates |
| 6 | Edit monthly amount inline | 🟡 Medium | Medium | UI is simple; care needed to not mutate current-period lines |
| 7 | Settings screen | 🟢 Low | Low | Pure UI reorganization — no logic change, just moving existing screens |

**Ship together as one slice (highest ROI):** #1 → #2 → #3 → #4

**Defer:** #5 until history accumulates · #6 operator can recreate the contact_template for now · #7 cosmetic

---

## Feature ticket detail

### 1 · Period column on charges

`docs/tickets/period-on-charges.md`

- `db/database.ts` — `period TEXT NOT NULL`; unique index on `(contact_id, period)`
- `lib/types.ts` — add `period` to `Charge`, `period?` to `ChargeFilters`
- `lib/format.ts` — `currentPeriod()`, `formatPeriod(period)`
- `db/charges.ts` — `createCharge` accepts period; `listChargesForPeriod`, `listChargesByContactInPeriod`
- `db/generation.ts` (new) — `generateChargesForPeriod(period)`: transaction-wrapped, idempotent via unique index

### 2 · Period charge generation UI

Depends on #1. "Generar cobros de [periodo]" button on the dashboard.

- `app/(tabs)/index.tsx` — button near period selector; disabled if charges already exist for the period
- Confirmation `Alert.alert` + toast "X cobros generados" on success

### 3 · Contact detail — status summary + history link

Depends on #1.

- `app/contacts/[id]/index.tsx` — "Al día" / "Adeuda ₡X" badge; scoped charge list via `listChargesByContactInPeriod`
- "Ver historial completo ›" link to future `history.tsx`

### 4 · Dashboard — default to overdue + pending

- `app/(tabs)/index.tsx` — `showPaid` state default `false`; "Mostrar pagados" toggle with hidden count
- Verify sort: overdue → pending → paid

### 5 · Contact payment history screen

Depends on #1. New `app/contacts/[id]/history.tsx` — all charges grouped by `period` desc.

### 6 · Edit monthly amount inline

- `app/contacts/[id]/edit.tsx` — read-only label + "Editar" toggle; calls `updateContactTemplate`
- Helper text: "El cambio aplica a partir del próximo periodo"

### 7 · Settings screen

- New `app/(tabs)/settings.tsx` replacing Archivos tab
- Move import/export UI; add dark/light mode toggle (`Appearance` + `AsyncStorage`)
