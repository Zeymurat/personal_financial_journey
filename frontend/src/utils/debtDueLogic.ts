import type { Debt, DebtScheduleItem } from '../types';
import { toLocalDateString } from './localDate';

/** Convert debt amount to TRY using rate map (rate = TRY per 1 unit). */
export function debtAmountToTry(
  amount: number,
  currency: string | undefined,
  exchangeRates: Record<string, { rate?: number; buy?: number }>
): number {
  const cur = (currency || 'TRY').toUpperCase();
  if (!cur || cur === 'TRY') return amount;
  const rate = exchangeRates[cur]?.rate || exchangeRates[cur]?.buy || 0;
  return rate > 0 ? amount * rate : amount;
}

/**
 * Vadesi gelmiş (veya bugün) bekleyen plan tutarı.
 * Plan yoksa: kredi kartı dışındaki borçlarda remainingAmount; kartta 0
 * (kart etkisi yalnızca taksit/kesim satırlarından gelir).
 */
export function maturedLiabilityAmount(
  debt: Debt,
  schedule: DebtScheduleItem[] | undefined,
  asOf: string = toLocalDateString()
): number {
  if (debt.status !== 'active') return 0;
  const items = schedule || [];
  if (items.length > 0) {
    return items
      .filter((s) => s.status === 'pending' && (s.dueDate || '') <= asOf)
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  }
  if (debt.kind === 'credit_card') return 0;
  return Math.max(0, debt.remainingAmount || 0);
}

/** Bu ay vadesi gelen (henüz ödenmemiş) plan tutarı — aylık gider planlaması. */
export function dueInMonthAmount(
  debt: Debt,
  schedule: DebtScheduleItem[] | undefined,
  monthStart: string,
  monthEnd: string,
  /** Verilirse yalnızca bu tarihe kadar vadesi gelenler (gelecek günler hariç) */
  asOf?: string
): number {
  if (debt.status !== 'active') return 0;
  const items = schedule || [];
  if (items.length === 0) return 0;
  return items
    .filter((s) => {
      if (s.status !== 'pending') return false;
      const d = s.dueDate || '';
      if (d < monthStart || d > monthEnd) return false;
      if (asOf && d > asOf) return false;
      return true;
    })
    .reduce((sum, s) => sum + (s.amount || 0), 0);
}

/** Net varlık borç düzeltmesi: alacak +, borç/kredi/kart (vadesi gelmiş) − */
export function debtNetWorthAdjustment(
  debts: Debt[],
  schedulesByDebtId: Record<string, DebtScheduleItem[]>,
  exchangeRates: Record<string, { rate?: number; buy?: number }>,
  asOf: string = toLocalDateString()
): number {
  return debts.reduce((sum, d) => {
    if (d.status !== 'active') return sum;
    const local = maturedLiabilityAmount(d, schedulesByDebtId[d.id], asOf);
    const amt = debtAmountToTry(local, d.currency, exchangeRates);
    return d.kind === 'receivable' ? sum + amt : sum - amt;
  }, 0);
}

export function dueInMonthTotalTry(
  debts: Debt[],
  schedulesByDebtId: Record<string, DebtScheduleItem[]>,
  exchangeRates: Record<string, { rate?: number; buy?: number }>,
  monthStart: string,
  monthEnd: string,
  asOf?: string
): number {
  return debts.reduce((sum, d) => {
    if (d.status !== 'active' || d.kind === 'receivable') return sum;
    const local = dueInMonthAmount(d, schedulesByDebtId[d.id], monthStart, monthEnd, asOf);
    return sum + debtAmountToTry(local, d.currency, exchangeRates);
  }, 0);
}
