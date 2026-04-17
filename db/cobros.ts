import { getDb } from './database';
import type { Cobro, FiltrosCobros, Resumen } from '../lib/types';

/**
 * Marks overdue cobros (pendiente where fecha_vencimiento < today).
 * Call this when the dashboard loads.
 */
export function marcarVencidos(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE cobros SET estado = 'vencido', updated_at = ?
     WHERE estado = 'pendiente' AND fecha_vencimiento < date('now')`,
    now,
  );
}

/**
 * Returns totals grouped by estado.
 */
export function obtenerResumen(): Resumen {
  const db = getDb();
  const rows = db.getAllSync<{ estado: string; cantidad: number; total: number }>(
    `SELECT estado, COUNT(*) as cantidad, SUM(monto) as total FROM cobros GROUP BY estado`,
  );

  const resumen: Resumen = {
    totalPendiente: 0,
    totalVencido: 0,
    totalCobrado: 0,
    cantidadPendientes: 0,
    cantidadVencidos: 0,
    cantidadPagados: 0,
  };

  for (const row of rows) {
    if (row.estado === 'pendiente') {
      resumen.totalPendiente = row.total ?? 0;
      resumen.cantidadPendientes = row.cantidad;
    } else if (row.estado === 'vencido') {
      resumen.totalVencido = row.total ?? 0;
      resumen.cantidadVencidos = row.cantidad;
    } else if (row.estado === 'pagado') {
      resumen.totalCobrado = row.total ?? 0;
      resumen.cantidadPagados = row.cantidad;
    }
  }

  return resumen;
}

/**
 * Returns cobros with optional filters, joined with cliente nombre.
 */
export function listarCobros(filtros: FiltrosCobros = {}): Cobro[] {
  const db = getDb();

  const rows = db.getAllSync<Cobro & { activo?: number }>(
    `SELECT c.*, cl.nombre as cliente_nombre
     FROM cobros c
     JOIN clientes cl ON c.cliente_id = cl.id
     WHERE (? IS NULL OR c.estado = ?)
       AND (? IS NULL OR c.cliente_id = ?)
       AND (? IS NULL OR c.fecha_vencimiento >= ?)
       AND (? IS NULL OR c.fecha_vencimiento <= ?)
     ORDER BY c.fecha_vencimiento ASC`,
    filtros.estado ?? null,
    filtros.estado ?? null,
    filtros.cliente_id ?? null,
    filtros.cliente_id ?? null,
    filtros.fecha_desde ?? null,
    filtros.fecha_desde ?? null,
    filtros.fecha_hasta ?? null,
    filtros.fecha_hasta ?? null,
  );

  return rows;
}

export function crearCobro(cobro: Omit<Cobro, 'estado' | 'metodo_pago' | 'nota_pago' | 'pagado_at' | 'created_at' | 'updated_at' | 'cliente_nombre'>): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO cobros (id, cliente_id, concepto, monto, fecha_vencimiento, estado, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)`,
    cobro.id,
    cobro.cliente_id,
    cobro.concepto,
    cobro.monto,
    cobro.fecha_vencimiento,
    now,
    now,
  );
}

export function marcarPagado(
  id: string,
  metodo_pago: 'sinpe' | 'transferencia' | 'efectivo',
  nota_pago: string | null,
  pagado_at: string,
): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    `UPDATE cobros
     SET estado = 'pagado', metodo_pago = ?, nota_pago = ?, pagado_at = ?, updated_at = ?
     WHERE id = ? AND estado IN ('pendiente', 'vencido')`,
    metodo_pago,
    nota_pago ?? null,
    pagado_at,
    now,
    id,
  );
}
