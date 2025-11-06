import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Investment, Currency } from '../types';
import { 
  getTransactions as fetchTransactions,
  addTransaction as createTransaction,
  updateTransaction as editTransaction,
  deleteTransaction as removeTransaction
} from '../services/transactionService';
import { 
  getInvestments as fetchInvestments,
  addInvestment as createInvestment,
  updateInvestment as editInvestment,
  deleteInvestment as removeInvestment,
  addInvestmentTransaction as createInvestmentTransaction,
  getInvestmentTransactions as fetchInvestmentTransactions
} from '../services/investmentService';
import { getExchangeRates, convertCurrency } from '../services/currencyService';
import { tcmbAPI } from '../services/apiService';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  // Transactions
  transactions: Transaction[];
  loadingTransactions: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  
  // Investments
  investments: Investment[];
  loadingInvestments: boolean;
  addInvestment: (investment: Omit<Investment, 'id' | 'transactions'>) => Promise<void>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addInvestmentTransaction: (
    investmentId: string, 
    transaction: Omit<import('../types').InvestmentTransaction, 'id'>
  ) => Promise<void>;
  getInvestmentTransactions: (investmentId: string) => Promise<import('../types').InvestmentTransaction[]>;
  refreshInvestments: () => Promise<void>;
  
  // Currency
  exchangeRates: Record<string, Currency>;
  goldPrices: Record<string, Currency>;
  cryptoCurrencies: Record<string, Currency>;
  preciousMetals: Record<string, Currency>;
  loadingRates: boolean;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  refreshRates: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, Currency>>({});
  const [goldPrices, setGoldPrices] = useState<Record<string, Currency>>({});
  const [cryptoCurrencies, setCryptoCurrencies] = useState<Record<string, Currency>>({});
  const [preciousMetals, setPreciousMetals] = useState<Record<string, Currency>>({});
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handling
  const handleError = (err: any, defaultMessage: string) => {
    console.error(defaultMessage, err);
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    throw new Error(message);
  };

  const clearError = () => setError(null);

  // Transactions
  const loadTransactions = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoadingTransactions(true);
      const data = await fetchTransactions(currentUser.uid);
      setTransactions(data);
    } catch (err) {
      handleError(err, 'Failed to load transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!currentUser?.uid) return;
    
    try {
      await createTransaction(currentUser.uid, transaction);
      await loadTransactions();
    } catch (err) {
      handleError(err, 'Failed to add transaction');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!currentUser?.uid) return;
    
    try {
      await editTransaction(id, updates);
      await loadTransactions();
    } catch (err) {
      handleError(err, 'Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await removeTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      handleError(err, 'Failed to delete transaction');
    }
  };

  // Investments
  const loadInvestments = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoadingInvestments(true);
      const data = await fetchInvestments(currentUser.uid);
      setInvestments(data);
    } catch (err) {
      handleError(err, 'Failed to load investments');
    } finally {
      setLoadingInvestments(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'transactions'>) => {
    if (!currentUser?.uid) return;
    
    try {
      await createInvestment(currentUser.uid, investment);
      await loadInvestments();
    } catch (err) {
      handleError(err, 'Failed to add investment');
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (!currentUser?.uid) return;
    
    try {
      await editInvestment(id, updates);
      await loadInvestments();
    } catch (err) {
      handleError(err, 'Failed to update investment');
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await removeInvestment(id);
      setInvestments(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      handleError(err, 'Failed to delete investment');
    }
  };

  const addInvestmentTransaction = async (
    investmentId: string, 
    transaction: Omit<import('../types').InvestmentTransaction, 'id'>
  ) => {
    if (!currentUser?.uid) return;
    
    try {
      await createInvestmentTransaction(currentUser.uid, investmentId, transaction);
      await loadInvestments();
    } catch (err) {
      handleError(err, 'Failed to add investment transaction');
    }
  };

  const getInvestmentTransactions = async (investmentId: string) => {
    if (!currentUser?.uid) return [];
    
    try {
      return await fetchInvestmentTransactions(investmentId);
    } catch (err) {
      handleError(err, 'Failed to load investment transactions');
      return [];
    }
  };

  // Currency - Firestore'dan oku (akıllı zaman kontrolü backend'de yapılıyor)
  const loadExchangeRates = async () => {
    try {
      console.log("🚀 Döviz kurları yükleniyor (Backend akıllı kontrol yapıyor)...");
      setLoadingRates(true);
      
      // Backend API'yi çağır (akıllı zaman kontrolü backend'de yapılıyor)
      // Backend Firestore'u kontrol eder, gerekirse API'den çeker
      try {
        console.log("💱 FinanceContext: Backend API çağrılıyor...");
        const tcmbData = await tcmbAPI.getMain();
        
        console.log("💱 FinanceContext: Backend response alındı:", {
          success: tcmbData?.success,
          hasData: !!tcmbData?.data,
          source: tcmbData?.source,
          exchangeRatesCount: Object.keys(tcmbData?.data?.exchange_rates || {}).length,
          goldPricesCount: Object.keys(tcmbData?.data?.gold_prices || {}).length,
          cryptoCount: Object.keys(tcmbData?.data?.crypto_currencies || {}).length,
          metalsCount: Object.keys(tcmbData?.data?.precious_metals || {}).length
        });
        
        if (tcmbData?.success && tcmbData?.data) {
          console.log(`✅ Döviz kurları başarıyla alındı (kaynak: ${tcmbData.source || 'API'})`);
          
          // Döviz kurlarını formatla
          const formattedRates: Record<string, Currency> = {};
          if (tcmbData.data.exchange_rates) {
            Object.entries(tcmbData.data.exchange_rates).forEach(([code, rateData]: [string, any]) => {
              formattedRates[code] = {
                code: rateData.code || code,
                name: rateData.name || rateData.name_tr || code,
                rate: rateData.rate || rateData.buy || 0,
                buy: rateData.buy || rateData.rate || 0,
                sell: rateData.sell || rateData.rate || 0,
                change: rateData.change || 0
              };
            });
          }
          
          // TRY'yi ekle (base currency)
          formattedRates['TRY'] = {
            code: 'TRY',
            name: 'Turkish Lira',
            rate: 1,
            buy: 1,
            sell: 1,
            change: 0
          };
          
          // Altın fiyatlarını formatla
          const formattedGold: Record<string, Currency> = {};
          if (tcmbData.data.gold_prices) {
            Object.entries(tcmbData.data.gold_prices).forEach(([code, goldData]: [string, any]) => {
              formattedGold[code] = {
                code: goldData.code || code,
                name: goldData.name || goldData.name_tr || code,
                rate: goldData.rate || goldData.buy || 0,
                buy: goldData.buy || goldData.rate || 0,
                sell: goldData.sell || goldData.rate || 0,
                change: goldData.change || 0
              };
            });
          }
          
          // Kripto paraları formatla
          const formattedCrypto: Record<string, Currency> = {};
          if (tcmbData.data.crypto_currencies) {
            Object.entries(tcmbData.data.crypto_currencies).forEach(([code, cryptoData]: [string, any]) => {
              formattedCrypto[code] = {
                code: cryptoData.code || code,
                name: cryptoData.name || cryptoData.name_tr || code,
                rate: cryptoData.rate || cryptoData.buy || 0,
                buy: cryptoData.buy || cryptoData.rate || 0,
                sell: cryptoData.sell || cryptoData.rate || 0,
                change: cryptoData.change || 0
              };
            });
          }
          
          // Değerli metalleri formatla
          const formattedMetals: Record<string, Currency> = {};
          if (tcmbData.data.precious_metals) {
            Object.entries(tcmbData.data.precious_metals).forEach(([code, metalData]: [string, any]) => {
              formattedMetals[code] = {
                code: metalData.code || code,
                name: metalData.name || metalData.name_tr || code,
                rate: metalData.rate || metalData.buy || 0,
                buy: metalData.buy || metalData.rate || 0,
                sell: metalData.sell || metalData.rate || 0,
                change: metalData.change || 0
              };
            });
          }
          
          console.log("📊 Formatlanmış veriler:", {
            döviz: Object.keys(formattedRates).length,
            altın: Object.keys(formattedGold).length,
            kripto: Object.keys(formattedCrypto).length,
            metaller: Object.keys(formattedMetals).length
          });
          
          setExchangeRates(formattedRates);
          setGoldPrices(formattedGold);
          setCryptoCurrencies(formattedCrypto);
          setPreciousMetals(formattedMetals);
          
          // Backend zaten Firestore'a kaydediyor, burada tekrar kaydetmeye gerek yok
          return;
        } else {
          console.warn("⚠️ Backend'den beklenen formatta veri gelmedi, Firestore'a fallback yapılıyor...");
        }
      } catch (tcmbError) {
        console.warn("⚠️ Backend hatası, Firestore'a fallback yapılıyor:", tcmbError);
      }

      // Fallback: Firestore'dan direkt oku
      console.log("📚 Firestore'dan döviz kurları okunuyor...");
      const rates = await getExchangeRates();
      console.log("✅ Firestore döviz kurları yüklendi:", rates);
      setExchangeRates(rates);

    } catch (err) {
      console.error("❌ Döviz kurları yüklenirken hata:", err);
      handleError(err, 'Failed to load exchange rates');
    } finally {
      setLoadingRates(false);
      console.log("🏁 Döviz kurları yükleme işlemi tamamlandı");
    }
  };

  const convertCurrencyAmount = async (amount: number, fromCurrency: string, toCurrency: string) => {
    try {
      return await convertCurrency(amount, fromCurrency, toCurrency);
    } catch (err) {
      handleError(err, 'Failed to convert currency');
      return amount; // Return original amount as fallback
    }
  };

  // Initial data loading - Login olduğunda çalışır
  useEffect(() => {
    if (currentUser?.uid) {
      console.log("👤 Kullanıcı login oldu, veriler yükleniyor...", currentUser.email);
      console.log("📊 İşlemler yükleniyor...");
      loadTransactions();
      console.log("💼 Yatırımlar yükleniyor...");
      loadInvestments();
      console.log("💱 Döviz kurları Firestore'dan yükleniyor (akıllı zaman kontrolü backend'de)...");
      loadExchangeRates();
      
      // Otomatik güncelleme kaldırıldı - Backend akıllı zaman kontrolü yapıyor
      // Sadece gerekli durumlarda (10:00, 13:30, 17:00) API çağrısı yapılıyor
    } else {
      console.log("👤 Kullanıcı login olmadı, veriler yüklenmedi");
    }
  }, [currentUser?.uid]);

  const value = {
    // Transactions
    transactions,
    loadingTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions: loadTransactions,
    
    // Investments
    investments,
    loadingInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addInvestmentTransaction,
    getInvestmentTransactions,
    refreshInvestments: loadInvestments,
    
    // Currency
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    convertCurrency: convertCurrencyAmount,
    refreshRates: loadExchangeRates,
    
    // Error handling
    error,
    clearError,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

// Custom hook to use the finance context
export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
