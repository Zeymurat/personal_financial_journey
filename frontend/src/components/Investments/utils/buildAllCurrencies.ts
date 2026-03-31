import type { Currency } from '../../../types';
import type { CurrencyRate } from '../types';

/**
 * FinanceContext kaynaklarını tek listede birleştirir (TRY tabanı + döviz, altın, kripto, metal).
 */
export function buildAllCurrencies(
  exchangeRates: Record<string, Currency>,
  goldPrices: Record<string, Currency>,
  cryptoCurrencies: Record<string, Currency>,
  preciousMetals: Record<string, Currency>
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
        buy: (currency as Currency).buy ?? currency.rate ?? 0,
        sell: (currency as Currency).sell ?? currency.rate ?? 0,
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
      buy: (gold as Currency).buy ?? gold.rate ?? 0,
      sell: (gold as Currency).sell ?? gold.rate ?? 0,
      change: gold.change || 0,
      type: 'gold'
    });
  });

  Object.entries(cryptoCurrencies).forEach(([code, crypto]) => {
    currencies.push({
      code: crypto.code || code,
      name: crypto.name || code,
      rate: crypto.rate || 0,
      buy: (crypto as Currency).buy ?? crypto.rate ?? 0,
      sell: (crypto as Currency).sell ?? crypto.rate ?? 0,
      change: crypto.change || 0,
      type: 'crypto'
    });
  });

  Object.entries(preciousMetals).forEach(([code, metal]) => {
    currencies.push({
      code: metal.code || code,
      name: metal.name || code,
      rate: metal.rate || 0,
      buy: (metal as Currency).buy ?? metal.rate ?? 0,
      sell: (metal as Currency).sell ?? metal.rate ?? 0,
      change: metal.change || 0,
      type: 'metal'
    });
  });

  return currencies;
}
