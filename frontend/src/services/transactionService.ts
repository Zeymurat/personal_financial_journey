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
    let q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    // Apply filters
    if (filters.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
    }
    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to Date
      date: doc.data().date?.toDate().toISOString().split('T')[0],
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Transaction[];
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
