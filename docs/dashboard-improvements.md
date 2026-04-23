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

_(todas completadas)_

### 2. SummaryPanel

_(todas completadas)_

### 3. ChargeCard

_(todas completadas)_

### 4. Lista de cobros

- [ ] **Agrupación por periodo** — secciones como "Vencido", "Vence esta semana", "Vence este mes" dan contexto inmediato sin necesidad de filtrar.

### 5. UX general

_(todas completadas)_
