import { useState, useEffect } from 'react';
import { tcmbAPI, borsaAPI } from '../../../services/apiService';

/** TCMB / borsa veri güncelleme zamanlarını yükler (Investments piyasa panelleri için). */
export function useInvestmentsFetchTimes() {
  const [currenciesFetchTime, setCurrenciesFetchTime] = useState<string | null>(null);
  const [borsaFetchTime, setBorsaFetchTime] = useState<string | null>(null);

  useEffect(() => {
    const loadFetchTimes = async () => {
      try {
        const currenciesResponse = await tcmbAPI.getMain();
        if (currenciesResponse?.data?.last_updated) {
          const lastUpdated = currenciesResponse.data.last_updated;
          if (lastUpdated) {
            try {
              const date = new Date(lastUpdated);
              const formatted = date
                .toLocaleString('tr-TR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })
                .replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
              setCurrenciesFetchTime(formatted);
            } catch {
              setCurrenciesFetchTime(lastUpdated);
            }
          }
        }
      } catch {
        // Silent fail
      }

      try {
        const borsaResponse = await borsaAPI.getBorsaData();
        if (borsaResponse?.data?.fetch_time) {
          setBorsaFetchTime(borsaResponse.data.fetch_time);
        } else if (borsaResponse?.fetch_time) {
          setBorsaFetchTime(borsaResponse.fetch_time);
        }
      } catch {
        // Silent fail
      }
    };

    loadFetchTimes();
  }, []);

  return { currenciesFetchTime, borsaFetchTime };
}
