import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Investment, InvestmentTransaction } from '../types';

// Investment Operations
export const addInvestment = async (userId: string, investment: Omit<Investment, 'id' | 'transactions'>) => {
  try {
    const docRef = await addDoc(collection(db, 'investments'), {
      ...investment,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding investment:', error);
    throw error;
  }
};

export const updateInvestment = async (investmentId: string, updates: Partial<Investment>) => {
  try {
    const investmentRef = doc(db, 'investments', investmentId);
    await updateDoc(investmentRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
};

export const deleteInvestment = async (investmentId: string) => {
  try {
    // First delete all related transactions
    const transactionsQuery = query(
      collection(db, 'investment_transactions'),
      where('investmentId', '==', investmentId)
    );
    
    const batch = writeBatch(db);
    const querySnapshot = await getDocs(transactionsQuery);
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the investment
    batch.delete(doc(db, 'investments', investmentId));
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
};

export const getInvestments = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'investments'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as Investment[];
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
    const batch = writeBatch(db);
    
    // Add the transaction
    const transactionRef = doc(collection(db, 'investment_transactions'));
    batch.set(transactionRef, {
      ...transaction,
      userId,
      investmentId,
      date: Timestamp.fromDate(new Date(transaction.date)),
      createdAt: Timestamp.now()
    });
    
    // Update investment stats
    await updateInvestmentStats(userId, investmentId, batch);
    
    await batch.commit();
    return transactionRef.id;
  } catch (error) {
    console.error('Error adding investment transaction:', error);
    throw error;
  }
};

export const getInvestmentTransactions = async (investmentId: string) => {
  try {
    const q = query(
      collection(db, 'investment_transactions'),
      where('investmentId', '==', investmentId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate().toISOString().split('T')[0],
      createdAt: doc.data().createdAt?.toDate()
    })) as InvestmentTransaction[];
  } catch (error) {
    console.error('Error getting investment transactions:', error);
    throw error;
  }
};

// Helper function to update investment statistics
const updateInvestmentStats = async (
  userId: string, 
  investmentId: string, 
  batch?: any
) => {
  try {
    // Get all transactions for this investment
    const transactionsQuery = query(
      collection(db, 'investment_transactions'),
      where('investmentId', '==', investmentId)
    );
    
    const querySnapshot = await getDocs(transactionsQuery);
    
    let totalQuantity = 0;
    let totalCost = 0;
    
    querySnapshot.forEach((doc) => {
      const t = doc.data();
      if (t.type === 'buy') {
        totalQuantity += t.quantity;
        totalCost += t.totalAmount;
      } else {
        totalQuantity -= t.quantity;
        totalCost -= t.totalAmount;
      }
    });
    
    // Get current price from the investment
    const investmentRef = doc(db, 'investments', investmentId);
    const investmentSnap = await getDoc(investmentRef);
    
    if (investmentSnap.exists()) {
      const investmentData = investmentSnap.data();
      const currentPrice = investmentData.currentPrice;
      const totalValue = totalQuantity * currentPrice;
      const profitLoss = totalValue - totalCost;
      const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
      
      const updateData = {
        quantity: totalQuantity,
        averagePrice: totalQuantity > 0 ? totalCost / totalQuantity : 0,
        totalValue,
        profitLoss,
        profitLossPercentage,
        updatedAt: Timestamp.now()
      };
      
      if (batch) {
        batch.update(investmentRef, updateData);
      } else {
        await updateDoc(investmentRef, updateData);
      }
    }
  } catch (error) {
    console.error('Error updating investment stats:', error);
    throw error;
  }
};
