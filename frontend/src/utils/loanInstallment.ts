/**
 * TR kredi ürün tipleri: aylık akdi faiz + türe göre KKDF/BSMV → annuity.
 *
 * Konut: 0/0 → 15k %4.05 12ay → 1.602,92
 * Özel: 15/5 → 1.679,04
 * İhtiyaç / Taşıt / İş yeri: 15/15 → 1.717,77
 */

export type LoanType =
  | 'consumer'
  | 'vehicle'
  | 'commercial'
  | 'housing'
  | 'special';

export const LOAN_TYPES: LoanType[] = [
  'consumer',
  'vehicle',
  'commercial',
  'housing',
  'special',
];

/** (kkdf, bsmv) decimals */
export const LOAN_TAX_PROFILES: Record<LoanType, { kkdf: number; bsmv: number }> = {
  housing: { kkdf: 0, bsmv: 0 },
  special: { kkdf: 0.15, bsmv: 0.05 },
  consumer: { kkdf: 0.15, bsmv: 0.15 },
  vehicle: { kkdf: 0.15, bsmv: 0.15 },
  commercial: { kkdf: 0.15, bsmv: 0.15 },
};

export const DEFAULT_LOAN_TYPE: LoanType = 'consumer';

export function normalizeLoanType(value?: string | null): LoanType {
  const key = (value || DEFAULT_LOAN_TYPE).toLowerCase();
  if ((LOAN_TYPES as string[]).includes(key)) return key as LoanType;
  return DEFAULT_LOAN_TYPE;
}

export function loanTaxRates(loanType?: string | null): { kkdf: number; bsmv: number } {
  return LOAN_TAX_PROFILES[normalizeLoanType(loanType)];
}

export function loanEffectiveMonthlyRate(
  monthlyInterestPercent: number,
  loanType?: string | null
): number {
  const r = Math.max(0, Number(monthlyInterestPercent) || 0) / 100;
  if (r <= 0) return 0;
  const { kkdf, bsmv } = loanTaxRates(loanType);
  return r * (1 + kkdf + bsmv);
}

