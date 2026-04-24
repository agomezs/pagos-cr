import { getDb } from './database';
import type { ChargeLine, LineType, PaymentMethod } from '../lib/types';
import { LINE_TYPE } from '../constants/enums';

export function listLinesByCharge(charge_id: string): ChargeLine[] {
  const db = getDb();
  return db.getAllSync<ChargeLine>(
    `SELECT * FROM charge_lines WHERE charge_id = ? ORDER BY created_at ASC`,
    charge_id,
  );
}

export function createLine(line: {
  id: string;
  charge_id: string;
  concept: string;
  amount: number;
  description: string | null;
  type: LineType;
}): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO charge_lines (id, charge_id, concept, amount, description, type, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    line.id,
    line.charge_id,
    line.concept,
    line.amount,
    line.description ?? null,
    line.type,
    now,
    now,
  );
}

export function markLinePaid(id: string, payment_method: PaymentMethod, paid_at: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_lines
     SET status = 'paid', payment_method = ?, paid_at = ?, updated_at = ?
     WHERE id = ? AND status IN ('pending', 'overdue')`,
    payment_method,
    paid_at,
    now,
    id,
  );
}

export function unmarkLinePaid(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_lines
     SET status = CASE
       WHEN type = 'recurring' AND (SELECT due_date FROM charges WHERE id = charge_id) < date('now')
       THEN 'overdue' ELSE 'pending' END,
         payment_method = NULL, paid_at = NULL, updated_at = ?
     WHERE id = ? AND status = 'paid'`,
    now,
    id,
  );
}

export function markLinesOverdue(charge_id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE charge_lines
     SET status = 'overdue', updated_at = ?
     WHERE charge_id = ? AND status = 'pending' AND type = 'recurring'`,
    now,
    charge_id,
  );
}
