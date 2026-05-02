# Excel Import Template

The import template has two sheets. Either sheet can be present on its own; both together is fine. Download it from the app via **Archivos → Descargar plantilla .xlsx**.

---

## Sheet 1 — `contacts`

| name | phone | email | monthly_amount | notes |
|------|-------|-------|---------------|-------|
| Ana Rodríguez | +506 8888-1234 | ana@gmail.com | 120000 | Mariana + Luis |
| Juan Mora | +506 8800-0001 | | 80000 | |

**Column rules:**
- `name` — required. Rows without a name are skipped.
- `phone` — optional.
- `email` — optional.
- `monthly_amount` — optional. Integer colones. Currency symbols (`₡`, `,`) are stripped automatically.
- `notes` — optional. Free text, e.g. student names.

**Deduplication:** a contact is skipped if one with the same `name` + `phone` already exists in the DB.

---

## Sheet 2 — `templates`

| concept | amount | type |
|---------|--------|------|
| Mensualidad | 120000 | recurring |
| Matrícula | 50000 | extra |

**Column rules:**
- `concept` — required. Rows without a concept are skipped.
- `amount` — required. Must be a positive integer. Rows with 0 or missing amount are skipped.
- `type` — optional. `recurring` or `extra`. Defaults to `recurring` if blank or unrecognized.

**Deduplication:** a template is skipped if one with the same `concept` already exists in the DB.

---

## Spanish column headers

The parser also accepts Spanish header names:

| English | Spanish |
|---------|---------|
| `name` | `nombre` |
| `phone` | `telefono` / `teléfono` |
| `email` | `correo` |
| `monthly_amount` | `mensualidad` |
| `notes` | `notas` |
| `concept` | `concepto` |
| `amount` | `monto` |
| `type` | `tipo` |

Sheet names `Contactos` and `Plantillas` are also accepted.

---

## What import does NOT create

- Charges, charge lines, or payments — those are created manually in the app.
- Contact-template assignments — wire templates to contacts manually after import.
