import { getDb } from './database';
import type { ChargeTemplate, LineType } from '../lib/types';

export function listTemplates(): ChargeTemplate[] {
  const db = getDb();
  return db.getAllSync<ChargeTemplate>(
    'SELECT * FROM charge_templates ORDER BY concept ASC',
  );
}

export function createTemplate(template: { id: string; concept: string; amount: number; type: LineType }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO charge_templates (id, concept, amount, type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    template.id,
    template.concept,
    template.amount,
    template.type,
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
