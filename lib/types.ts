export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type EstadoCobro = 'pendiente' | 'vencido' | 'pagado';
export type MetodoPago = 'sinpe' | 'transferencia' | 'efectivo';

export type Cobro = {
  id: string;
  cliente_id: string;
  concepto: string;
  monto: number;
  fecha_vencimiento: string;
  estado: EstadoCobro;
  metodo_pago: MetodoPago | null;
  nota_pago: string | null;
  pagado_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  cliente_nombre?: string;
};

export type Resumen = {
  totalPendiente: number;
  totalVencido: number;
  totalCobrado: number;
  cantidadPendientes: number;
  cantidadVencidos: number;
  cantidadPagados: number;
};

export type FiltrosCobros = {
  estado?: EstadoCobro | null;
  cliente_id?: string | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
};
