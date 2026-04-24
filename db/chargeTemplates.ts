import { getDb } from './database';
import type { ChargeTemplate } from '../lib/types';

export function listTemplates(): ChargeTemplate[] {
  const db = getDb();
  return db.getAllSync<ChargeTemplate>(
    'SELECT * FROM charge_templates ORDER BY concept ASC',
  );
}

export function createTemplate(template: { id: string; concept: string; amount: number }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO charge_templates (id, concept, amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    template.id,
    template.concept,
    template.amount,
    now,
    now,
  );
}

export function updateTemplate(id: string, fields: { concept: string; amount: number }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_templates SET concept = ?, amount = ?, updated_at = ? WHERE id = ?`,
    fields.concept,
    fields.amount,
    now,
    id,
  );
}

export function deleteTemplate(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM charge_templates WHERE id = ?', id);
}
