/** BDDK-style TR credit card minimum payment. */
export const CC_MIN_PAYMENT_LIMIT_THRESHOLD = 50_000;

export function computeCcMinPayment(
  creditLimit: number,
  statementBalance: number
): { minPayment: number; ratePercent: number } {
  const balance = Math.max(0, Number(statementBalance) || 0);
  const limit = Number(creditLimit) || 0;
  const ratePercent = limit <= CC_MIN_PAYMENT_LIMIT_THRESHOLD ? 20 : 40;
  return {
    minPayment: Math.round((balance * ratePercent) / 100 * 100) / 100,
    ratePercent,
  };
}
