/**
 * Formats an integer amount of colones.
 * e.g. 35000 → "₡35,000"
 */
export function formatColones(monto: number): string {
  return `₡${monto.toLocaleString('es-CR')}`;
}

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/**
 * Formats a YYYY-MM-DD date string to a human-readable Spanish date.
 * e.g. "2026-04-15" → "15 abr 2026"
 */
export function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}
