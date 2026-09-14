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
