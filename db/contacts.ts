import { getDb } from './database';
import type { Contact } from '../lib/types';

type RawContact = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

function toContact(r: RawContact): Contact {
  return { ...r, active: r.active === 1 };
}

export function listContacts(): Contact[] {
  const db = getDb();
  const rows = db.getAllSync<RawContact>('SELECT * FROM contacts WHERE active = 1 ORDER BY name ASC');
  return rows.map(toContact);
}

export function getContact(id: string): Contact | null {
  const db = getDb();
  const row = db.getFirstSync<RawContact>('SELECT * FROM contacts WHERE id = ?', id);
  return row ? toContact(row) : null;
}

export function createContact(contact: { id: string; name: string; phone: string | null; notes: string | null }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO contacts (id, name, phone, notes, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    contact.id,
    contact.name,
    contact.phone ?? null,
    contact.notes ?? null,
    now,
    now,
  );
}

export function updateContact(id: string, fields: { name: string; phone: string | null; notes: string | null }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE contacts SET name = ?, phone = ?, notes = ?, updated_at = ? WHERE id = ?`,
    fields.name,
    fields.phone ?? null,
    fields.notes ?? null,
    now,
    id,
  );
}

export function deactivateContact(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE contacts SET active = 0, updated_at = ? WHERE id = ?`,
    now,
    id,
  );
}
