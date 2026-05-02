# Backlog

## Priority

| # | Ticket | Impact | Complexity | Notes |
|---|--------|--------|------------|-------|
| 1 | Period column on charges | 🔴 Critical | Medium | Unblocks 3 other items — do first |
| 2 | Period charge generation UI | 🔴 Critical | Low | Core operator workflow; DB logic already in ticket #1 |
| 3 | Contact detail — status summary | 🟠 High | Low | Operator's primary "does this person owe?" signal |
| 4 | Dashboard — default to overdue+pending | 🟠 High | Low | One-liner filter + toggle; removes noise on every load |
| 5 | Contact payment history screen | 🟡 Medium | Low | New screen but simple read-only list; needed once history accumulates |
| 6 | Edit monthly amount inline | 🟡 Medium | Medium | UI is simple; care needed to not mutate current-period lines |
| 7 | Settings screen | 🟢 Low | Low | Pure UI reorganization — no logic change, just moving existing screens |

---

## Recommended order

**Ship together as one slice (highest ROI):**
1. `period-on-charges` → schema + DB functions + bulk generation logic
2. `period-charge-generation-ui` → dashboard button
3. `contact-detail-status-summary` → status badge + scoped charge list
4. `dashboard-default-filter` → hide paid by default

**Defer until history starts to matter:**
5. `contact-payment-history` — low urgency while the app is fresh

**Defer — low operational value:**
6. `edit-contact-monthly-amount` — operator can delete and re-create the contact_template for now
7. `settings-screen` — Archivos tab works fine as-is; dark mode is cosmetic

---

## Tickets

### 1 · Period column on charges

`docs/tickets/period-on-charges.md`

Add `period TEXT NOT NULL` (`YYYY-MM`) to `charges`. Unique index on `(contact_id, period)`.

- `db/database.ts` — add column + indexes (nuke DB, no migration needed)
- `lib/types.ts` — add `period` to `Charge`, `period?` to `ChargeFilters`
- `lib/format.ts` — add `currentPeriod()` and `formatPeriod(period)`
- `db/charges.ts` — `createCharge` accepts period; add `listChargesForPeriod(period)`, `listChargesByContactInPeriod(contact_id, period)`
- `db/generation.ts` (new) — `generateChargesForPeriod(period)`: one charge per contact with assigned templates, idempotent via unique index, transaction-wrapped
- Tests: idempotency, prior-period surfacing, amount override isolation

---

### 2 · Period charge generation UI

`docs/tickets/period-charge-generation-ui.md` · Depends on #1

"Generar cobros de [periodo]" button on the dashboard.

- `app/(tabs)/index.tsx` — button near period selector; disabled if charges already exist for the period
- Confirmation `Alert.alert` showing period name + contact count
- Call `generateChargesForPeriod(period)`; toast "X cobros generados" on success
- `constants/labels.ts` — generation strings

---

### 3 · Contact detail — status summary + history link

`docs/tickets/contact-detail-status-summary.md` · Depends on #1

- `app/contacts/[id]/index.tsx` — "Al día" (green) / "Adeuda ₡X" (red) badge using `listChargesByContactInPeriod`
- Replace full-history charge list with current-period + unpaid past charges
- Add "Ver historial completo ›" link to `history.tsx`
- `constants/labels.ts` — "Al día", "Adeuda", "Ver historial completo"

---

### 4 · Dashboard — default to overdue + pending

`docs/tickets/dashboard-default-filter.md` · No dependencies

- `app/(tabs)/index.tsx` — `showPaid` state defaulting to `false`; filter out paid charges
- "Mostrar pagados / Ocultar pagados" toggle with hidden count
- Verify sort order: overdue → pending → paid

---

### 5 · Contact payment history screen

`docs/tickets/contact-payment-history.md` · Depends on #1

- New screen `app/contacts/[id]/history.tsx`
- All charges for the contact grouped by `period` desc, formatted with `formatPeriod`
- Navigated to from the "Ver historial completo ›" link in ticket #3

---

### 6 · Edit monthly amount inline

`docs/tickets/edit-contact-monthly-amount.md` · No hard dependency

- `app/contacts/[id]/edit.tsx` — read-only label + "Editar" button toggle
- On save: `updateContactTemplate({ id, amount })`; helper text "El cambio aplica a partir del próximo periodo"
- Validation: positive integer

---

### 7 · Settings screen

`docs/tickets/settings-screen.md` · No dependencies

- New `app/(tabs)/settings.tsx` replacing the Archivos tab
- Move import/export UI into Settings; delete Archivos screen
- Add dark/light mode toggle (`Appearance` + `AsyncStorage`)
