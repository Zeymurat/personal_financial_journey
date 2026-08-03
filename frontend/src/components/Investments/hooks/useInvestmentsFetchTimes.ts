import { useMemo } from 'react';
import { useFinance } from '../../../contexts/FinanceContext';

function formatRatesUpdatedAt(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const date = new Date(raw);
    return date
      .toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      .replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
  } catch {
    return raw;
  }
}

/**
 * TCMB / borsa zamanları — FinanceContext'ten (ekstra getmain/borsa indirmez).
 */
export function useInvestmentsFetchTimes() {
  const { ratesUpdatedAt, borsaFetchTime } = useFinance();

  const currenciesFetchTime = useMemo(
    () => formatRatesUpdatedAt(ratesUpdatedAt),
    [ratesUpdatedAt]
  );

  return { currenciesFetchTime, borsaFetchTime };
}
