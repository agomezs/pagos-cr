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
