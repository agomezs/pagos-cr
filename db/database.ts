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

    CREATE TABLE IF NOT EXISTS clients (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      phone       TEXT,
      notes       TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charges (
      id              TEXT PRIMARY KEY,
      client_id       TEXT NOT NULL REFERENCES clients(id),
      concept         TEXT NOT NULL,
      amount          INTEGER NOT NULL,
      due_date        TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      payment_method  TEXT,
      payment_note    TEXT,
      paid_at         TEXT,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_charges_client   ON charges(client_id);
    CREATE INDEX IF NOT EXISTS idx_charges_status   ON charges(status);
    CREATE INDEX IF NOT EXISTS idx_charges_due_date ON charges(due_date);
  `);
}
