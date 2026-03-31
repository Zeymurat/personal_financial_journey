import type { StockData } from '../../../contexts/FinanceContext';
import type {
  SelectedCurrency,
  SelectedFund,
  SelectedHisse
} from '../../../services/userSettingsService';
import type { CurrencyRate } from '../types';

export function getSortedSelectedCurrencies(
  allCurrencies: CurrencyRate[],
  selectedCurrencies: SelectedCurrency[]
): CurrencyRate[] {
  if (selectedCurrencies.length === 0) return [];

  return selectedCurrencies
    .sort((a, b) => a.order - b.order)
    .map((selected) => allCurrencies.find((c) => c.code === selected.code))
    .filter((c): c is CurrencyRate => c !== undefined && c.code !== 'TRY');
}

export function getSortedSelectedFunds(
  allFunds: Array<{ key: string; value: string }>,
  selectedFunds: SelectedFund[]
): Array<{ key: string; value: string }> {
  if (selectedFunds.length === 0) return [];

  return selectedFunds
    .sort((a, b) => a.order - b.order)
    .map((selected) => {
      const fund = allFunds.find((f) => f.key === selected.key);
      return fund ? { key: fund.key, value: fund.value } : null;
    })
    .filter((f): f is { key: string; value: string } => f !== null);
}

export function getSortedSelectedStocks(borsaData: StockData[], selectedHisse: SelectedHisse[]): StockData[] {
  if (selectedHisse.length === 0) return [];

  return selectedHisse
    .sort((a, b) => a.order - b.order)
    .map((selected) => borsaData.find((s) => s.code === selected.code))
    .filter((s): s is StockData => s !== undefined);
}
