import * as XLSX from 'xlsx';
import type { LineType } from './types';

// ── Import types ────────────────────────────────────────────────────────────

export type ContactRow = {
  name: string;
  phone: string | null;
  email: string | null;
  monthly_amount: number | null;
  notes: string | null;
};

export type TemplateRow = {
  concept: string;
  amount: number;
  type: LineType;
};

export type ImportResult = {
  contacts: ContactRow[];
  templates: TemplateRow[];
  errors: string[];
};

// ── Export types ─────────────────────────────────────────────────────────────

export type ExportLineRow = {
  contact_name: string;
  phone: string | null;
  concept: string;
  description: string | null;
  amount: number;
  type: string;
  due_date: string;
  status: string;
  payment_method: string | null;
  paid_at: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function parseAmount(v: unknown): number | null {
  const n = Number(str(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function parseLineType(v: unknown): LineType {
  const s = str(v).toLowerCase();
  return s === 'extra' ? 'extra' : 'recurring';
}

// ── Import ────────────────────────────────────────────────────────────────────

export function parseExcelImport(base64: string): ImportResult {
  const workbook = XLSX.read(base64, { type: 'base64' });
  const result: ImportResult = { contacts: [], templates: [], errors: [] };

  const contactsSheet = workbook.Sheets['contacts'] ?? workbook.Sheets['Contacts'] ?? workbook.Sheets['contactos'] ?? workbook.Sheets['Contactos'];
  const templatesSheet = workbook.Sheets['templates'] ?? workbook.Sheets['Templates'] ?? workbook.Sheets['plantillas'] ?? workbook.Sheets['Plantillas'];

  if (!contactsSheet && !templatesSheet) {
    result.errors.push('El archivo no tiene hoja "contacts" ni "templates".');
    return result;
  }

  if (contactsSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(contactsSheet, { defval: null });
    rows.forEach((row, i) => {
      const name = str(row['name'] ?? row['nombre']);
      if (!name) {
        result.errors.push(`Contactos fila ${i + 2}: columna "name" vacía — omitida.`);
        return;
      }
      const monthly = parseAmount(row['monthly_amount'] ?? row['mensualidad']);
      result.contacts.push({
        name,
        phone: str(row['phone'] ?? row['telefono'] ?? row['teléfono']) || null,
        email: str(row['email'] ?? row['correo']) || null,
        monthly_amount: monthly,
        notes: str(row['notes'] ?? row['notas']) || null,
      });
    });
  }

  if (templatesSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(templatesSheet, { defval: null });
    rows.forEach((row, i) => {
      const concept = str(row['concept'] ?? row['concepto']);
      if (!concept) {
        result.errors.push(`Plantillas fila ${i + 2}: columna "concept" vacía — omitida.`);
        return;
      }
      const amount = parseAmount(row['amount'] ?? row['monto']);
      if (!amount) {
        result.errors.push(`Plantillas fila ${i + 2}: columna "amount" inválida — omitida.`);
        return;
      }
      result.templates.push({
        concept,
        amount,
        type: parseLineType(row['type'] ?? row['tipo']),
      });
    });
  }

  return result;
}

// ── Import template ───────────────────────────────────────────────────────────

export function buildImportTemplate(): string {
  const wb = XLSX.utils.book_new();

  const contactsSheet = XLSX.utils.aoa_to_sheet([
    ['name', 'phone', 'email', 'monthly_amount', 'notes'],
    ['Ana Rodríguez', '+506 8888-1234', 'ana@gmail.com', 120000, 'Mariana + Luis'],
    ['Juan Mora', '+506 8800-0001', '', 80000, ''],
  ]);
  XLSX.utils.book_append_sheet(wb, contactsSheet, 'contacts');

  const templatesSheet = XLSX.utils.aoa_to_sheet([
    ['concept', 'amount', 'type'],
    ['Mensualidad', 120000, 'recurring'],
    ['Matrícula', 50000, 'extra'],
  ]);
  XLSX.utils.book_append_sheet(wb, templatesSheet, 'templates');

  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

// ── Export ────────────────────────────────────────────────────────────────────

export function buildExportWorkbook(rows: ExportLineRow[]): string {
  const data = rows.map((r) => ({
    'Contacto': r.contact_name,
    'Teléfono': r.phone ?? '',
    'Concepto': r.concept,
    'Descripción': r.description ?? '',
    'Monto': r.amount,
    'Tipo': r.type,
    'Vencimiento': r.due_date,
    'Estado': r.status,
    'Método pago': r.payment_method ?? '',
    'Fecha pago': r.paid_at ?? '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}
