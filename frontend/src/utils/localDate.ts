/** Local calendar date as YYYY-MM-DD. `toISOString()` is UTC and can shift the day in TR. */
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD (veya Date) → DD-MM-YYYY gösterim. */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return formatDisplayDate(toLocalDateString(d));
  }
  return formatDisplayDate(toLocalDateString(value));
}

/** YYYY-MM-DD + gün → YYYY-MM-DD (takvim günü). */
export function addDaysToDateString(isoDate: string, days: number): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return isoDate;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}
