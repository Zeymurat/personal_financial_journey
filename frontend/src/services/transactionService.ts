import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transaction,
      userId,
      date: Timestamp.fromDate(new Date(transaction.date)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    await updateDoc(transactionRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: string) => {
  try {
    await deleteDoc(doc(db, 'transactions', transactionId));
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const getTransactions = async (userId: string, filters: {
  startDate?: Date;
  endDate?: Date;
  type?: 'income' | 'expense';
  category?: string;
} = {}) => {
  try {
    // Backend API kullan (users/{userId}/transactions subcollection'ından okur)
    const { transactionAPI } = await import('./apiService');
    const response = await transactionAPI.getAll({
      type: filters.type,
      category: filters.category
    });
    
    if (response.success && response.data) {
      // Backend'den gelen verileri Transaction formatına çevir
      let transactions = response.data.map((item: any) => {
        // Firestore timestamp'lerini parse et
        let date = item.date;
        let createdAt = item.createdAt;
        let updatedAt = item.updatedAt;
        
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
        
        if (updatedAt && typeof updatedAt === 'object' && updatedAt.toDate) {
          updatedAt = updatedAt.toDate();
        } else if (updatedAt && typeof updatedAt === 'string') {
          updatedAt = new Date(updatedAt);
        } else {
          updatedAt = new Date();
        }
        
        return {
          id: item.id || item._id,
          type: item.type || 'expense',
          amount: item.amount || 0,
          category: item.category || '',
          description: item.description || '',
          date,
          currency: item.currency || 'TRY',
          amountInTRY: item.amountInTRY || item.amount || 0,
          createdAt,
          updatedAt
        };
      }) as Transaction[];
      
      // Frontend'de tarih filtreleme (backend'de henüz desteklenmiyor)
      if (filters.startDate) {
        transactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate >= filters.startDate!;
        });
      }
      if (filters.endDate) {
        transactions = transactions.filter(t => {
          const tDate = new Date(t.date);
          return tDate <= filters.endDate!;
        });
      }
      
      return transactions;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

export const getTransaction = async (transactionId: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'transactions', transactionId));
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        date: docSnap.data().date?.toDate().toISOString().split('T')[0],
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate()
      } as Transaction;
    }
    return null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};
