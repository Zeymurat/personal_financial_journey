import { 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Investment, InvestmentTransaction } from '../types';

// Investment Operations
// Not: Bu fonksiyonlar artık kullanılmıyor, backend API kullanılıyor
// Ama geriye dönük uyumluluk için bırakıldı
export const addInvestment = async (userId: string, investment: Omit<Investment, 'id' | 'transactions'>) => {
  try {
    // Backend API kullan
    const { investmentAPI } = await import('./apiService');
    const response = await investmentAPI.create(investment);
    
    if (response.success && response.id) {
      return response.id;
    } else {
      throw new Error(response.error || 'Investment oluşturulamadı');
    }
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

export const updateInvestment = async (investmentId: string, updates: Partial<Investment>) => {
  try {
    // Backend API kullan
    const { investmentAPI } = await import('./apiService');
    const response = await investmentAPI.update(investmentId, updates);
    
    if (!response.success) {
      throw new Error(response.error || 'Investment güncellenemedi');
    }
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

export const deleteInvestment = async (investmentId: string) => {
  try {
    // Backend API kullan
    const { investmentAPI } = await import('./apiService');
    const response = await investmentAPI.delete(investmentId);
    
    if (!response.success) {
      throw new Error(response.error || 'Investment silinemedi');
    }
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
};

export const getInvestments = async (userId: string) => {
  try {
    // Backend API kullan (users/{userId}/investments subcollection'ından okur)
    const { investmentAPI } = await import('./apiService');
    const response = await investmentAPI.getAll();
    
    if (response.success && response.data) {
      // Backend'den gelen verileri Investment formatına çevir
      return response.data.map((item: any) => {
        // Firestore timestamp'lerini parse et
        let createdAt = item.createdAt;
        let updatedAt = item.updatedAt;
        
        // Eğer timestamp objesi varsa (Firestore formatı)
        if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
          createdAt = createdAt.toDate().toISOString();
        } else if (createdAt && typeof createdAt === 'string') {
          // Zaten string ise olduğu gibi bırak
        } else {
          createdAt = new Date().toISOString();
        }
        
        if (updatedAt && typeof updatedAt === 'object' && updatedAt.toDate) {
          updatedAt = updatedAt.toDate().toISOString();
        } else if (updatedAt && typeof updatedAt === 'string') {
          // Zaten string ise olduğu gibi bırak
        } else {
          updatedAt = new Date().toISOString();
        }
        
        return {
          id: item.id || item._id,
          symbol: item.symbol || '',
          name: item.name || '',
          type: item.type || 'forex',
          quantity: item.quantity || 0,
          averagePrice: item.averagePrice || 0,
          currentPrice: item.currentPrice || 0,
          totalValue: item.totalValue || 0,
          profitLoss: item.profitLoss || 0,
          profitLossPercentage: item.profitLossPercentage || 0,
          transactions: item.transactions || [],
          createdAt,
          updatedAt
        };
      }) as Investment[];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting investments:', error);
    throw error;
  }
};

// Investment Transaction Operations
export const addInvestmentTransaction = async (
  userId: string,
  investmentId: string,
  transaction: Omit<InvestmentTransaction, 'id'>
) => {
  try {
    // Backend API kullan (users/{userId}/investments/{investmentId}/transactions subcollection'ına ekler)
    const { investmentTransactionAPI } = await import('./apiService');
    const response = await investmentTransactionAPI.create(investmentId, transaction);
    
    if (response.success && response.id) {
      return response.id;
    } else {
      const errorMsg = response.error || response.message || 'Investment transaction oluşturulamadı';
      console.error('Backend response error:', response);
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    console.error('Error adding investment transaction:', error);
    // Daha detaylı hata mesajı
    const errorMsg = error?.message || error?.error || 'Investment transaction eklenirken bir hata oluştu';
    throw new Error(errorMsg);
  }
};

export const getInvestmentTransactions = async (investmentId: string) => {
  try {
    // Backend API kullan (users/{userId}/investments/{investmentId}/transactions subcollection'ından okur)
    const { investmentTransactionAPI } = await import('./apiService');
    const response = await investmentTransactionAPI.getByInvestment(investmentId);
    
    if (response.success && response.data) {
      // Backend'den gelen verileri InvestmentTransaction formatına çevir
      return response.data.map((item: any) => {
        // Firestore timestamp'lerini parse et
        let date = item.date;
        let createdAt = item.createdAt;
        
        // Eğer timestamp objesi varsa (Firestore formatı)
        if (date && typeof date === 'object' && date.toDate) {
          date = date.toDate().toISOString().split('T')[0];
        } else if (date && typeof date === 'string') {
          // Zaten string ise olduğu gibi bırak
        } else {
          date = new Date().toISOString().split('T')[0];
        }
        
        if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
          createdAt = createdAt.toDate();
        } else if (createdAt && typeof createdAt === 'string') {
          createdAt = new Date(createdAt);
        } else {
          createdAt = new Date();
        }
        
        return {
          id: item.id || item._id,
          type: item.type || 'buy',
          quantity: item.quantity || 0,
          price: item.price || 0,
          totalAmount: item.totalAmount || 0,
          date,
          fees: item.fees || 0,
          createdAt
        };
      }) as InvestmentTransaction[];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting investment transactions:', error);
    throw error;
  }
};

export const updateInvestmentTransaction = async (
  investmentId: string,
  transactionId: string,
  updates: Partial<InvestmentTransaction>
) => {
  try {
    // Backend API kullan
    const { investmentTransactionAPI } = await import('./apiService');
    const response = await investmentTransactionAPI.update(investmentId, transactionId, updates);
    
    if (!response.success) {
      throw new Error(response.error || 'Investment transaction güncellenemedi');
    }
  } catch (error) {
    console.error('Error updating investment transaction:', error);
    throw error;
  }
};

export const deleteInvestmentTransaction = async (
  investmentId: string,
  transactionId: string
) => {
  try {
    // Backend API kullan
    const { investmentTransactionAPI } = await import('./apiService');
    const response = await investmentTransactionAPI.delete(investmentId, transactionId);
    
    if (!response.success) {
      throw new Error(response.error || 'Investment transaction silinemedi');
    }
  } catch (error) {
    console.error('Error deleting investment transaction:', error);
    throw error;
  }
};

// Not: Investment stats güncellemesi backend'de yapılıyor (firestore_service.add_investment_transaction içinde)
// Bu yüzden frontend'de ayrı bir updateInvestmentStats fonksiyonuna gerek yok
