import * as XLSX from 'xlsx';
import { parseExcelImport, buildExportWorkbook, buildImportTemplate } from '../lib/excel';
import type { ExportLineRow } from '../lib/excel';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeWorkbook(sheets: Record<string, Record<string, unknown>[]>): string {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  }
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

const CONTACT_ROW = { name: 'Ana Rodríguez', phone: '+506 8888-1234', email: 'ana@gmail.com', monthly_amount: 120000, notes: 'Mariana + Luis' };
const TEMPLATE_ROW = { concept: 'Mensualidad mayo', amount: 120000, type: 'recurring' };

const EXPORT_LINE: ExportLineRow = {
  contact_name: 'Ana Rodríguez',
  phone: '+506 8888-1234',
  concept: 'Mensualidad mayo',
  description: 'Mariana + Luis',
  amount: 120000,
  type: 'recurring',
  due_date: '2026-05-02',
  status: 'paid',
  payment_method: 'sinpe',
  paid_at: '2026-05-01',
};

// ── parseExcelImport ───────────────────────────────────────────────────────

describe('parseExcelImport — contacts sheet', () => {
  it('parses a valid contacts row', () => {
    const base64 = makeWorkbook({ contacts: [CONTACT_ROW] });
    const result = parseExcelImport(base64);
    expect(result.errors).toHaveLength(0);
    expect(result.contacts).toHaveLength(1);
    const c = result.contacts[0];
    expect(c.name).toBe('Ana Rodríguez');
    expect(c.phone).toBe('+506 8888-1234');
    expect(c.email).toBe('ana@gmail.com');
    expect(c.monthly_amount).toBe(120000);
    expect(c.notes).toBe('Mariana + Luis');
  });

  it('accepts Spanish column headers (nombre, telefono, mensualidad, notas)', () => {
    const base64 = makeWorkbook({
      contacts: [{ nombre: 'Juan Mora', telefono: '+506 8800-0001', mensualidad: 80000, notas: 'Solo Juan' }],
    });
    const result = parseExcelImport(base64);
    expect(result.errors).toHaveLength(0);
    const c = result.contacts[0];
    expect(c.name).toBe('Juan Mora');
    expect(c.phone).toBe('+506 8800-0001');
    expect(c.monthly_amount).toBe(80000);
    expect(c.notes).toBe('Solo Juan');
  });

  it('accepts sheet named "Contactos" (Spanish)', () => {
    const base64 = makeWorkbook({ Contactos: [CONTACT_ROW] });
    const result = parseExcelImport(base64);
    expect(result.contacts).toHaveLength(1);
  });

  it('sets optional fields to null when missing', () => {
    const base64 = makeWorkbook({ contacts: [{ name: 'Sin Teléfono' }] });
    const result = parseExcelImport(base64);
    const c = result.contacts[0];
    expect(c.phone).toBeNull();
    expect(c.email).toBeNull();
    expect(c.monthly_amount).toBeNull();
    expect(c.notes).toBeNull();
  });

  it('skips rows with empty name and adds an error', () => {
    const base64 = makeWorkbook({ contacts: [{ name: '' }, CONTACT_ROW] });
    const result = parseExcelImport(base64);
    expect(result.contacts).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/fila 2/);
  });

  it('rounds monthly_amount to integer', () => {
    const base64 = makeWorkbook({ contacts: [{ name: 'Test', monthly_amount: 35000.9 }] });
    const result = parseExcelImport(base64);
    expect(result.contacts[0].monthly_amount).toBe(35001);
  });

  it('strips currency symbols from monthly_amount', () => {
    const base64 = makeWorkbook({ contacts: [{ name: 'Test', monthly_amount: '₡35,000' }] });
    const result = parseExcelImport(base64);
    expect(result.contacts[0].monthly_amount).toBe(35000);
  });
});

describe('parseExcelImport — templates sheet', () => {
  it('parses a valid templates row', () => {
    const base64 = makeWorkbook({ templates: [TEMPLATE_ROW] });
    const result = parseExcelImport(base64);
    expect(result.errors).toHaveLength(0);
    expect(result.templates).toHaveLength(1);
    const t = result.templates[0];
    expect(t.concept).toBe('Mensualidad mayo');
    expect(t.amount).toBe(120000);
    expect(t.type).toBe('recurring');
  });

  it('accepts Spanish column headers (concepto, monto, tipo)', () => {
    const base64 = makeWorkbook({
      templates: [{ concepto: 'Ballet', monto: 25000, tipo: 'extra' }],
    });
    const result = parseExcelImport(base64);
    const t = result.templates[0];
    expect(t.concept).toBe('Ballet');
    expect(t.amount).toBe(25000);
    expect(t.type).toBe('extra');
  });

  it('accepts sheet named "Plantillas" (Spanish)', () => {
    const base64 = makeWorkbook({ Plantillas: [TEMPLATE_ROW] });
    const result = parseExcelImport(base64);
    expect(result.templates).toHaveLength(1);
  });

  it('defaults type to "recurring" when column is missing or unknown value', () => {
    const base64 = makeWorkbook({ templates: [{ concept: 'Test', amount: 10000, type: 'unknown' }] });
    const result = parseExcelImport(base64);
    expect(result.templates[0].type).toBe('recurring');
  });

  it('skips rows with empty concept and adds an error', () => {
    const base64 = makeWorkbook({ templates: [{ concept: '', amount: 10000 }, TEMPLATE_ROW] });
    const result = parseExcelImport(base64);
    expect(result.templates).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/fila 2/);
  });

  it('skips rows with invalid amount and adds an error', () => {
    const base64 = makeWorkbook({ templates: [{ concept: 'Ballet', amount: 0 }, TEMPLATE_ROW] });
    const result = parseExcelImport(base64);
    expect(result.templates).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/amount/i);
  });

  it('skips rows with missing amount and adds an error', () => {
    const base64 = makeWorkbook({ templates: [{ concept: 'Ballet' }] });
    const result = parseExcelImport(base64);
    expect(result.templates).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });
});

