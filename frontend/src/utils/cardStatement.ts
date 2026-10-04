/** TCMB ceiling, October 2026. KKDF 15% + BSMV 15%. */
const TAX = 1.3;

export function ccCeilingRates(statementBalance: number): { contractual: number; late: number } {
  const balance = Math.max(0, statementBalance || 0);
  if (balance < 30_000) return { contractual: 3.25, late: 3.55 };
  if (balance <= 180_000) return { contractual: 3.75, late: 4.05 };
  return { contractual: 4.25, late: 4.55 };
}

export function estimateRevolvingInterest(
  unpaid: number,
  cyclePaid: number,
  minimum: number,
  tierBalance: number
): { interest: number; rate: number; kind: 'none' | 'contractual' | 'late' } {
  const unpaidAmount = Math.round(Math.max(0, unpaid) * 100) / 100;
  if (unpaidAmount <= 0.02) return { interest: 0, rate: 0, kind: 'none' };
  const rates = ccCeilingRates(tierBalance);
  const metMinimum = cyclePaid + 0.02 >= minimum;
  const rate = metMinimum ? rates.contractual : rates.late;
  const interest = Math.round(unpaidAmount * (rate / 100) * TAX * 100) / 100;
  return { interest, rate, kind: metMinimum ? 'contractual' : 'late' };
}

export function previewCardPayment(input: {
  remainingAmount: number;
  periodBalance: number;
  minPayment: number;
  cyclePaidAmount: number;
  grossPeriodBalance: number;
  amount: number;
}): {
  remaining: number;
  period: number;
  minimum: number;
  closesStatement: boolean;
  excess: number;
  interest: number;
  rate: number;
  kind: 'none' | 'contractual' | 'late';
  tooMuch: boolean;
} {
  const amount = Math.round(Math.max(0, input.amount) * 100) / 100;
  const tooMuch = amount > input.remainingAmount + 0.02;
  const closesStatement = amount + 0.02 >= input.periodBalance && input.periodBalance > 0.02;
  if (closesStatement || (input.periodBalance <= 0.02 && amount > 0)) {
    const excess = Math.round(Math.max(0, amount - Math.max(0, input.periodBalance)) * 100) / 100;
    return {
      remaining: Math.round(Math.max(0, input.remainingAmount - amount) * 100) / 100,
      period: 0,
      minimum: 0,
      closesStatement: input.periodBalance > 0.02,
      excess,
      interest: 0,
      rate: 0,
      kind: 'none',
      tooMuch,
    };
  }
  const period = Math.round(Math.max(0, input.periodBalance - amount) * 100) / 100;
  const minimum = Math.round(Math.max(0, input.minPayment - amount) * 100) / 100;
  const cyclePaid = input.cyclePaidAmount + amount;
  const originalMin = input.minPayment + input.cyclePaidAmount;
  const estimate = estimateRevolvingInterest(period, cyclePaid, originalMin, input.grossPeriodBalance);
  return {
    remaining: Math.round(Math.max(0, input.remainingAmount - amount) * 100) / 100,
    period,
    minimum,
    closesStatement: false,
    excess: 0,
    interest: estimate.interest,
    rate: estimate.rate,
    kind: estimate.kind,
    tooMuch,
  };
}
