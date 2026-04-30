import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('pagos.db');
    runMigrations(_db);
  }
  return _db;
}

function runMigrations(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS contacts (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      phone          TEXT,
      email          TEXT,
      notes          TEXT,
      monthly_amount INTEGER,
      active         INTEGER NOT NULL DEFAULT 1,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charge_templates (
      id          TEXT PRIMARY KEY,
      concept     TEXT NOT NULL,
      amount      INTEGER NOT NULL DEFAULT 0,
      type        TEXT NOT NULL DEFAULT 'recurring',
      personal    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_templates (
      id          TEXT PRIMARY KEY,
      contact_id  TEXT NOT NULL REFERENCES contacts(id),
      template_id TEXT NOT NULL REFERENCES charge_templates(id),
      amount      INTEGER,
      description TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charges (
      id          TEXT PRIMARY KEY,
      contact_id  TEXT NOT NULL REFERENCES contacts(id),
      due_date    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_charges_contact  ON charges(contact_id);
    CREATE INDEX IF NOT EXISTS idx_charges_status   ON charges(status);
    CREATE INDEX IF NOT EXISTS idx_charges_due_date ON charges(due_date);

    CREATE TABLE IF NOT EXISTS charge_lines (
      id             TEXT PRIMARY KEY,
      charge_id      TEXT NOT NULL REFERENCES charges(id),
      concept        TEXT NOT NULL,
      amount         INTEGER NOT NULL,
      description    TEXT,
      type           TEXT NOT NULL DEFAULT 'recurring',
      status         TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      paid_at        TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_charge_lines_charge ON charge_lines(charge_id);
  `);
}
