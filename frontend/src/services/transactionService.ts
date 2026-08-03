import { Transaction } from '../types';

/**
 * Transaction CRUD — yalnızca BFF (Django).
 * Client SDK ile kök `transactions/` yazılmaz.
 */

const mapApiItemToTransaction = (item: any): Transaction => {
  let date = item.date;
  let createdAt = item.createdAt;
  let updatedAt = item.updatedAt;

  if (date && typeof date === 'object' && date.toDate) {
    date = date.toDate().toISOString().split('T')[0];
  } else if (typeof date !== 'string' || !date) {
    date = new Date().toISOString().split('T')[0];
  }

  if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
    createdAt = createdAt.toDate();
  } else if (typeof createdAt === 'string') {
    createdAt = new Date(createdAt);
  } else {
    createdAt = new Date();
  }

  if (updatedAt && typeof updatedAt === 'object' && updatedAt.toDate) {
    updatedAt = updatedAt.toDate();
  } else if (typeof updatedAt === 'string') {
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
    updatedAt,
  } as Transaction;
};

export const addTransaction = async (
  _userId: string,
  transaction: Omit<Transaction, 'id'>
) => {
  try {
    const { transactionAPI } = await import('./apiService');
    const response = await transactionAPI.create(transaction);

    if (response.success && (response.id || response.data?.id)) {
      return response.id || response.data.id;
    }
    throw new Error(response.error || 'Transaction oluşturulamadı');
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const updateTransaction = async (
  transactionId: string,
  updates: Partial<Transaction>
) => {
  try {
    const { transactionAPI } = await import('./apiService');
    const response = await transactionAPI.update(transactionId, updates);

    if (!response.success) {
      throw new Error(response.error || 'Transaction güncellenemedi');
    }
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId: string) => {
  try {
    const { transactionAPI } = await import('./apiService');
    const response = await transactionAPI.delete(transactionId);

    if (!response.success) {
      throw new Error(response.error || 'Transaction silinemedi');
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const getTransactions = async (
  _userId: string,
  filters: {
    startDate?: Date;
    endDate?: Date;
    type?: 'income' | 'expense';
    category?: string;
  } = {}
) => {
  try {
    const { transactionAPI } = await import('./apiService');
    const response = await transactionAPI.getAll({
      type: filters.type,
      category: filters.category,
    });

    if (!response.success || !response.data) {
      return [];
    }

    let transactions = response.data.map(mapApiItemToTransaction);

    if (filters.startDate) {
      transactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= filters.startDate!;
      });
    }
    if (filters.endDate) {
      transactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate <= filters.endDate!;
      });
    }

    return transactions;
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

export const getTransaction = async (transactionId: string) => {
  try {
    const { transactionAPI } = await import('./apiService');
    const response = await transactionAPI.getAll();
    if (!response.success || !response.data) {
      return null;
    }
    const item = response.data.find(
      (t: any) => (t.id || t._id) === transactionId
    );
    return item ? mapApiItemToTransaction(item) : null;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};
