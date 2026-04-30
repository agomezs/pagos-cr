import { getDb } from './database';
import type { ChargeTemplate, LineType } from '../lib/types';

type RawChargeTemplate = Omit<ChargeTemplate, 'personal'> & { personal: number };

function toTemplate(r: RawChargeTemplate): ChargeTemplate {
  return { ...r, personal: r.personal === 1 };
}

export function listTemplates(includePersonal = false): ChargeTemplate[] {
  const db = getDb();
  const rows = db.getAllSync<RawChargeTemplate>(
    includePersonal
      ? 'SELECT * FROM charge_templates ORDER BY concept ASC'
      : 'SELECT * FROM charge_templates WHERE personal = 0 ORDER BY concept ASC',
  );
  return rows.map(toTemplate);
}

export function getTemplate(id: string): ChargeTemplate | null {
  const db = getDb();
  const row = db.getFirstSync<RawChargeTemplate>('SELECT * FROM charge_templates WHERE id = ?', id);
  return row ? toTemplate(row) : null;
}

export function createTemplate(template: { id: string; concept: string; amount: number; type: LineType; personal?: boolean }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO charge_templates (id, concept, amount, type, personal, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    template.id,
    template.concept,
    template.amount,
    template.type,
    template.personal ? 1 : 0,
    now,
    now,
  );
}

export function updateTemplate(id: string, fields: { concept: string; amount: number; type: LineType }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_templates SET concept = ?, amount = ?, type = ?, updated_at = ? WHERE id = ?`,
    fields.concept,
    fields.amount,
    fields.type,
    now,
    id,
  );
}

export function deleteTemplate(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM charge_templates WHERE id = ?', id);
}
