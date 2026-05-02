# Add `period` to charges

Make period a first-class column on `charges` so we can dedupe bulk generation, enforce one-charge-per-contact-per-period, and query "current period + unpaid past periods" cleanly.

Format: `YYYY-MM` (e.g. `2026-05`). Configurable period shape is a future phase — keep the column, widen the value format later.

DB can be nuked — no migration / backfill needed.

## Steps

1. **Schema** (`db/database.ts`)
   - Add `period TEXT NOT NULL` to `charges`.
   - `CREATE UNIQUE INDEX idx_charges_contact_period ON charges(contact_id, period);`
   - `CREATE INDEX idx_charges_period ON charges(period);`

2. **Types** (`lib/types.ts`)
   - Add `period: string` to `Charge`.
   - Add `period?: string` to `ChargeFilters`.

3. **Helpers** (`lib/format.ts`)
   - `currentPeriod(): string` → `YYYY-MM` for today.
   - `formatPeriod(period: string): string` → `"Mayo 2026"` (Spanish month + year).

4. **Charges CRUD** (`db/charges.ts`)
   - `createCharge` accepts `period`, inserts it.
   - Add `listChargesForPeriod(period)` — current period + any unpaid charge from earlier periods.
   - Add `listChargesByContactInPeriod(contact_id, period)` — same logic, scoped to one contact (powers contact detail).
   - Existing `listCharges(filters)` honors `filters.period` when set.

5. **Bulk generation** (new — likely `db/charges.ts` or a new `db/generation.ts`)
   - `generateChargesForPeriod(period)`:
     - For each active contact with active `contact_templates`, insert a `charges` row with `period` if none exists for `(contact_id, period)`.
     - Insert one `charge_line` per assigned template (use `contact_templates.amount` override when present).
     - Wrap in a transaction; rely on the unique index for idempotency.

6. **Dashboard** (`app/(tabs)/index.tsx`)
   - Load with `currentPeriod()`; use `listChargesForPeriod`.
   - `markOverdue()` still runs on load (unchanged — period doesn't affect overdue logic).

7. **Contact detail** (`app/contacts/[id]/index.tsx`)
   - Use `listChargesByContactInPeriod(id, currentPeriod())`.
   - Add a "Ver historial" link to a new full-history screen grouped by period.

8. **Full history screen** (new — `app/contacts/[id]/history.tsx`)
   - Lists all charges for the contact, grouped by `period` desc, formatted with `formatPeriod`.

9. **Tests** (`__tests__/charges.test.ts`)
   - Bulk generation is idempotent (running twice for the same period creates no duplicates).
   - `listChargesForPeriod` surfaces unpaid charges from prior periods.
   - Changing `contact_templates.amount` does not mutate already-generated lines for the current period.

## After completing and verifying

Update these docs to reflect the new state:

- `docs/flows.md` — mark "Period charge generation" and "Contact payment history" as ✅ DONE; update "Contact detail — current status" and "Period view with priority ordering" gaps; remove the open question from "Period charge generation".
- `docs/data-model.md` — add `period TEXT NOT NULL` to the `charges` entity description and diagram; note the unique constraint on `(contact_id, period)`.

## Out of scope

- Period configurability (fortnightly, academic term) — column stays, value format widens later.
- Generation audit log (who/when generated) — Phase 2+.
- UI to trigger generation — separate ticket.
