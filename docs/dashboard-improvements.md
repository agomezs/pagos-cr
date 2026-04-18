# Dashboard — Mejoras propuestas

## Filtros (decisión de diseño pendiente)

Tres variantes en comparación activa (tabs V3, V4):

| Variante | Descripción | Veredicto |
|----------|-------------|-----------|
| **Original** | Pills de estado + dropdown cliente + chips de fecha en filas separadas | Base actual |
| **V2 Fila única** | Todos los filtros en un ScrollView horizontal con separadores | Descartada — scroll oculta opciones, picker de cliente se confunde con toggle |
| **V3 Segmented** | Segmented control para estado + chips secundarios para cliente/fecha | Recomendada — estado siempre visible, jerarquía clara |
| **V4 Cards** | StatCards tappables como filtro principal + fila secundaria para cliente/fecha | Alternativa fuerte — zero tap extra, filtros integrados en el resumen |

---

## Mejoras pendientes por área

### 1. Filtros

- [x] **Cliente: botón ✕ inline** — cuando hay cliente activo, mostrar `✕` dentro del mismo chip en lugar de un botón separado. Reduce elementos visuales.
- [x] **El chip de cliente como toggle** — si se toca el chip con cliente activo, debería limpiarlo directamente sin abrir el picker.

### 2. SummaryPanel

- [x] **StatCards como atajo de filtro** — tocar una tarjeta filtra por ese estado (toggle). Ya implementado en V4, trasladar al diseño final.
- [x] **Consistencia tipográfica** — `TotalCard` ("Por cobrar") usa `text-xl` mientras las StatCards usan `text-2xl`. Unificar a `text-2xl`.
- [x] **Conteo en TotalCard** — "Por cobrar" no muestra conteo de cobros. Agregar `{pendingCount + overdueCount} cobros` igual que las otras tarjetas.

### 3. ChargeCard

- [x] **Borde lateral de urgencia en vencidos** — agregar `border-l-4 border-red-400` a tarjetas con `status === "overdue"` para señal visual inmediata sin necesidad de leer el badge.
- [x] **Chevron en pagados** — mostrar `›` siempre (pagados navegan al cliente, por lo que el chevron es correcto en todos los casos).
- [x] **Etiquetas de método de pago** — reemplazar `toUpperCase()` por un mapa de etiquetas: `sinpe → SINPE`, `efectivo → Efectivo`, `transferencia → Transferencia`. Evita `"TRANSFERENCIA BANCARIA"` en mayúsculas.

### 4. Lista de cobros

- [x] **Ordenamiento** — cobros vencidos primero (por fecha asc), luego pendientes (por fecha asc), luego pagados (por `paid_at` desc). Actualmente el orden depende de la BD.
- [ ] **Agrupación por periodo** — secciones como "Vencido", "Vence esta semana", "Vence este mes" dan contexto inmediato sin necesidad de filtrar.

### 5. UX general

- [x] **pull-to-refresh async-safe** — `load()` es síncrono hoy, pero si se vuelve async el spinner desaparecería antes de terminar. Usar `await load()` dentro de un `async` callback cuando se migre.
- [x] **"Quitar filtros" redundante** — el enlace debajo de la lista y los tokens de remoción individual cumplen la misma función. Con tokens inline por filtro, el enlace global se puede eliminar salvo que haya 3+ filtros activos.
