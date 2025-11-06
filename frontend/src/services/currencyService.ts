import { 
  doc, 
  setDoc, 
  getDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Currency } from '../types';

// Currencies collection'ına kurları kaydet/güncelle
// currencies/ collection'ı users/ ile aynı seviyede (root level)
export const updateExchangeRates = async (rates: Record<string, Currency>) => {
  try {
    console.log("💾 Currencies Firestore'a kaydediliyor...");
    const batch = [];
    const now = Timestamp.now();
    
    for (const [code, currency] of Object.entries(rates)) {
      const currencyRef = doc(db, 'currencies', code);
      const docSnap = await getDoc(currencyRef);
      
      if (docSnap.exists()) {
        // Update with change calculation
        const currentRate = docSnap.data().rate;
        const change = ((currency.rate - currentRate) / currentRate) * 100; // percentage change
        
        batch.push(updateDoc(currencyRef, {
          code: currency.code,
          name: currency.name || getCurrencyName(code),
          rate: currency.rate,
          buy: currency.buy || currency.rate,
          sell: currency.sell || currency.rate,
          change: change,
          lastUpdated: now
        }));
      } else {
        // Create new entry
        batch.push(setDoc(currencyRef, {
          code: currency.code,
          name: currency.name || getCurrencyName(code),
          rate: currency.rate,
          buy: currency.buy || currency.rate,
          sell: currency.sell || currency.rate,
          change: currency.change || 0,
          lastUpdated: now
        }));
      }
    }
    
    await Promise.all(batch);
    console.log("✅ Currencies başarıyla Firestore'a kaydedildi");
    return true;
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    throw error;
  }
};

export const getExchangeRates = async (baseCurrency: string = 'TRY') => {
  try {
    // currencies/ collection'ı users/ ile aynı seviyede (root level)
    // Eğer currencies yoksa, eski exchange_rates'i de dene (backward compatibility)
    let q = query(collection(db, 'currencies'));
    let querySnapshot = await getDocs(q);
    
    // Eğer currencies boşsa, eski exchange_rates'i dene
    if (querySnapshot.empty) {
      console.log("⚠️ currencies collection boş, eski exchange_rates collection'ı deneniyor...");
      try {
        q = query(collection(db, 'exchange_rates'));
        querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.log("✅ exchange_rates collection'ından veri bulundu");
        }
      } catch (oldError) {
        console.warn("⚠️ exchange_rates collection'ına da erişilemedi:", oldError);
      }
    }
    
    const rates: Record<string, Currency> = {};
    let baseRate = 1; // Default for base currency
    
    // First pass: collect all rates
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.code === baseCurrency) {
        baseRate = data.rate;
      }
      rates[data.code] = {
        code: data.code,
        name: data.name || data.code,
        rate: data.rate,
        buy: data.buy || data.rate,
        sell: data.sell || data.rate,
        change: data.change || 0
      };
    });
    
    // If base currency is not in the database, add it
    if (!rates[baseCurrency]) {
      rates[baseCurrency] = {
        code: baseCurrency,
        name: getCurrencyName(baseCurrency),
        rate: 1,
        change: 0
      };
    }
    
    // Second pass: convert all rates to be relative to base currency
    const baseRateValue = baseCurrency === 'TRY' ? 1 : rates[baseCurrency]?.rate || 1;
    
    Object.keys(rates).forEach(code => {
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
    
    // Since rates are stored relative to base currency
    if (toCurrency === 'TRY') {
      return amount * rates[fromCurrency].rate;
    } else if (fromCurrency === 'TRY') {
      return amount / rates[toCurrency].rate;
    } else {
      // Convert from source to TRY, then to target
      const inBase = amount * rates[fromCurrency].rate;
      return inBase / rates[toCurrency].rate;
    }
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};

// Helper function to get currency name from code
function getCurrencyName(code: string): string {
  const currencyNames: Record<string, string> = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'TRY': 'Turkish Lira',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum'
  };
  
  return currencyNames[code] || code;
}
