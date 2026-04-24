# Reglas de Negocio — Cobros

## Entidad de cobro

El cobro es siempre por papá (cliente), nunca por estudiante individual. Los nombres de los hijos aparecen como detalle informativo dentro del cobro.

## Estructura del cobro — líneas

Un cobro puede tener múltiples líneas (concepto + monto). Ejemplo:

- Línea 1: Mensualidad (Lucas + Clarita) — ₡380,000
- Línea 2: Clase de ballet — ₡25,000

El saldo pendiente del cobro es la suma de las líneas no pagadas. Cada línea se puede marcar como pagada independientemente.

## Recargos por mora

Solo la línea de mensualidad genera recargo por mora. Las demás líneas no.

## Servicios adicionales por cliente

El sistema registra qué servicios tiene contratado cada papá (ballet, guardería, tutorías). Esto permite generar cobros mensuales correctamente a partir de templates.

## Cobros fijos vs adicionales

- **Fijos:** mensualidad — aplica a todos los clientes sin excepción, misma fecha cada mes, monto base definido por la operadora. Siempre es requerida.
- **Adicionales:** ballet, guardería, tutorías, etc. — monto fijo por ocurrencia, solo para quienes tienen ese servicio contratado. Recurrentes si el servicio está activo, eventuales si no.

## Precio especial multi-hijo

Cuando un papá tiene varios hijos, la mensualidad tiene un monto especial acordado. 
El sistema no lo calcula — la operadora lo define. Los nombres de los hijos aparecen en el detalle del cobro.

## Pagos parciales

No se permite pago parcial dentro de una línea — cada línea se paga completa o no se paga. 
Lo que sí se permite es pagar algunas líneas del cobro y dejar otras pendientes (ej. pagar la mensualidad en un pago y el ballet en otro). 
El saldo pendiente del cobro es la suma de las líneas aún no pagadas.

En el futuro se podrá configurar mostrar los cobros separados por línea mediante un setting.
