# Data Model

The system is multi-tenant by design — generic enough to serve schools, condos, gyms, or ASADAs. The model below is what is implemented in Phase 1A.

---

## Entities

### `contacts`

The billing party. Named `contacts` (not `clients`) because the payer is not always a parent — it can be an institution, sponsor, or any third party.

### `charge_templates`

Operator-defined catalog of line definitions. Set up once; used as seeds when generating charges.

- `type: recurring` — goes overdue if unpaid past due date
- `type: extra` — stays pending indefinitely
- `personal: true` — applies to every contact but with a per-contact amount (e.g. tuition). Hidden from the catalog UI. Amount is set on the `contact_templates` row, not here.

### `contact_templates`

Join table: which templates are assigned to which contact. Drives automatic charge generation.

- `amount` — overrides the template default. Required for `personal` templates; optional for extras.
- `description` — free text seeded into `charge_lines.description` at generation time (e.g. "Lucas + Clarita").

### `charges`

Charge header per contact per period. `status` is derived from its lines — never set manually.

- `period` — `YYYY-MM` string identifying the billing period (e.g. `2026-05`). Unique per `(contact_id, period)` — enforced by a DB unique index so bulk generation is idempotent.
- `due_date` — the actual payment deadline, which can differ from the period (e.g. a May charge due June 15).

### `charge_lines`

One line item per charge. Each line is paid independently. `description` is free text for recipient names (e.g. "Lucas + Clarita") — no `beneficiaries` table in Phase 1.

---

## Entity Diagram

### High level

```
contacts ──────────< charges
    |                   |
    |                   └──────< charge_lines
    |
    └──────< contact_templates >──────── charge_templates
```

### Expanded

```
contacts                        charge_templates
+------------------+            +---------------------------+
| id               |            | id                        |
| name             |            | concept                   |
| phone            |            | amount                    |
| notes            |            | type: recurring | extra    |
| active           |            | personal: bool            |  ← hidden from catalog UI
+------------------+            +---------------------------+
        |                                 |
        | 1                     contact_templates
        |                       +---------------------------+
        | *                     | id                        |
+------------------+            | contact_id (FK)           |
| charges          |            | template_id (FK)          |
+------------------+            | amount                    |  ← overrides template default
| id               |            | description               |  ← seeds charge_lines.description
| contact_id (FK)  |            | active                    |
| period           |            +---------------------------+
| due_date         |
| status           |  ← derived: pending | overdue | paid
+------------------+
        |
        | 1
        |
        | *
+---------------------+
| charge_lines        |
+---------------------+
| id                  |
| charge_id (FK)      |
| concept             |
| amount              |
| description         |  ← free text e.g. "Lucas + Clarita"
| type                |  ← recurring | extra
| status              |  ← pending | overdue | paid
| payment_method      |
| paid_at             |
+---------------------+
```

---

## Charge Status Rules

`charges.status` is derived after every line change:

- `overdue` — at least one `recurring` line is overdue
- `paid` — all lines are paid
- `pending` — otherwise

Only `recurring` lines go overdue. `extra` lines stay `pending` indefinitely.

---

## Monthly Charge Generation

The operator triggers generation once per period. The app creates one charge per contact with one line per assigned template:

```
charge_templates
  t1  concept: "Mensualidad"  amount: 0      type: recurring  personal: true
  t2  concept: "Ballet"       amount: 25000  type: extra      personal: false
  t3  concept: "Guardería"    amount: 40000  type: extra      personal: false

contact_templates
  Fernanda  ->  t1 (amount: 380000, description: "Lucas + Clarita"), t2 (description: "Clarita")
  Ana       ->  t1 (amount: 210000, description: "Ana"), t3

generated charges (May 2026)
  Fernanda  ->  charge + line: Mensualidad 380000 "Lucas + Clarita" + line: Ballet 25000 "Clarita"
  Ana       ->  charge + line: Mensualidad 210000 "Ana" + line: Guardería 40000
```

The template is only a seed — once the line is created it is independent. `personal` templates are hidden from the catalog UI; their amount is always set on the `contact_templates` row.

---

## Example — Marco, May 2026

```
contact:  Marco  +506 8888-1111
charge:   due 2026-05-02  status: pending
  line 1  tuition  "Lucas + Clarita"  380000  recurring  [pending]
  line 2  ballet   "Clarita"           25000  extra      [pending]
  total pending: 405000

after paying line 1:
  line 1  [paid 2026-05-03  sinpe]
  line 2  [pending]
  total pending: 25000
```

---

## Excel Import Format (Slice 6 — onboarding seed, MVP)

Two independent sheets. Either or both can be present.

```
Sheet 1 — contacts
  name | phone | email | monthly_amount | notes

Sheet 2 — templates
  concept | amount | type   (type: recurring | extra)
```

- `monthly_amount` — tuition for this family. At import time: finds or creates the "Mensualidad" personal template, then creates a `contact_templates` row with the override amount.
- `notes` — free text, informational (e.g. student names)

Rules:
- Each sheet is independent; importing only one is valid
- Import **merges** into the existing DB — does not replace it
- No charges or charge_lines in the import
- The operator wires extra templates to contacts manually in the app after import

**Migration path to Sheet 3:** when Sheet 3 ships, `monthly_amount` moves there as a `contact_templates` row with amount + description. The DB shape is unchanged — only the import source changes.

## Excel Export Format (Slice 6 — payments history)

One flat sheet, one row per `charge_line`:

```
contact_name | phone | concept | description | amount | type |
due_date | status | payment_method | paid_at
```

Contact and charge fields are denormalized into each row so the operator can filter and pivot in Excel without joins.

---

## Future

A `beneficiaries` table would enable per-student reporting, grade filtering, and the Phase 5 client portal. Deferred past Phase 1.
