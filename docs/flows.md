# Flows

Implementation state of the main operator flows. Each flow has its steps, success criterion, test coverage, and non-goals.

Status legend: ✅ DONE · 🔄 PARTIAL · ❌ MISSING

## Status summary

| Priority | Flow | Status |
|----------|------|--------|
| 1 | Period charge generation | 🔄 PARTIAL |
| 2 | Dashboard — period view with priority ordering | 🔄 PARTIAL |
| 3 | Contact detail — current status | 🔄 PARTIAL |
| 4 | Contact payment history | ✅ DONE |
| 5 | Edit contact — monthly amount inline | 🔄 PARTIAL |
| 6 | Settings screen (import/export + dark mode) | 🔄 PARTIAL |
| 7 | Add charge to contact | ✅ DONE |
| 8 | Mark line as paid | ✅ DONE |
| 9 | Revert payment | ✅ DONE |
| 10 | Overdue detection | ✅ DONE |
| 11 | Create / edit / delete template | ✅ DONE |
| 12 | Assign template to contact | ✅ DONE |
| 13 | Create contact | ✅ DONE |
| 14 | Export payment history | ✅ DONE |

---

## Contacts

### Create contact  ✅ DONE

1. Operator taps + on the contacts tab
2. Fills name (required), phone, email, monthly amount, notes
3. Contact is saved and appears in the list

**Success:** Contact persists after app restart

**Tests:** `clients.test.ts` → `createContact`, `listContacts`

---

### Edit contact  🔄 PARTIAL

1. Operator opens a contact and taps the info card
2. Edits basic fields (name, phone, email, notes)
3. Changes are saved

**Success:** Edits reflect immediately on the detail screen

**Tests:** `clients.test.ts` → `updateContact`

**Gap:** The `monthly_amount` (personal charge) is not editable inline. Per spec, it should appear as a read-only label with an "Editar" button that turns it into an input. Changing it must NOT affect the current period — only the next one.

---

### Contact detail — current status  🔄 PARTIAL

1. Operator opens a contact
2. Sees at a glance whether the contact is up to date or has pending/overdue charges
3. The charges section shows only current-period charges + any unpaid charges from past periods
4. Full payment history is accessible via a separate link

**Success:** Operator knows immediately if a contact owes anything without scrolling through history

**Tests:** `charges.test.ts` → `listChargesByContact`

**Gap:** The screen shows current-period charges + unpaid past charges. No "up to date / has debt" summary banner at the top.

---

### Contact payment history  ✅ DONE

1. From the contact detail, operator taps "Ver historial completo"
2. Sees all charges grouped by period (month), most recent first
3. Each period shows its lines and their status; lines can be paid/reverted inline

**Success:** Operator can review any past period without it cluttering the main contact view

**Tests:** `charges.test.ts` → `listChargesByContact`

---

## Charges

### Add charge to contact  ✅ DONE

1. From the contact detail, operator taps "+ Nuevo cobro"
2. Optionally picks a template to pre-fill concept and amount
3. Fills concept, amount, type (recurring / extra), and due date
4. Charge is saved as pending with one line

**Success:** Charge appears in the contact detail and in the dashboard

**Tests:** `charges.test.ts` → `createCharge`, `listChargesByContact`

**Non-goals:** Does not generate charges in bulk — that is period generation (see below)

---

### Period charge generation  🔄 PARTIAL

1. Operator triggers "Generar cobros del mes" for a given period
2. App creates one charge per contact that has assigned templates
3. Each assigned template becomes one charge line
4. Personal template amount comes from `contact_templates.amount`, not from the template default
5. If a charge for that contact + period already exists, it is skipped (idempotent via unique index)

**Success:** All contacts get their charges for the period in one action without duplicates

**Tests:** `charges.test.ts` → `generateChargesForPeriod` (idempotency, amount override)

**Gap:** `generateChargesForPeriod(period, due_date)` is implemented and tested in `db/charges.ts`, but there is no UI to trigger it. The operator has no way to invoke bulk generation yet.

---

### Mark line as paid  ✅ DONE

1. Operator taps a pending or overdue line on the contact detail
2. Selects payment method (SINPE, transfer, cash) and date
3. Line is marked paid; charge status is recalculated automatically

**Success:** Paying one line updates the charge status immediately (overdue → pending or paid)

**Tests:** `chargeLines.test.ts`

---

### Revert payment  ✅ DONE

1. Operator taps "Revertir" on a paid line
2. Confirms the alert
3. Line reverts to pending; charge status is recalculated

**Success:** Line goes back to pending and charge status reflects the change

**Tests:** `chargeLines.test.ts`

---

### Overdue detection  ✅ DONE

Runs automatically on dashboard load.

- Recurring lines past their due date transition from pending → overdue
- Charge status is recalculated for all affected charges

**Success:** Opening the dashboard is enough to see accurate overdue state

**Tests:** `charges.test.ts` → `markOverdue`

---

## Dashboard

### Period view with priority ordering  🔄 PARTIAL

1. Operator opens the dashboard
2. Selects a period (previous month, current month, next month)
3. Sees charges ordered by priority: overdue first, then pending, then paid
4. Default view shows overdue + pending only

**Success:** Operator immediately sees what needs attention without scrolling past paid charges

**Tests:** — no tests for ordering logic

**Gap:** Default view shows overdue + pending for current period + unpaid past charges. Ordering is implemented. The default status filter could be narrowed to overdue + pending only (currently shows all).

---

### Dashboard charge card  ✅ DONE

1. Each card shows contact name, due date, status, and unpaid total
2. Tapping a card navigates to the contact detail

**Success:** Operator can identify who owes what at a glance and navigate to the contact

**Tests:** — no tests (UI component)

---

## Templates

### Create / edit / delete template  ✅ DONE

1. Operator opens the Templates tab
2. Creates a template: concept, amount, type (recurring / extra)
3. Can edit or delete existing templates

**Success:** Template persists and appears in the charge form picker

**Tests:** `chargeTemplates.test.ts`

**Note:** Personal templates (`personal: true`) are hidden from the catalog UI and from the charge form picker. Their amount lives on `contact_templates`, not here.

---

### Assign template to contact  ✅ DONE

1. From the contact detail, operator assigns a template
2. The template appears in the contact's assigned list
3. Can be removed

**Success:** Assigned templates drive period charge generation

**Tests:** `contactTemplates.test.ts`

---

## Settings

### Import from Excel  🔄 PARTIAL

1. Operator opens the import/export screen
2. Picks an `.xlsx` file with a `contacts` sheet and/or a `templates` sheet
3. Rows are validated; invalid rows are reported before committing
4. Valid rows are merged into the DB (no duplicates, no replace)

**Success:** Operator seeds contacts and templates from their existing Excel list without typing each one

**Tests:** `excel.test.ts`

**Gap:** Import/export currently lives in its own tab ("Archivos"). Per spec it should move to a Settings screen alongside dark/light mode toggle.

---

### Export payment history  ✅ DONE

1. Operator taps "Exportar historial"
2. A flat `.xlsx` is generated with one row per charge line
3. File is shared via the system share sheet

**Success:** Operator can open the export in Excel and filter/pivot without joins

**Tests:** `excel.test.ts`

---

### Settings screen  🔄 PARTIAL

Accessible via gear icon (⚙) in the Dashboard header — slides up as a bottom sheet.

Planned sections:
- Import / Export — ❌ not yet wired into sheet
- Dark / light mode toggle — ❌ not yet implemented
- User profile — ❌ planned for Phase 1B

**Non-goal:** No other settings in Phase 1
