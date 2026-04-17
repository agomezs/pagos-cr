import { getDb } from './database';
import type { Client } from '../lib/types';

export function listClients(): Client[] {
  const db = getDb();
  const rows = db.getAllSync<{
    id: string;
    name: string;
    phone: string | null;
    notes: string | null;
    active: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM clients WHERE active = 1 ORDER BY name ASC');

  return rows.map((r) => ({ ...r, active: r.active === 1 }));
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
