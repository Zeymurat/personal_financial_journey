export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CHF: 'CHF ',
    AUD: 'A$',
    CAD: 'C$',
    CNY: '¥'
  };
  return symbols[currency] || currency;
}
