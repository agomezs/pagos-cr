# NTH — Nice to Have / Deferred

## Priority list

1. **JSON backup & restore** `HIGH` — needed before Phase 1B migration
2. **Amount storage migration** `HIGH` — correctness risk; do at Phase 1B schema change
3. **Excel import Sheet 3** `MEDIUM` — assignments + amount overrides; after MVP import is validated
4. **Charge line description pre-fill** `MEDIUM` — depends on Sheet 3
5. **Excel export date filter** `LOW` — quality of life; add when operator needs it
6. **expo-file-system/next migration** `LOW` — switch import/export to File.arrayBuffer() once the new API has a stable write(Uint8Array) method

---

## 1. JSON backup & restore

Full lossless backup: export all data as JSON, share via Share Sheet, restore by importing. Needed before Phase 1B migration to PocketBase.

```typescript
type ExportData = { version: 1; exported_at: string; contacts: Contact[]; charges: Charge[]; }
```

---

## 3. Excel import — Sheet 3 (assignments)

Wire extra templates to contacts in the same file. Also the future home of `monthly_amount` + description (replacing Sheet 1's `monthly_amount` column once Sheet 3 ships).

```
Sheet 3 — assignments
  contact_name | template_concept | amount | description
```

- `amount` overrides the template default (lands on `contact_templates.amount`)
- `description` seeds `charge_lines.description` at generation time
- Resolves against the same file or existing DB. Unresolved rows flagged before commit.

---

## 5. Excel export — date filter

Add a date range picker before export. Currently dumps all history.

---

## 2. Amount storage — migrate from INTEGER to fixed-point

All amounts are stored as plain integers (colones). This breaks down if the app ever needs to handle:
- USD or other currencies with cents
- Partial payment calculations
- Exchange rate conversions

**Recommendation:** store amounts as integers in the smallest unit (e.g. centavos: `₡35,000` → `3500000`), then divide by 100 for display. Matches how Stripe and most financial systems handle money. Requires a one-time migration multiplying all existing values by 100 and updating `formatColones`.

Do during Phase 1B (PocketBase migration) to avoid a mid-phase SQLite migration on production data.

---

## 6. expo-file-system/next migration

`expo-file-system/next` (stable since SDK 54) exposes `File.arrayBuffer()`, which reads binary files directly without a base64 round-trip — measurably faster for large files. Currently blocked because the new API lacks a clean `write(Uint8Array)` method (only streams). Switch when that lands.

Currently importing from `expo-file-system/legacy` (explicit, no deprecation warning). Affected file: `app/(tabs)/importexport.tsx`.

---

## 4. Charge line description pre-fill

Pre-fill `charge_lines.description` from the assignment record when generating monthly charges. Depends on Sheet 3 being shipped first.