describe('parseExcelImport — both sheets together', () => {
  it('parses contacts and templates from the same file', () => {
    const base64 = makeWorkbook({ contacts: [CONTACT_ROW], templates: [TEMPLATE_ROW] });
    const result = parseExcelImport(base64);
    expect(result.contacts).toHaveLength(1);
    expect(result.templates).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('collects errors from both sheets independently', () => {
    const base64 = makeWorkbook({
      contacts: [{ name: '' }],
      templates: [{ concept: 'Ballet', amount: 0 }],
    });
    const result = parseExcelImport(base64);
    expect(result.contacts).toHaveLength(0);
    expect(result.templates).toHaveLength(0);
    expect(result.errors).toHaveLength(2);
  });
});

describe('parseExcelImport — no recognized sheet', () => {
  it('returns an error when no contacts or templates sheet is found', () => {
    const base64 = makeWorkbook({ datos: [{ foo: 'bar' }] });
    const result = parseExcelImport(base64);
    expect(result.contacts).toHaveLength(0);
    expect(result.templates).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/contacts/);
  });
});

// ── buildImportTemplate ────────────────────────────────────────────────────

describe('buildImportTemplate', () => {
  it('returns a base64 string', () => {
    expect(typeof buildImportTemplate()).toBe('string');
  });

  it('contains a "contacts" sheet with the correct headers', () => {
    const wb = XLSX.read(buildImportTemplate(), { type: 'base64' });
    expect(wb.SheetNames).toContain('contacts');
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['contacts']);
    expect(Object.keys(rows[0])).toEqual(['name', 'phone', 'email', 'monthly_amount', 'notes']);
  });

  it('contains a "templates" sheet with the correct headers', () => {
    const wb = XLSX.read(buildImportTemplate(), { type: 'base64' });
    expect(wb.SheetNames).toContain('templates');
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['templates']);
    expect(Object.keys(rows[0])).toEqual(['concept', 'amount', 'type']);
  });

  it('is parseable by parseExcelImport without errors', () => {
    const result = parseExcelImport(buildImportTemplate());
    expect(result.errors).toHaveLength(0);
    expect(result.contacts.length).toBeGreaterThan(0);
    expect(result.templates.length).toBeGreaterThan(0);
  });
});

// ── buildExportWorkbook ────────────────────────────────────────────────────

describe('buildExportWorkbook', () => {
  function parseResult(base64: string) {
    const wb = XLSX.read(base64, { type: 'base64' });
    const sheet = wb.Sheets['Historial'];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  }

  it('returns a base64 string', () => {
    const result = buildExportWorkbook([EXPORT_LINE]);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a sheet named "Historial"', () => {
    const wb = XLSX.read(buildExportWorkbook([EXPORT_LINE]), { type: 'base64' });
    expect(wb.SheetNames).toContain('Historial');
  });

  it('maps all fields to Spanish column headers', () => {
    const rows = parseResult(buildExportWorkbook([EXPORT_LINE]));
    expect(rows[0]).toMatchObject({
      'Contacto': 'Ana Rodríguez',
      'Teléfono': '+506 8888-1234',
      'Concepto': 'Mensualidad mayo',
      'Descripción': 'Mariana + Luis',
      'Monto': 120000,
      'Tipo': 'recurring',
      'Vencimiento': '2026-05-02',
      'Estado': 'paid',
      'Método pago': 'sinpe',
      'Fecha pago': '2026-05-01',
    });
  });

  it('writes empty string for null phone', () => {
    const rows = parseResult(buildExportWorkbook([{ ...EXPORT_LINE, phone: null }]));
    expect(rows[0]['Teléfono']).toBe('');
  });

  it('writes empty string for null description', () => {
    const rows = parseResult(buildExportWorkbook([{ ...EXPORT_LINE, description: null }]));
    expect(rows[0]['Descripción']).toBe('');
  });

  it('writes empty string for null payment_method and paid_at', () => {
    const rows = parseResult(buildExportWorkbook([{ ...EXPORT_LINE, payment_method: null, paid_at: null }]));
    expect(rows[0]['Método pago']).toBe('');
    expect(rows[0]['Fecha pago']).toBe('');
  });

  it('handles multiple rows', () => {
    const rows = parseResult(buildExportWorkbook([EXPORT_LINE, { ...EXPORT_LINE, contact_name: 'Luis Mora' }]));
    expect(rows).toHaveLength(2);
    expect(rows[1]['Contacto']).toBe('Luis Mora');
  });

  it('returns a valid workbook for an empty row list', () => {
    const result = buildExportWorkbook([]);
    const wb = XLSX.read(result, { type: 'base64' });
    expect(wb.SheetNames).toContain('Historial');
  });
});
