export function getMonthStart(date: Date): Date {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

export function getMonthEnd(date: Date): Date {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
}

const MONTHS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
] as const;

export function formatMonthYear(date: Date): string {
  return `${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
}
