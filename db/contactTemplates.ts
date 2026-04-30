import { getDb } from './database';
import type { ContactTemplate, LineType } from '../lib/types';

type RawContactTemplate = {
  id: string;
  contact_id: string;
  template_id: string;
  amount: number | null;
  description: string | null;
  active: number;
  created_at: string;
  updated_at: string;
  // joined from charge_templates
  concept: string | null;
  template_amount: number | null;
  type: string | null;
  personal: number | null;
};

function toContactTemplate(r: RawContactTemplate): ContactTemplate {
  return {
    ...r,
    active: r.active === 1,
    type: (r.type as LineType) ?? undefined,
    concept: r.concept ?? undefined,
    template_amount: r.template_amount ?? undefined,
    personal: r.personal != null ? r.personal === 1 : undefined,
  };
}

export function listContactTemplates(contact_id: string): ContactTemplate[] {
  const db = getDb();
  const rows = db.getAllSync<RawContactTemplate>(
    `SELECT ct.*, t.concept, t.amount as template_amount, t.type, t.personal
     FROM contact_templates ct
     JOIN charge_templates t ON ct.template_id = t.id
     WHERE ct.contact_id = ? AND ct.active = 1
     ORDER BY t.concept ASC`,
    contact_id,
  );
  return rows.map(toContactTemplate);
}

export function assignTemplate(id: string, contact_id: string, template_id: string, amount: number | null = null, description: string | null = null): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT OR REPLACE INTO contact_templates (id, contact_id, template_id, amount, description, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    id,
    contact_id,
    template_id,
    amount ?? null,
    description ?? null,
    now,
    now,
  );
}

export function removeContactTemplate(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE contact_templates SET active = 0, updated_at = ? WHERE id = ?`,
    now,
    id,
  );
}
