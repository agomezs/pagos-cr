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

    CREATE TABLE IF NOT EXISTS clientes (
      id          TEXT PRIMARY KEY,
      nombre      TEXT NOT NULL,
      telefono    TEXT,
      notas       TEXT,
      activo      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cobros (
      id                TEXT PRIMARY KEY,
      cliente_id        TEXT NOT NULL REFERENCES clientes(id),
      concepto          TEXT NOT NULL,
      monto             INTEGER NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      estado            TEXT NOT NULL DEFAULT 'pendiente',
      metodo_pago       TEXT,
      nota_pago         TEXT,
      pagado_at         TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_cobros_cliente    ON cobros(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_cobros_estado     ON cobros(estado);
    CREATE INDEX IF NOT EXISTS idx_cobros_vencimiento ON cobros(fecha_vencimiento);
  `);
}
