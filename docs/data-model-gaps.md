# Data Model Gaps — Analysis

**Context:** The current spec (pagos-phase-1.md) was designed for a simple client→charge model. The real data reveals several gaps. This document captures the decisions made and the revised model.

- The system is for a school now, but the data model is designed to be generic

---

## 1. Billing entity (was: clients)

The payer is not always a parent — it can be an institution, a sponsor, or any third party. Renamed to `contacts` to stay generic.

**Decision:** `clients` → `contacts`

---

## 2. Charge structure (was: single amount per charge)

A charge can have multiple line items (monthly fee, ballet, materials). Each line is paid independently. The charge total is the sum of unpaid lines.

**Decision:** split into `charges` (header) + `charge_lines` (items)

---

## 3. Line type (was: is_mensualidad)

Only recurring lines go overdue. One-off extras do not. Using a generic `type` field instead of a business-specific flag.

**Decision:** `type: recurring | extra` on `charge_lines` and `charge_templates`

---

## 4. Charge status (was: operator-set)

Charge status is derived from its lines — not set manually.

**Decision:**
- `pending` — at least one line is pending, none overdue
- `overdue` — at least one recurring line is overdue
- `paid` — all lines are paid

---

## 5. Monthly charge generation

The operator does not create charges manually each month. The app generates them automatically based on which templates each contact has assigned.

**Decision:** `contact_templates` join table links contacts to their recurring templates. Generation runs on a schedule or is triggered by the operator once per period.

`charge_templates` is a catalog of reusable line definitions set up once by the operator:

```
charge_templates
  t1  concept: "Tuition"   amount: 210000  type: recurring
  t2  concept: "Ballet"    amount: 25000   type: extra
  t3  concept: "Daycare"   amount: 40000   type: recurring
```

Each contact gets the templates that apply to them:

```
contact_templates
  Marco  ->  t1 (tuition)
  Marco  ->  t2 (ballet)
  Ana    ->  t1 (tuition)
  Ana    ->  t3 (daycare)
```

When the operator triggers "generate May charges" the app creates one charge per contact with one line per assigned template:

```
Marco  ->  charge + line: Tuition 210000 + line: Ballet 25000
Ana    ->  charge + line: Tuition 210000 + line: Daycare 40000
```

The template is only a seed — once the line is created it is independent. The operator can adjust the amount before confirming (e.g. Marco's tuition is 380000 for two kids, not the base 210000).

---

## 6. Recipient names on lines

No `beneficiaries` table in Phase 1. Recipient names are free text on the line (`description`).

**Decision:** `description TEXT` on `charge_lines` — e.g. "Lucas + Clarita"

**Future:** a `beneficiaries` table enables per-student reporting, grade filtering, and the Phase 5 client portal.

---

## 7. Import format

Two-sheet Excel: one sheet for contacts, one for the initial charge lines. The operator maintains the contacts sheet as her master list.

**Proposed schema:**

```
Sheet 1 — Contacts
  name, phone, notes

Sheet 2 — Charge lines
  contact_name, concept, description, amount, type, due_date
```

---

## 8. Entity Diagram

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
| active           |            +---------------------------+
+------------------+                      |
        |                                 |
        | 1                     contact_templates
        |                       +---------------------------+
        | *                     | id                        |
+------------------+            | contact_id (FK)           |
| charges          |            | template_id (FK)          |
+------------------+            | active                    |
| id               |            +---------------------------+
| contact_id (FK)  |
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

### Example — Marco, May 2026

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

### Key rules

- A charge belongs to a `contact`; recipient names are free text in `description`
- Each `charge_line` is paid independently; no partial payment within a line
- Only `recurring` lines go overdue; `extra` lines do not
- Charge `status` is derived from its lines — never set manually
- `contact_templates` + `charge_templates` drive automatic monthly generation -- The generation is phase one only and should be updated later to something better/

## implementation order:
                                
  1. Schema — new database.ts with contacts, charges,
  charge_lines, charge_templates (with type),            
  contact_templates
  2. Seed data — a handful of contacts with assigned     
  templates so every screen has something to show        
  3. DB modules — rewrite contacts.ts, charges.ts, new
  chargeLines.ts, update chargeTemplates.ts              
  4. Rename clients → contacts throughout (screens,
  labels, routes)                                        
  5. Contact templates UI — assign/remove templates on
  the contact detail screen                              
  6. Generation screen — picker → preview with editable
  amounts → confirm                                      
  7. Dashboard + charge display — adapt to the new
  charge+lines model (show line breakdown, per-line pay)
