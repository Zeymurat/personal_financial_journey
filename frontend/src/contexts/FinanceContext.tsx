import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  getInvestmentTransactions as fetchInvestmentTransactions,
  updateInvestmentTransaction as editInvestmentTransaction,
  deleteInvestmentTransaction as removeInvestmentTransaction
} from '../services/investmentService';
import { getExchangeRates, convertCurrency } from '../services/currencyService';
import { tcmbAPI, borsaAPI } from '../services/apiService';
import { useAuth } from './AuthContext';

// Borsa verisi tipi
export interface StockData {
  code: string;
  name: string;
  last_price: number;
  rate: number;
  volume: number;
  high: number;
  low: number;
  time: string;
  icon?: string;
}

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
  
  // Borsa (Stock Market)
  borsaData: StockData[];
  loadingBorsa: boolean;
  refreshBorsa: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, authenticating } = useAuth();
  
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [exchangeRates, setExchangeRates] = useState<Record<string, Currency>>({});
  const [goldPrices, setGoldPrices] = useState<Record<string, Currency>>({});
  const [cryptoCurrencies, setCryptoCurrencies] = useState<Record<string, Currency>>({});
  const [preciousMetals, setPreciousMetals] = useState<Record<string, Currency>>({});
  const [borsaData, setBorsaData] = useState<StockData[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingBorsa, setLoadingBorsa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verilerin yüklenip yüklenmediğini takip et
  const dataLoadedRef = useRef(false);

  // Error handling
  const handleError = (err: any, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    throw new Error(message);
  };

  const clearError = () => setError(null);

  // Transactions
  const loadTransactions = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingTransactions(true);
      const data = await fetchTransactions(currentUser.id);
      setTransactions(data);
    } catch (err) {
      handleError(err, 'Failed to load transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!currentUser?.id) return;
    
    try {
      await createTransaction(currentUser.id, transaction);
      await loadTransactions();
    } catch (err) {
      handleError(err, 'Failed to add transaction');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!currentUser?.id) return;
    
    try {
      await editTransaction(id, updates);
      await loadTransactions();
    } catch (err) {
      handleError(err, 'Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser?.id) return;
    
    try {
      await removeTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      handleError(err, 'Failed to delete transaction');
    }
  };

  // Investments
  const loadInvestments = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingInvestments(true);
      const data = await fetchInvestments(currentUser.id);
      setInvestments(data);
    } catch (err) {
      handleError(err, 'Failed to load investments');
    } finally {
      setLoadingInvestments(false);
    }
  };

  const addInvestment = async (investment: Omit<Investment, 'id' | 'transactions'>) => {
    if (!currentUser?.id) return;
    
    try {
      await createInvestment(currentUser.id, investment);
      await loadInvestments();
    } catch (err) {
      handleError(err, 'Failed to add investment');
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (!currentUser?.id) return;
    
    try {
      await editInvestment(id, updates);
      await loadInvestments();
    } catch (err) {
      handleError(err, 'Failed to update investment');
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!currentUser?.id) return;
    
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
    if (!currentUser?.id) return;
    
    try {
      await createInvestmentTransaction(currentUser.id, investmentId, transaction);
      await loadInvestments();
    } catch (err: any) {
      // Hata mesajını daha detaylı yap
      const errorMessage = err?.message || err?.error || 'Failed to add investment transaction';
      console.error('Investment transaction ekleme hatası:', errorMessage, err);
      throw new Error(errorMessage);
    }
  };

  const updateInvestmentTransaction = async (
    investmentId: string,
    transactionId: string,
    updates: Partial<import('../types').InvestmentTransaction>
  ) => {
    if (!currentUser?.id) return;
    
    try {
      await editInvestmentTransaction(investmentId, transactionId, updates);
      await loadInvestments();
    } catch (err: any) {
      const errorMessage = err?.message || err?.error || 'Failed to update investment transaction';
      console.error('Investment transaction güncelleme hatası:', errorMessage, err);
      throw new Error(errorMessage);
    }
  };

  const deleteInvestmentTransaction = async (
    investmentId: string,
    transactionId: string
  ) => {
    if (!currentUser?.id) return;
    
    try {
      await removeInvestmentTransaction(investmentId, transactionId);
      await loadInvestments();
    } catch (err: any) {
      const errorMessage = err?.message || err?.error || 'Failed to delete investment transaction';
      console.error('Investment transaction silme hatası:', errorMessage, err);
      throw new Error(errorMessage);
    }
  };

  const getInvestmentTransactions = async (investmentId: string) => {
    if (!currentUser?.id) return [];
    
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
      setLoadingRates(true);
      
      // Backend API'yi çağır (akıllı zaman kontrolü backend'de yapılıyor)
      try {
        const tcmbData = await tcmbAPI.getMain();
        
        if (tcmbData?.success && tcmbData?.data) {
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
          
          setExchangeRates(formattedRates);
          setGoldPrices(formattedGold);
          setCryptoCurrencies(formattedCrypto);
          setPreciousMetals(formattedMetals);
          
          const source = tcmbData.source || 'api';
          const date = tcmbData.date || 'bilinmiyor';
          console.log(`💱 Döviz verileri yüklendi (kaynak: ${source}, tarih: ${date})`);
          return;
        }
      } catch (tcmbError) {
        // Fallback: Firestore'dan direkt oku
        const rates = await getExchangeRates();
        setExchangeRates(rates);
        console.log('💱 Döviz verileri yüklendi (kaynak: cache)');
      }

    } catch (err) {
      handleError(err, 'Failed to load exchange rates');
    } finally {
      setLoadingRates(false);
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

  // Borsa verilerini yükle (akıllı zaman kontrolü backend'de yapılıyor)
  const loadBorsaData = async () => {
    try {
      setLoadingBorsa(true);
      
      // Backend API'yi çağır (akıllı zaman kontrolü backend'de yapılıyor)
      try {
        const response = await borsaAPI.getBorsaData();
        
        if (response?.success && response?.data?.stocks) {
          const stocks: StockData[] = response.data.stocks.map((stock: any) => ({
            code: stock.code,
            name: stock.name,
            last_price: stock.last_price || 0,
            rate: stock.rate || 0,
            volume: stock.volume || 0,
            high: stock.high || 0,
            low: stock.low || 0,
            time: stock.time || '',
            icon: stock.icon
          }));
          
          setBorsaData(stocks);
          const source = response.source || 'api';
          const date = response.date || 'bilinmiyor';
          console.log(`📈 Hisse verileri yüklendi (kaynak: ${source}, tarih: ${date}, adet: ${stocks.length})`);
          return;
        }
      } catch (borsaError) {
        // Fallback: Boş array set et
        setBorsaData([]);
      }
      
      setBorsaData([]);
    } catch (err) {
      handleError(err, 'Failed to load borsa data');
      setBorsaData([]);
    } finally {
      setLoadingBorsa(false);
    }
  };

  // Initial data loading - Login olduğunda çalışır
  useEffect(() => {
    // currentUser undefined veya null ise bekle
    if (currentUser === undefined) {
      return;
    }
    
    // currentUser null ise (logout durumu)
    if (currentUser === null) {
      dataLoadedRef.current = false;
      setTransactions([]);
      setInvestments([]);
      setExchangeRates({});
      setGoldPrices({});
      setCryptoCurrencies({});
      setPreciousMetals({});
      setBorsaData([]);
      return;
    }
    
    // Authentication devam ediyorsa bekle (token henüz hazır değil)
    if (authenticating) {
      return;
    }
    
    // Token kontrolü - token yoksa bekle
    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }
    
    // currentUser.id varsa ve token hazırsa verileri yükle (sadece bir kez)
    if (currentUser?.id && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadTransactions();
      loadInvestments();
      
      // Currency ve Borsa verilerini paralel yükle
      Promise.all([
        loadExchangeRates().catch(() => {}),
        loadBorsaData().catch(() => {})
      ]);
    }
  }, [currentUser, authenticating]);

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
    updateInvestmentTransaction,
    deleteInvestmentTransaction,
    refreshInvestments: loadInvestments,
    
    // Currency
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    convertCurrency: convertCurrencyAmount,
    refreshRates: loadExchangeRates,
    
    // Borsa
    borsaData,
    loadingBorsa,
    refreshBorsa: loadBorsaData,
    
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
