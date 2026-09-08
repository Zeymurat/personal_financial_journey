import { toLocalDateString } from './localDate';

/** Clamp day into month length. */
export function clampDay(year: number, month: number, day: number): Date {
  const last = new Date(year, month, 0).getDate();
  return new Date(year, month - 1, Math.min(day, last));
}

/**
 * Classic card cycle: purchaseDay >= cutoffDay → next month cutoff, else this month.
 * cutoffDay is clamped to 1–28.
 */
export function nextStatementDate(purchaseDate: Date, cutoffDay: number): Date {
  const day = Math.max(1, Math.min(Math.floor(cutoffDay) || 1, 28));
  const y = purchaseDate.getFullYear();
  const m = purchaseDate.getMonth() + 1;
  const d = purchaseDate.getDate();
  if (d >= day) {
    if (m === 12) return clampDay(y + 1, 1, day);
    return clampDay(y, m + 1, day);
  }
  return clampDay(y, m, day);
}

export function addMonths(base: Date, months: number): Date {
  const monthIndex = base.getMonth() + months;
  const year = base.getFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  return clampDay(year, month + 1, base.getDate());
}

export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function buildInstallmentDueDates(
  purchaseDate: Date | string,
  cutoffDay: number,
  installmentCount: number
): string[] {
  const base = typeof purchaseDate === 'string' ? parseDateOnly(purchaseDate) : purchaseDate;
  const count = Math.max(1, Math.floor(installmentCount) || 1);
  const first = nextStatementDate(base, cutoffDay);
  return Array.from({ length: count }, (_, i) => toLocalDateString(addMonths(first, i)));
}

export function buildLoanDueDates(startDate: Date | string, installmentCount: number): string[] {
  const base = typeof startDate === 'string' ? parseDateOnly(startDate) : startDate;
  const count = Math.max(1, Math.floor(installmentCount) || 1);
  return Array.from({ length: count }, (_, i) => toLocalDateString(addMonths(base, i)));
}

export function splitEqualAmounts(total: number, count: number): number[] {
  const n = Math.max(1, Math.floor(count) || 1);
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / n);
  const amounts = Array.from({ length: n }, () => base / 100);
  const remainder = totalCents - base * n;
  amounts[n - 1] = (base + remainder) / 100;
  return amounts;
}
