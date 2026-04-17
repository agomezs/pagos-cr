import React, { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { marcarVencidos, obtenerResumen, listarCobros, crearCobro } from "../db/cobros";
import { crearCliente, listarClientes } from "../db/clientes";
import { getDb } from "../db/database";
import { formatColones, formatFecha } from "../lib/format";
import type { Cobro, EstadoCobro, Resumen } from "../lib/types";

// ---------------------------------------------------------------------------
// Seed helper — inserts demo data on first run
// ---------------------------------------------------------------------------
function seedIfEmpty() {
  const clientes = listarClientes();
  if (clientes.length > 0) return;

  const now = new Date().toISOString();

  const c1 = { id: "c1", nombre: "Ana Rodríguez", telefono: "88001234", notas: null };
  const c2 = { id: "c2", nombre: "Luis Pérez", telefono: "88005678", notas: null };
  const c3 = { id: "c3", nombre: "María Castro", telefono: null, notas: null };

  crearCliente(c1);
  crearCliente(c2);
  crearCliente(c3);

  crearCobro({ id: "co1", cliente_id: "c1", concepto: "Mensualidad mayo", monto: 35000, fecha_vencimiento: "2026-05-01" });
  crearCobro({ id: "co2", cliente_id: "c2", concepto: "Mensualidad mayo", monto: 35000, fecha_vencimiento: "2026-05-01" });
  crearCobro({ id: "co3", cliente_id: "c3", concepto: "Mensualidad mayo", monto: 40000, fecha_vencimiento: "2026-05-15" });
  crearCobro({ id: "co4", cliente_id: "c1", concepto: "Mensualidad abril", monto: 35000, fecha_vencimiento: "2026-04-01" });
  crearCobro({ id: "co5", cliente_id: "c3", concepto: "Mensualidad marzo", monto: 40000, fecha_vencimiento: "2026-03-01" });
  crearCobro({ id: "co6", cliente_id: "c2", concepto: "Mensualidad abril", monto: 35000, fecha_vencimiento: "2026-04-01" });

  const db = getDb();
  db.runSync(
    `UPDATE cobros SET estado='pagado', metodo_pago='sinpe', pagado_at='2026-04-02', updated_at=? WHERE id='co6'`,
    now,
  );
}

// ---------------------------------------------------------------------------
// ResumenPanel
// ---------------------------------------------------------------------------
type StatCardProps = { label: string; cantidad: number; monto: number; color: string };

function StatCard({ label, cantidad, monto, color }: StatCardProps) {
  return (
    <View className={`flex-1 rounded-2xl p-4 gap-1 ${color}`}>
      <Text className="text-xs font-semibold text-white/80 uppercase tracking-wide">{label}</Text>
      <Text className="text-2xl font-bold text-white">{formatColones(monto)}</Text>
      <Text className="text-xs text-white/70">{cantidad} cobro{cantidad !== 1 ? "s" : ""}</Text>
    </View>
  );
}

function ResumenPanel({ resumen }: { resumen: Resumen }) {
  return (
    <View className="px-4 pt-4 pb-2 gap-3">
      <Text className="text-xl font-bold text-gray-900">Dashboard</Text>
      <View className="flex-row gap-3">
        <StatCard label="Pendiente" cantidad={resumen.cantidadPendientes} monto={resumen.totalPendiente} color="bg-blue-500" />
        <StatCard label="Vencido" cantidad={resumen.cantidadVencidos} monto={resumen.totalVencido} color="bg-red-500" />
      </View>
      <View className="flex-row gap-3">
        <StatCard label="Cobrado" cantidad={resumen.cantidadPagados} monto={resumen.totalCobrado} color="bg-green-600" />
        <View className="flex-1 rounded-2xl p-4 bg-gray-100 gap-1 justify-center">
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total por cobrar</Text>
          <Text className="text-xl font-bold text-gray-800">
            {formatColones(resumen.totalPendiente + resumen.totalVencido)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FiltroBar
// ---------------------------------------------------------------------------
const FILTROS: { label: string; value: EstadoCobro | null }[] = [
  { label: "Todos", value: null },
  { label: "Pendientes", value: "pendiente" },
  { label: "Vencidos", value: "vencido" },
  { label: "Pagados", value: "pagado" },
];

function FiltroBar({
  activo,
  onChange,
}: {
  activo: EstadoCobro | null;
  onChange: (v: EstadoCobro | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-2 gap-2"
    >
      {FILTROS.map((f) => {
        const selected = activo === f.value;
        return (
          <Pressable
            key={String(f.value)}
            onPress={() => onChange(f.value)}
            className={`px-4 py-1.5 rounded-full border ${
              selected ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
            }`}
          >
            <Text className={`text-sm font-medium ${selected ? "text-white" : "text-gray-600"}`}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// CobroCard
// ---------------------------------------------------------------------------
const ESTADO_STYLE: Record<EstadoCobro, { badge: string; text: string; label: string }> = {
  pendiente: { badge: "bg-blue-100", text: "text-blue-700", label: "Pendiente" },
  vencido:   { badge: "bg-red-100",  text: "text-red-700",  label: "Vencido" },
  pagado:    { badge: "bg-green-100", text: "text-green-700", label: "Pagado" },
};

function CobroCard({ cobro }: { cobro: Cobro }) {
  const style = ESTADO_STYLE[cobro.estado];
  return (
    <View className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {cobro.cliente_nombre}
          </Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {cobro.concepto}
          </Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${style.badge}`}>
          <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-end justify-between">
        <View className="gap-0.5">
          <Text className="text-xs text-gray-400">
            {cobro.estado === "pagado" && cobro.pagado_at
              ? `Pagado el ${formatFecha(cobro.pagado_at)}`
              : `Vence ${formatFecha(cobro.fecha_vencimiento)}`}
          </Text>
          {cobro.metodo_pago && (
            <Text className="text-xs text-gray-400 capitalize">{cobro.metodo_pago}</Text>
          )}
        </View>
        <Text className="text-lg font-bold text-gray-900">{formatColones(cobro.monto)}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [resumen, setResumen] = useState<Resumen>({
    totalPendiente: 0,
    totalVencido: 0,
    totalCobrado: 0,
    cantidadPendientes: 0,
    cantidadVencidos: 0,
    cantidadPagados: 0,
  });
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<EstadoCobro | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(() => {
    marcarVencidos();
    setResumen(obtenerResumen());
    setCobros(listarCobros({ estado: filtroEstado }));
  }, [filtroEstado]);

  useEffect(() => {
    seedIfEmpty();
    cargar();
  }, [cargar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargar();
    setRefreshing(false);
  }, [cargar]);

  useEffect(() => {
    cargar();
  }, [filtroEstado, cargar]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      stickyHeaderIndices={[1]}
    >
      <ResumenPanel resumen={resumen} />

      <View className="bg-gray-50">
        <FiltroBar activo={filtroEstado} onChange={setFiltroEstado} />
      </View>

      <View className="pt-2 pb-8">
        {cobros.length === 0 ? (
          <View className="items-center py-16 gap-2">
            <Text className="text-4xl">📋</Text>
            <Text className="text-base font-medium text-gray-500">Sin cobros</Text>
            <Text className="text-sm text-gray-400">
              {filtroEstado ? `No hay cobros ${filtroEstado}s` : "No hay cobros registrados"}
            </Text>
          </View>
        ) : (
          cobros.map((c) => <CobroCard key={c.id} cobro={c} />)
        )}
      </View>
    </ScrollView>
  );
}