export function annuityPayment(
  principal: number,
  monthlyRate: number,
  count: number
): number {
  const n = Math.max(1, Math.floor(count) || 1);
  const p = Number(principal) || 0;
  const r = Number(monthlyRate) || 0;
  if (n === 1) return Math.round(p * 100) / 100;
  if (r <= 1e-12) return Math.round((p / n) * 100) / 100;
  const raw = (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
  return Math.round(raw * 100) / 100;
}

export function computeLoanInstallmentAmount(opts: {
  principal: number;
  monthlyInterestPercent: number;
  installmentCount: number;
  installmentOverride?: number | null;
  loanType?: string | null;
}): number {
  const override = opts.installmentOverride;
  if (override != null && Number(override) > 0) {
    return Math.round(Number(override) * 100) / 100;
  }
  const n = Math.max(1, Math.floor(opts.installmentCount) || 1);
  const p = Number(opts.principal) || 0;
  const rEff = loanEffectiveMonthlyRate(opts.monthlyInterestPercent, opts.loanType);
  if (rEff <= 0) return Math.round((p / n) * 100) / 100;
  return annuityPayment(p, rEff, n);
}

export type LoanSlice = {
  interest: number;
  principal: number;
  balanceAfter: number;
};

function loanInstallmentUnit(opts: {
  originalAmount: number;
  monthlyInterestPercent?: number | null;
  installmentCount?: number | null;
  installmentAmount?: number | null;
  loanType?: string | null;
  paidInstallmentCount?: number;
}): { original: number; count: number; installment: number; rate: number } {
  const original = Math.max(0, Number(opts.originalAmount) || 0);
  const paid = Math.max(0, Math.floor(opts.paidInstallmentCount || 0) || 0);
  const count = Math.max(1, Math.floor(opts.installmentCount || 0) || paid || 1);
  const installment =
    opts.installmentAmount != null && Number(opts.installmentAmount) > 0
      ? Math.round(Number(opts.installmentAmount) * 100) / 100
      : computeLoanInstallmentAmount({
          principal: original,
          monthlyInterestPercent: Number(opts.monthlyInterestPercent) || 0,
          installmentCount: count,
          loanType: opts.loanType,
        });
  const rate = loanEffectiveMonthlyRate(Number(opts.monthlyInterestPercent) || 0, opts.loanType);
  return { original, count, installment, rate };
}

/** Her taksit için faiz+vergi ve anapara. Sıra, ödeme sırasıdır. */
export function loanAmortizationSlices(opts: {
  originalAmount: number;
  monthlyInterestPercent?: number | null;
  installmentCount?: number | null;
  installmentAmount?: number | null;
  loanType?: string | null;
}): LoanSlice[] {
  const { original, count, installment, rate } = loanInstallmentUnit(opts);
  const slices: LoanSlice[] = [];
  let balance = original;
  for (let i = 0; i < count; i += 1) {
    const interest = Math.max(0, balance * rate);
    let principal = installment - interest;
    if (principal > balance) principal = balance;
    if (principal < 0) principal = 0;
    balance = Math.max(0, balance - principal);
    slices.push({ interest, principal, balanceAfter: balance });
    if (balance <= 0.004) break;
  }
  return slices;
}

/**
 * Kalan anapara. Ödenen her taksitte faiz+vergi düşülür, kalan anaparaya yazılır.
 * Taksit tutarı bankayla aynı değilse son kuruş kayabilir.
 */
export function remainingLoanPrincipal(opts: {
  originalAmount: number;
  monthlyInterestPercent?: number | null;
  installmentCount?: number | null;
  installmentAmount?: number | null;
  loanType?: string | null;
  paidInstallmentCount: number;
}): number {
  const original = Math.max(0, Number(opts.originalAmount) || 0);
  const paid = Math.max(0, Math.floor(opts.paidInstallmentCount) || 0);
  if (original <= 0 || paid <= 0) return Math.round(original * 100) / 100;
  const slices = loanAmortizationSlices(opts);
  const last = slices[Math.min(paid, slices.length) - 1];
  return Math.round((last?.balanceAfter ?? original) * 100) / 100;
}

function utcDay(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  return Date.UTC(y, m - 1, d);
}

/**
 * Erken ödemede indirim yalnızca o taksitin faiz+vergisi üzerinden,
 * erken gün / dönem günü kadardır. Bankanın gün sayısı değişebilir.
 */
export type LoanPayRow = {
  dueDate: string;
  full: number;
  interest: number;
  principal: number;
  discount: number;
  pay: number;
};

/** Seçilen taksitlerin her biri için erken ödeme tahmini. */
export function quoteLoanPayment(opts: {
  originalAmount: number;
  monthlyInterestPercent?: number | null;
  installmentCount?: number | null;
  installmentAmount?: number | null;
  loanType?: string | null;
  schedule: Array<{ dueDate?: string; amount?: number; status?: string; sequence?: number }>;
  payCount: number;
  asOf: string;
}): { rows: LoanPayRow[]; fullTotal: number; payTotal: number; minimum: number } {
  const ordered = [...opts.schedule].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const slices = loanAmortizationSlices({
    originalAmount: opts.originalAmount,
    monthlyInterestPercent: opts.monthlyInterestPercent,
    installmentCount: opts.installmentCount || ordered.length,
    installmentAmount: opts.installmentAmount,
    loanType: opts.loanType,
  });
  const pendingIdx = ordered
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status === 'pending');
  const chosen = pendingIdx.slice(0, Math.max(0, opts.payCount));
  const rows: LoanPayRow[] = chosen.map(({ item, index }) => {
    const slice = slices[index];
    const full = Math.round((Number(item.amount) || 0) * 100) / 100;
    const interest = Math.round(Math.min(full, Math.max(0, slice?.interest || 0)) * 100) / 100;
    const early = estimateEarlyPayDiscount({
      interest,
      dueDate: item.dueDate || '',
      previousDueDate: index > 0 ? ordered[index - 1]?.dueDate : null,
      asOf: opts.asOf,
    });
    const discount = Math.min(interest, early?.discount || 0);
    const pay = Math.round((full - discount) * 100) / 100;
    return {
      dueDate: item.dueDate || '',
      full,
      interest,
      principal: Math.round((full - interest) * 100) / 100,
      discount,
      pay,
    };
  });
  const fullTotal = Math.round(rows.reduce((sum, row) => sum + row.full, 0) * 100) / 100;
  const payTotal = Math.round(rows.reduce((sum, row) => sum + row.pay, 0) * 100) / 100;
  const minimum = Math.round(rows.reduce((sum, row) => sum + (row.full - row.interest), 0) * 100) / 100;
  return { rows, fullTotal, payTotal, minimum: Math.max(0, minimum) };
}

export function estimateEarlyPayDiscount(opts: {
  interest: number;
  dueDate: string;
  previousDueDate?: string | null;
  asOf: string;
}): { earlyDays: number; periodDays: number; discount: number } | null {
  const due = utcDay(opts.dueDate);
  const asOf = utcDay(opts.asOf);
  if (!Number.isFinite(due) || !Number.isFinite(asOf)) return null;
  const earlyDays = Math.round((due - asOf) / 86400000);
  if (earlyDays <= 0) return null;
  const prev = opts.previousDueDate ? utcDay(opts.previousDueDate) : NaN;
  const periodDays =
    Number.isFinite(prev) && due > prev ? Math.round((due - prev) / 86400000) : 30;
  if (periodDays <= 0) return null;
  const fraction = Math.min(1, earlyDays / periodDays);
  const discount = Math.round(Math.max(0, opts.interest) * fraction * 100) / 100;
  return { earlyDays, periodDays, discount };
}
