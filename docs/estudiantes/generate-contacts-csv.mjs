// Generates contacts-import.csv for the Excel import template.
// Run: node docs/estudiantes/generate-contacts-csv.mjs
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseCsv(filePath) {
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/).filter((l) => l.trim());
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// Handles quoted fields with commas inside
function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => (String(v).includes(",") ? `"${v}"` : String(v));
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))];
  return lines.join("\n") + "\n";
}

// ── Load data ────────────────────────────────────────────────────────────────

const directorio = parseCsv(resolve(__dirname, "directorio-classdojo.csv"));
const cobros = parseCsv(resolve(__dirname, "estudiantes-cobros.csv"));

// ── Nickname → student first-name/partial mapping ───────────────────────────
// Values are matched against the start of "Estudiante" in directorio (case-insensitive).
// Use a more specific prefix (e.g. "Luciana C") when first names are ambiguous.
// null = no match in directorio; those rows are warned and skipped.

const NICKNAME_MAP = {
  "Alana":           "Alana",
  "Amelia":          "Amelia",
  "Ariela":          "Ariela",
  "Chris":           "Christopher",
  "Eliana":          "Eliana",
  "Emilia":          "Emilia",
  "Emma B":          "Emma",
  "Gabriel":         "Gabriel",
  "Gustavo":         "Gustavo",
  "IMAS Amy":        "Amy",
  "IMAS CHRISTIAN":  "Christopher",
  "IMAS Dominic":    "Dominic",
  "IMAS Islani":     "Islani",
  "IMAS JULIAN":     "Juli",           // "Julián"
  "IMAS Liam":       "Liam",
  "IMAS FIO":        "Fiorella",
  "Jose David":      "José David",
  "Kai":             "Kiara",
  "Leonardo":        null,
  "Luci BB":         "Luciana Cubillo",
  "Luci M":          "Luciana Mesén",
  "Luci Oriana":     "Luciana Saenz",
  "Madisson":        "Madisson",
  "Makensi":         "Mackenzie",
  "Marcelo":         "Marcelo Monge",
  "Marcelo M":       "Marcelo Rodriguez",
  "Mariano":         "Mariano",
  "Mateo":           "Mateo",
  "Niko":            "Nicolás",
  "Oliver":          "Oliver",
  "Oliver BB":       null,
  "Santiago":        "Santiago",
  "Sofi":            "Sofía",
  "Stella":          "Stella",
  "Vale M":          "Valeria Masis",
  "Valentina":       "Valentina",
};

// Combined cobros rows that represent multiple students
// Each entry: cobros row name → array of student hints
const COMBINED_MAP = {
  "Lucas-Clari":  ["Lucas", "Clarita"],
  "Vale G-Kiara": ["Valeria Guadamuz", "Kiara"],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function findStudent(hint) {
  const h = hint.toLowerCase();
  return directorio.find((r) => r["Estudiante"].toLowerCase().startsWith(h)) ?? null;
}

function getParents(student) {
  const parents = [];
  for (let i = 1; i <= 4; i++) {
    const name = student[`Padre/Madre ${i}`]?.trim();
    const email = student[`Email ${i}`]?.trim() ?? "";
    const estado = student[`Estado ${i}`]?.trim();
    if (name && name !== "(pendiente)" && estado === "connected") {
      parents.push({ name, email });
    }
  }
  return parents;
}

// ── Build output rows ────────────────────────────────────────────────────────
// Dedup by parent name (exact). When the same parent appears for multiple
// students, merge student names into `notes` and keep the highest monthly_amount.

// parentMap key → { name, email, monthly_amount, notes[] }
const parentMap = new Map();

function upsertParent(parent, studentName, monthlyAmount) {
  const key = parent.name;
  if (parentMap.has(key)) {
    const rec = parentMap.get(key);
    if (!rec.notes.includes(studentName)) rec.notes.push(studentName);
    if (monthlyAmount > rec.monthly_amount) rec.monthly_amount = monthlyAmount;
  } else {
    parentMap.set(key, {
      name: parent.name,
      email: parent.email,
      monthly_amount: monthlyAmount,
      notes: [studentName],
    });
  }
}

for (const cobrosRow of cobros) {
  const cobrosName = cobrosRow.name.trim();
  const monthlyAmount = Math.round(Number(cobrosRow.charge) * 1000);

  // Determine which student hints to resolve
  let hints;
  if (COMBINED_MAP[cobrosName]) {
    hints = COMBINED_MAP[cobrosName];
  } else {
    const mapped = NICKNAME_MAP[cobrosName];
    if (mapped === undefined) {
      console.warn(`⚠  No mapping for cobros name "${cobrosName}" — skipping`);
      continue;
    }
    if (mapped === null) {
      console.warn(`⚠  "${cobrosName}" intentionally skipped (no directorio match)`);
      continue;
    }
    hints = [mapped];
  }

  for (const hint of hints) {
    const student = findStudent(hint);
    if (!student) {
      console.warn(`⚠  Student not found for hint "${hint}" (cobros: "${cobrosName}") — skipping`);
      continue;
    }
    const studentName = student["Estudiante"];
    const parents = getParents(student);
    if (parents.length === 0) {
      console.warn(`⚠  No connected parents for "${studentName}" — skipping`);
      continue;
    }
    for (const parent of parents) {
      upsertParent(parent, studentName, monthlyAmount);
    }
  }
}

// ── Write output ─────────────────────────────────────────────────────────────

const rows = Array.from(parentMap.values()).map((r) => ({
  name: r.name,
  phone: "",
  email: r.email,
  monthly_amount: r.monthly_amount,
  notes: r.notes.join(", "),
}));

const outPath = resolve(__dirname, "contacts-import.csv");
writeFileSync(outPath, toCsv(rows), "utf8");
console.log(`✅  Written ${rows.length} rows → ${outPath}`);
