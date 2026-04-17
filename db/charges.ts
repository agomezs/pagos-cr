import { getDb } from './database';
import type { Charge, ChargeFilters, Summary } from '../lib/types';

/**
 * Marks overdue charges (pending where due_date < today).
 * Call this when the dashboard loads.
 */
export function markOverdue(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charges SET status = 'overdue', updated_at = ?
     WHERE status = 'pending' AND due_date < date('now')`,
    now,
  );
}

/**
 * Returns totals grouped by status.
 */
export function getSummary(): Summary {
  const db = getDb();
  const rows = db.getAllSync<{ status: string; count: number; total: number }>(
    `SELECT status, COUNT(*) as count, SUM(amount) as total FROM charges GROUP BY status`,
  );

  const summary: Summary = {
    totalPending: 0,
    totalOverdue: 0,
    totalPaid: 0,
    pendingCount: 0,
    overdueCount: 0,
    paidCount: 0,
  };

  for (const row of rows) {
    if (row.status === 'pending') {
      summary.totalPending = row.total ?? 0;
      summary.pendingCount = row.count;
    } else if (row.status === 'overdue') {
      summary.totalOverdue = row.total ?? 0;
      summary.overdueCount = row.count;
    } else if (row.status === 'paid') {
      summary.totalPaid = row.total ?? 0;
      summary.paidCount = row.count;
    }
  }

  return summary;
}

/**
 * Returns charges with optional filters, joined with client name.
 */
export function listCharges(filters: ChargeFilters = {}): Charge[] {
  const db = getDb();

  const rows = db.getAllSync<Charge>(
    `SELECT c.*, cl.name as client_name
     FROM charges c
     JOIN clients cl ON c.client_id = cl.id
     WHERE (? IS NULL OR c.status = ?)
       AND (? IS NULL OR c.client_id = ?)
       AND (? IS NULL OR c.due_date >= ?)
       AND (? IS NULL OR c.due_date <= ?)
     ORDER BY c.due_date ASC`,
    filters.status ?? null,
    filters.status ?? null,
    filters.client_id ?? null,
    filters.client_id ?? null,
    filters.date_from ?? null,
    filters.date_from ?? null,
    filters.date_to ?? null,
    filters.date_to ?? null,
  );

  return rows;
}

export function createCharge(charge: Omit<Charge, 'status' | 'payment_method' | 'payment_note' | 'paid_at' | 'created_at' | 'updated_at' | 'client_name'>): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO charges (id, client_id, concept, amount, due_date, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    charge.id,
    charge.client_id,
    charge.concept,
    charge.amount,
    charge.due_date,
    now,
    now,
  );
}

export function markPaid(
  id: string,
  payment_method: 'sinpe' | 'transfer' | 'cash',
  payment_note: string | null,
  paid_at: string,
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charges
     SET status = 'paid', payment_method = ?, payment_note = ?, paid_at = ?, updated_at = ?
     WHERE id = ? AND status IN ('pending', 'overdue')`,
    payment_method,
    payment_note ?? null,
    paid_at,
    now,
    id,
  );
}
