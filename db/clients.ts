import { getDb } from './database';
import type { Client } from '../lib/types';

type RawClient = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

function toClient(r: RawClient): Client {
  return { ...r, active: r.active === 1 };
}

export function listClients(): Client[] {
  const db = getDb();
  const rows = db.getAllSync<RawClient>('SELECT * FROM clients WHERE active = 1 ORDER BY name ASC');
  return rows.map(toClient);
}

export function getClient(id: string): Client | null {
  const db = getDb();
  const row = db.getFirstSync<RawClient>('SELECT * FROM clients WHERE id = ?', id);
  return row ? toClient(row) : null;
}

export function createClient(client: Omit<Client, 'active' | 'created_at' | 'updated_at'> & { id: string }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO clients (id, name, phone, notes, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    client.id,
    client.name,
    client.phone ?? null,
    client.notes ?? null,
    now,
    now,
  );
}

export function updateClient(id: string, fields: { name: string; phone: string | null; notes: string | null }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE clients SET name = ?, phone = ?, notes = ?, updated_at = ? WHERE id = ?`,
    fields.name,
    fields.phone ?? null,
    fields.notes ?? null,
    now,
    id,
  );
}

export function deactivateClient(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE clients SET active = 0, updated_at = ? WHERE id = ?`,
    now,
    id,
  );
}
