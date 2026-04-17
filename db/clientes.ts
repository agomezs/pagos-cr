import { getDb } from './database';
import type { Cliente } from '../lib/types';

export function listarClientes(): Cliente[] {
  const db = getDb();
  const rows = db.getAllSync<{
    id: string;
    nombre: string;
    telefono: string | null;
    notas: string | null;
    activo: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre ASC');

  return rows.map((r) => ({ ...r, activo: r.activo === 1 }));
}

export function crearCliente(cliente: Omit<Cliente, 'activo' | 'created_at' | 'updated_at'> & { id: string }): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO clientes (id, nombre, telefono, notas, activo, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    cliente.id,
    cliente.nombre,
    cliente.telefono ?? null,
    cliente.notas ?? null,
    now,
    now,
  );
}
