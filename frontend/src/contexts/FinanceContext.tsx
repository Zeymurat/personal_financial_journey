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
import { altinkaynakAPI } from '../services/apiService';
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

  // Currency - Altınkaynak API'den veri çek
  const loadExchangeRates = async () => {
    try {
      console.log("🚀 Altınkaynak döviz kurları yükleniyor...");
      setLoadingRates(true);
      
      // Önce Altınkaynak API'sinden veri çek
      try {
        const altinkaynakData = await altinkaynakAPI.getMain();
        
        if (altinkaynakData?.success && altinkaynakData?.data?.exchange_rates) {
          console.log("✅ Altınkaynak verisi başarıyla alındı, döviz kurları güncelleniyor...");
          
          // Altınkaynak verilerini Currency formatına dönüştür
          const formattedRates: Record<string, Currency> = {};
          
          Object.entries(altinkaynakData.data.exchange_rates).forEach(([code, rateData]: [string, any]) => {
            formattedRates[code] = {
              code: rateData.code || code,
              name: rateData.name || code,
              rate: rateData.rate || rateData.buy || 0,
              change: rateData.change || 0
            };
          });
          
          // TRY'yi ekle (base currency)
          formattedRates['TRY'] = {
            code: 'TRY',
            name: 'Turkish Lira',
            rate: 1,
            change: 0
          };
          
          console.log("📊 Formatlanmış döviz kurları:", formattedRates);
          setExchangeRates(formattedRates);
          
          // Başarılı oldu, return et
          return;
        } else {
          console.warn("⚠️ Altınkaynak API'den beklenen formatta veri gelmedi, Firestore'a fallback yapılıyor...");
        }
      } catch (altinkaynakError) {
        console.warn("⚠️ Altınkaynak API hatası, Firestore'a fallback yapılıyor:", altinkaynakError);
      }
      
      // Fallback: Firestore'dan oku
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
      console.log("💱 Döviz kurları Altınkaynak'tan yükleniyor...");
      loadExchangeRates();
      
      // Refresh rates every hour (her saat başı Altınkaynak'tan güncelle)
      const interval = setInterval(() => {
        console.log("🔄 Döviz kurları otomatik güncelleniyor...");
        loadExchangeRates();
      }, 60 * 60 * 1000);
      
      return () => {
        console.log("🧹 Interval temizleniyor...");
        clearInterval(interval);
      };
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
