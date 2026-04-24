import { getDb } from './database';
import type { ContactTemplate } from '../lib/types';

type RawContactTemplate = {
  id: string;
  contact_id: string;
  template_id: string;
  active: number;
  created_at: string;
  concept: string | null;
  amount: number | null;
  type: string | null;
};

export function listContactTemplates(contact_id: string): ContactTemplate[] {
  const db = getDb();
  const rows = db.getAllSync<RawContactTemplate>(
    `SELECT ct.*, t.concept, t.amount, t.type
     FROM contact_templates ct
     JOIN charge_templates t ON ct.template_id = t.id
     WHERE ct.contact_id = ? AND ct.active = 1
     ORDER BY t.concept ASC`,
    contact_id,
  );
  return rows.map((r) => ({
    ...r,
    active: r.active === 1,
    type: (r.type as ContactTemplate['type']) ?? undefined,
    concept: r.concept ?? undefined,
    amount: r.amount ?? undefined,
  }));
}

export function assignTemplate(id: string, contact_id: string, template_id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO contact_templates (id, contact_id, template_id, active, created_at)
     VALUES (?, ?, ?, 1, ?)`,
    id,
    contact_id,
    template_id,
    now,
  );
}

export function removeContactTemplate(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE contact_templates SET active = 0, created_at = ? WHERE id = ?`,
    now,
    id,
  );
}
