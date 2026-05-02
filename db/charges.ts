import { getDb } from './database';
import type { Charge, ChargeFilters, ChargeLine, Summary } from '../lib/types';
import type { ExportLineRow } from '../lib/excel';
import { CHARGE_STATUS } from '../constants/enums';

// Derives charge status from its lines and updates the DB.
function syncChargeStatus(db: ReturnType<typeof getDb>, charge_id: string): void {
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charges SET status = (
       CASE
         WHEN EXISTS (SELECT 1 FROM charge_lines WHERE charge_id = ? AND status = 'overdue') THEN 'overdue'
         WHEN NOT EXISTS (SELECT 1 FROM charge_lines WHERE charge_id = ? AND status != 'paid') THEN 'paid'
         ELSE 'pending'
       END
     ), updated_at = ?
     WHERE id = ?`,
    charge_id,
    charge_id,
    now,
    charge_id,
  );
}

// Marks recurring lines overdue for all charges past due date, then syncs charge status.
export function markOverdue(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_lines SET status = 'overdue', updated_at = ?
     WHERE status = 'pending' AND type = 'recurring'
       AND charge_id IN (SELECT id FROM charges WHERE due_date < date('now'))`,
    now,
  );
  // Sync all charge statuses that may have changed
  const stale = db.getAllSync<{ id: string }>(
    `SELECT DISTINCT c.id FROM charges c
     JOIN charge_lines cl ON cl.charge_id = c.id
     WHERE c.status != 'paid' AND c.due_date < date('now')`,
  );
  for (const { id } of stale) {
    syncChargeStatus(db, id);
  }
}

export function getSummary(): Summary {
  const db = getDb();
  const rows = db.getAllSync<{ status: string; count: number; total: number }>(
    `SELECT c.status, COUNT(DISTINCT c.id) as count, SUM(cl.amount) as total
     FROM charges c
     JOIN charge_lines cl ON cl.charge_id = c.id AND cl.status != 'paid'
     WHERE c.status != 'paid'
     GROUP BY c.status
     UNION ALL
     SELECT 'paid', COUNT(DISTINCT c.id), SUM(cl.amount)
     FROM charges c
     JOIN charge_lines cl ON cl.charge_id = c.id AND cl.status = 'paid'
     WHERE c.status = 'paid'`,
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
    if (row.status === CHARGE_STATUS.pending) {
      summary.totalPending = row.total ?? 0;
      summary.pendingCount = row.count;
    } else if (row.status === CHARGE_STATUS.overdue) {
      summary.totalOverdue = row.total ?? 0;
      summary.overdueCount = row.count;
    } else if (row.status === CHARGE_STATUS.paid) {
      summary.totalPaid = row.total ?? 0;
      summary.paidCount = row.count;
    }
  }

  return summary;
}

export function listCharges(filters: ChargeFilters = {}): Charge[] {
  const db = getDb();
  const rows = db.getAllSync<Omit<Charge, 'lines'>>(
    `SELECT c.*, co.name as contact_name
     FROM charges c
     JOIN contacts co ON c.contact_id = co.id
     WHERE (? IS NULL OR c.status = ?)
       AND (? IS NULL OR c.contact_id = ?)
       AND (? IS NULL OR c.due_date >= ?)
       AND (? IS NULL OR c.due_date <= ?)
     ORDER BY
       CASE c.status WHEN 'overdue' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
       CASE WHEN c.status IN ('overdue', 'pending') THEN c.due_date END ASC,
       CASE WHEN c.status = 'paid' THEN c.due_date END DESC`,
    filters.status ?? null,
    filters.status ?? null,
    filters.contact_id ?? null,
    filters.contact_id ?? null,
    filters.date_from ?? null,
    filters.date_from ?? null,
    filters.date_to ?? null,
    filters.date_to ?? null,
  );

  return rows.map((r) => ({
    ...r,
    lines: db.getAllSync<ChargeLine>(
      `SELECT * FROM charge_lines WHERE charge_id = ? ORDER BY created_at ASC`,
      r.id,
    ),
  }));
}

export function listChargesByContact(contact_id: string): Charge[] {
  const db = getDb();
  const rows = db.getAllSync<Omit<Charge, 'lines'>>(
    `SELECT c.*, co.name as contact_name
     FROM charges c
     JOIN contacts co ON c.contact_id = co.id
     WHERE c.contact_id = ?
     ORDER BY c.due_date DESC`,
    contact_id,
  );

  return rows.map((r) => ({
    ...r,
    lines: db.getAllSync<ChargeLine>(
      `SELECT * FROM charge_lines WHERE charge_id = ? ORDER BY created_at ASC`,
      r.id,
    ),
  }));
}

export function createCharge(charge: { id: string; contact_id: string; due_date: string }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO charges (id, contact_id, due_date, status, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`,
    charge.id,
    charge.contact_id,
    charge.due_date,
    now,
    now,
  );
}

// Called after marking a line paid/unpaid to keep charge status in sync.
export function refreshChargeStatus(charge_id: string): void {
  const db = getDb();
  syncChargeStatus(db, charge_id);
}

export function listAllLinesForExport(): ExportLineRow[] {
  const db = getDb();
  return db.getAllSync<ExportLineRow>(
    `SELECT
       co.name      AS contact_name,
       co.phone     AS phone,
       cl.concept   AS concept,
       cl.description AS description,
       cl.amount    AS amount,
       cl.type      AS type,
       c.due_date   AS due_date,
       cl.status    AS status,
       cl.payment_method AS payment_method,
       cl.paid_at   AS paid_at
     FROM charge_lines cl
     JOIN charges c  ON c.id = cl.charge_id
     JOIN contacts co ON co.id = c.contact_id
     ORDER BY co.name ASC, c.due_date ASC`,
  );
}
