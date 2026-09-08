/** Recognition date for P&L: effectiveDate with date fallback (legacy rows). */
export function transactionRecognitionDate(tx: {
  date: string;
  effectiveDate?: string;
}): string {
  return tx.effectiveDate || tx.date;
}
