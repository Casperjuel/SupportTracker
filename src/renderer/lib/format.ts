const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'maj', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

/** Format ISO date string (e.g. "2025-01-12") as "12. jan 2025" */
export function formatDato(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
