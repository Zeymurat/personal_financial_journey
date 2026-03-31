import type { CurrencyRate } from '../types';

export function buildAllCurrencyRates(
  exchangeRates: Record<string, { code?: string; name?: string; rate?: number; buy?: number; sell?: number; change?: number }>,
  goldPrices: Record<string, { code?: string; name?: string; rate?: number; buy?: number; sell?: number; change?: number }>,
  cryptoCurrencies: Record<string, { code?: string; name?: string; rate?: number; buy?: number; sell?: number; change?: number }>,
  preciousMetals: Record<string, { code?: string; name?: string; rate?: number; buy?: number; sell?: number; change?: number }>
): CurrencyRate[] {
  const currencies: CurrencyRate[] = [
    { code: 'TRY', name: 'Türk Lirası', rate: 1, buy: 1, sell: 1, change: 0, type: 'currency' }
  ];

  Object.entries(exchangeRates).forEach(([code, currency]) => {
    if (code !== 'TRY') {
      currencies.push({
        code: currency.code || code,
        name: currency.name || code,
        rate: currency.rate || 0,
        buy: (currency as { buy?: number }).buy || currency.rate || 0,
        sell: (currency as { sell?: number }).sell || currency.rate || 0,
        change: currency.change || 0,
        type: 'currency'
      });
    }
  });

  Object.entries(goldPrices).forEach(([code, gold]) => {
    currencies.push({
      code: gold.code || code,
      name: gold.name || code,
      rate: gold.rate || 0,
      buy: (gold as { buy?: number }).buy || gold.rate || 0,
      sell: (gold as { sell?: number }).sell || gold.rate || 0,
      change: gold.change || 0,
      type: 'gold'
    });
  });

  Object.entries(cryptoCurrencies).forEach(([code, crypto]) => {
    currencies.push({
      code: crypto.code || code,
      name: crypto.name || code,
      rate: crypto.rate || 0,
      buy: (crypto as { buy?: number }).buy || crypto.rate || 0,
      sell: (crypto as { sell?: number }).sell || crypto.rate || 0,
      change: crypto.change || 0,
      type: 'crypto'
    });
  });

  Object.entries(preciousMetals).forEach(([code, metal]) => {
    currencies.push({
      code: metal.code || code,
      name: metal.name || code,
      rate: metal.rate || 0,
      buy: (metal as { buy?: number }).buy || metal.rate || 0,
      sell: (metal as { sell?: number }).sell || metal.rate || 0,
      change: metal.change || 0,
      type: 'metal'
    });
  });

  return currencies;
}
