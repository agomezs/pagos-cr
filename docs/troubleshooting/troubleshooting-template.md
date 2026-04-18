# Troubleshooting

## "[Error message]" — [Short description]

**Status: unresolved** <!-- unresolved | resolved | workaround in place -->

**Resolution:** <!-- leave blank until closed — one sentence describing the fix -->

---

### Affected versions

| Package | Version |
|---------|---------|
| [package] | x.x.x |
| [package] | x.x.x |

---

### Symptom

[Describe what the user sees. Include the full error message and stack trace if available.]

```
ERROR [...]
  ComponentName (file/path.tsx:line)
```

[Note when the error occurs — on render, on interaction, always, intermittently.]

---

### Stack overview

- [Framework / library versions relevant to the bug]
- [Relevant config or wrappers]

[Include abbreviated code snippets of the relevant layout or provider setup if helpful.]

---

### Hypotheses

[Order by likelihood. Work top to bottom.]

**Hypothesis 1 — [Title]**

Reasoning: [Why you think this is the cause.]

Changes:
- [Change 1]
- [Change 2]

Trade-off introduced: [any side effects or regressions, or "none"]

Result: <!-- persisted | resolved | partial | reverted -->

---

**Hypothesis 2 — [Title]**

Reasoning: [Why you think this is the cause.]

Changes:
- [Change 1]

Trade-off introduced:

Result: <!-- persisted | resolved | partial | reverted -->

---

### Hypotheses to try (most likely first)

[Order by likelihood. Work top to bottom — mark each tested as you go.]

| # | Status | Hypothesis / Fix to attempt | Reasoning | Result |
|---|--------|----------------------------|-----------|--------|
| 1 | ⬜ Untested | [What to try] | [Why you think this is the cause] | — |
| 2 | ⬜ Untested | [What to try] | [Why] | — |
| 3 | ⬜ Untested | [What to try] | [Why] | — |
| 4 | ✅ Tested | [What was tried] | [Why] | persisted <!-- persisted | resolved | partial | reverted --> |
