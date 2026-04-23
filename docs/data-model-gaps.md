# Data Model Gaps — Analysis

**Context:** The current spec (pagos-phase-1.md) was designed for a simple client→charge model. The real student data reveals several structural gaps that need to be addressed before Slice 6 (CSV import).

- The system is for a school now, but the data model could serve other contexts

---

## 1. Students vs. Parents (billing entity mismatch)

**Current model:** `clients` = the person who pays = the person being charged. One entity.

**Reality:** The school tracks students, but **parents pay**. A parent can have multiple students (e.g. Lucas + Clarita Bayona Alpizar share the same parent and the charge ₡380,000 is one combined bill for both).

**Options:**

- **A) Keep clients = parents, add student names as notes.** Simple. Works for the current scale. Loses ability to filter/report by student.
- **B) Add a `students` table, link many students to one client (parent).** Cleaner long-term. A charge belongs to a parent but can reference one or more students.

**Recommendation: Option B.** Even at 20 parents, the operator thinks in terms of students (ClassDojo list is by student). The charge display should say "Lucas + Clarita" not just the parent name.

---

## 2. Scholarship / Subsidy (IMAS)

**Current model:** `amount` on a charge is the full amount owed.

**Reality:** Some students have a partial scholarship from IMAS. Their monthly charge is lower (₡131,000 vs ₡210,000 baseline). The operator needs to track:
- Which students are IMAS-subsidized
- That the reduced amount is the net amount owed by the parent (not the full tuition)

**What we do NOT need (Phase 1):** tracking the IMAS disbursement separately or reconciling it with the school's income.

**Change needed:** Add a `scholarship` flag or tag on the student/client record. The reduced amount flows naturally into the charge — no formula needed, the operator just sets the amount when creating the charge (or the template already reflects it).

**Action:** Add a `scholarship_type TEXT` field on `clients` (or `students`). Values: `null` (none), `'imas'`, extensible. Use it as a display label, not for amount calculation.

---

## 3. One-off Extras on Top of Fixed Monthly

**Current model:** templates pre-fill concept + amount, then the charge is independent.

**Reality:** Monthly tuition is fixed, but extras exist (uniforms, field trips, materials). These are:
- Per-student, not per-parent
- Added on top of the base monthly, or as separate charges
- Not recurring — they appear when the school decides

**No model change needed.** The current system handles this correctly: create a separate charge with its own concept and amount. The template catalog already supports a "Uniforme" or "Paseo" entry. The operator adds the charge manually when it applies.

**Clarify in the UI:** the charge list per parent should group or label charges clearly so the operator can see "Mensualidad + Uniforme" for a given month.

---

## 4. Grade / Classroom

**Reality:** Students belong to a grade (6.º, 3.er, 2.º, 1.er, Jardín, Preescolar). This is useful for:
- Filtering charges by grade (e.g. "show all Preescolar pending payments")
- Bulk charge creation ("charge all Jardín students for May")

**Change needed:** Add `grade TEXT` field on `students`. Not on clients — a parent with two kids in different grades needs both tracked.

---

## 5. CSV Import Schema (revised)

The current spec CSV schema was:
```
client_name, phone, concept, amount, due_date
```

This is too flat for the real data. Proposed revised schema:

```
student_name, parent_name, phone, grade, scholarship, concept, amount, due_date
```

- `student_name`: full name (used to create or match the student record)
- `parent_name`: billing entity — if two rows share the same `parent_name` + `phone`, they link to the same parent
- `phone`: optional
- `grade`: e.g. `Preescolar`, `Jardín`, `1er`, etc.
- `scholarship`: `imas` or blank
- `concept`, `amount`, `due_date`: charge fields (can be blank for a student-only import with no initial charge)

**Alternative: Excel with two sheets**

| Sheet | Purpose |
|---|---|
| `Estudiantes` | student_name, parent_name, phone, grade, scholarship — one row per student |
| `Cobros` | student_name (or parent_name), concept, amount, due_date — one row per charge |

The two-sheet approach is cleaner for the operator's existing workflow (she likely already has a student list separate from the monthly charge list) and avoids repeating parent/grade data per charge row.

**Recommendation: Excel with two sheets.** The operator can maintain the student sheet as her master list and only touch the charges sheet each month.

---

## 6. Summary of Model Changes

| Entity | Change |
|---|---|
| `clients` | Rename conceptually to "parents/guardians". Add `scholarship_type` if we don't add a students table. |
| `students` (new) | `id`, `client_id` (parent FK), `name`, `grade`, `scholarship_type`, `active`, timestamps |
| `charges` | Add optional `student_id` FK (a charge can be for one student, multiple students, or the parent directly) |
| Templates | No change — they remain concept + amount seeds |

---

## 7. What to Decide Before Slice 6

1. **Students as a first-class entity?** (Recommended: yes, add `students` table)
2. **One charge per student or per parent per month?** (Recommendation: per parent, but display student names on the charge)
3. **Excel vs flat CSV for import?** (Recommendation: Excel two-sheet)
4. **Does the operator want to filter the dashboard by grade?** (If yes, grade on students is essential)
