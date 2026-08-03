import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Currency } from '../types';

/**
 * Döviz okuma — yalnızca BFF fail olunca fallback (Firestore root `currencies` READ).
 * Yazma (updateExchangeRates) kaldırıldı; global kur client'tan yazılmaz.
 */

export const getExchangeRates = async (baseCurrency: string = 'TRY') => {
  try {
    let q = query(collection(db, 'currencies'));
    let querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      try {
        q = query(collection(db, 'exchange_rates'));
        querySnapshot = await getDocs(q);
      } catch (oldError) {
        console.warn('exchange_rates fallback okunamadı:', oldError);
      }
    }

    const rates: Record<string, Currency> = {};

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      rates[data.code] = {
        code: data.code,
        name: data.name || data.code,
        rate: data.rate,
        buy: data.buy || data.rate,
        sell: data.sell || data.rate,
        change: data.change || 0,
      };
    });

    if (!rates[baseCurrency]) {
      rates[baseCurrency] = {
        code: baseCurrency,
        name: getCurrencyName(baseCurrency),
        rate: 1,
        change: 0,
      };
    }

    const baseRateValue = baseCurrency === 'TRY' ? 1 : rates[baseCurrency]?.rate || 1;

    Object.keys(rates).forEach((code) => {
      if (code !== baseCurrency) {
        rates[code].rate = rates[code].rate / baseRateValue;
      } else {
        rates[code].rate = 1;
      }
    });

    return rates;
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    throw error;
  }
};

export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
) => {
  try {
    if (fromCurrency === toCurrency) return amount;

    const rates = await getExchangeRates(toCurrency);

    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new Error('One or both currencies not found');
    }

    if (toCurrency === 'TRY') {
      return amount * rates[fromCurrency].rate;
    }
    if (fromCurrency === 'TRY') {
      return amount / rates[toCurrency].rate;
    }
    const inBase = amount * rates[fromCurrency].rate;
    return inBase / rates[toCurrency].rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};

function getCurrencyName(code: string): string {
  const currencyNames: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    TRY: 'Turkish Lira',
    AUD: 'Australian Dollar',
    CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
  };

  return currencyNames[code] || code;
}
