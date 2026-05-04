/**
 * Formats an integer amount of colones.
 * e.g. 35000 → "₡35,000"
 */
export function formatColones(amount: number): string {
  return `₡${amount.toLocaleString('es-CR')}`;
}

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/**
 * Formats a YYYY-MM-DD date string to a human-readable date.
 * e.g. "2026-04-15" → "15 Apr 2026"
 */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

const FULL_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Returns the current period as YYYY-MM. */
export function currentPeriod(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Formats a YYYY-MM period string to a human-readable label. e.g. "2026-05" → "Mayo 2026" */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number);
  return `${FULL_MONTHS[month - 1]} ${year}`;
}
