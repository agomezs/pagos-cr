# sync-classdojo

Extracts the full student + parent directory from ClassDojo and saves it to `docs/estudiantes/directorio-classdojo.csv`.

## Steps

1. Use the Playwright MCP to navigate to `https://teach.classdojo.com/#/school/6567d2019192fd8cf6c506d5/directory/students`. If the page redirects to login, stop and ask the user to log in first, then re-run.

2. Once the directory page is loaded, run the following JS via `browser_evaluate` to fetch all students and parent data in one API call:

```js
async () => {
  const schoolId = '6567d2019192fd8cf6c506d5';
  const res = await fetch(`https://teach.classdojo.com/api/dojoSchool/${schoolId}/directory/student?limit=200`, { credentials: 'include' });
  const data = await res.json();

  const gradeMap = {
    'other': 'Otro', '-1': 'Preescolar', '0': 'Jardin de infantes',
    '1': '1.er grado', '2': '2.º grado', '3': '3.er grado',
    '4': '4.º grado', '5': '5.º grado', '6': '6.º grado',
    'preschool': 'Preescolar', 'kindergarten': 'Jardin de infantes',
  };

  return data._items.map(s => ({
    student: `${s.firstName} ${s.lastName}`,
    grade: gradeMap[s.classYearStatus] || s.classYearStatus,
    parents: (s.parentConnections || []).map(p => ({
      name: `${p.firstName} ${p.lastName}`,
      email: p.email || p.emailAddress,
      status: p.status,
    })),
  }));
}
```

3. Write the result to `docs/estudiantes/directorio-classdojo.csv` with these columns:
   `Estudiante,Grado,Padre/Madre 1,Email 1,Estado 1,Padre/Madre 2,Email 2,Estado 2,Padre/Madre 3,Email 3,Estado 3,Padre/Madre 4,Email 4,Estado 4`

   - Sort rows alphabetically by student last name.
   - For pending connections where `firstName`/`lastName` are `undefined`, use `(pendiente)` as the name.
   - Overwrite the existing file if it exists.

4. Report a summary: total students, breakdown by grade, and any students with pending parent connections.
