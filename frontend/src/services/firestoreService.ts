import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, writeBatch, onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Investment, InvestmentTransaction } from '../types';

// Yardımcı fonksiyon
const getCurrentUserId = (): string => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user?.uid) throw new Error('Kullanıcı girişi bulunamadı');
  return user.uid;
};

// İşlemler (Transactions) Servisi
export const transactionService = {
  // Yeni işlem ekle
  async add(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    const userId = getCurrentUserId();
    const docRef = doc(collection(db, 'users', userId, 'transactions'));
    const newTransaction = {
      ...transaction,
      id: docRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newTransaction);
    return newTransaction;
  },

  // İşlem güncelle
  async update(id: string, updates: Partial<Transaction>) {
    const userId = getCurrentUserId();
    await updateDoc(doc(db, 'users', userId, 'transactions', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // İşlem sil
  async delete(id: string) {
    const userId = getCurrentUserId();
    await deleteDoc(doc(db, 'users', userId, 'transactions', id));
  },

  // Tüm işlemleri getir
  async getAll(filters: { type?: 'income' | 'expense'; category?: string } = {}) {
    const userId = getCurrentUserId();
    let q = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('date', 'desc')
    );

    if (filters.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  },

  // Gerçek zamanlı dinleme
  onUpdate(callback: (transactions: Transaction[]) => void) {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('date', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      callback(transactions);
    });
  }
};

// Yatırımlar (Investments) Servisi
export const investmentService = {
  // Yeni yatırım ekle
  async add(investment: Omit<Investment, 'id' | 'transactions' | 'createdAt' | 'updatedAt'>) {
    const userId = getCurrentUserId();
    const docRef = doc(collection(db, 'users', userId, 'investments'));
    const newInvestment = {
      ...investment,
      id: docRef.id,
      transactions: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newInvestment);
    return newInvestment;
  },

  // Yatırım güncelle
  async update(id: string, updates: Partial<Investment>) {
    const userId = getCurrentUserId();
    await updateDoc(doc(db, 'users', userId, 'investments', id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // Yatırım sil
  async delete(id: string) {
    const userId = getCurrentUserId();
    await deleteDoc(doc(db, 'users', userId, 'investments', id));
  },

  // Tüm yatırımları getir
  async getAll() {
    const userId = getCurrentUserId();
    const snapshot = await getDocs(collection(db, 'users', userId, 'investments'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
  },

  // Yatırım işlemi ekle
  async addTransaction(investmentId: string, transaction: Omit<InvestmentTransaction, 'id' | 'createdAt'>) {
    const userId = getCurrentUserId();
    const docRef = doc(collection(db, 'users', userId, 'investments', investmentId, 'transactions'));
    const newTransaction = {
      ...transaction,
      id: docRef.id,
      createdAt: serverTimestamp()
    };
    
    await setDoc(docRef, newTransaction);
    return newTransaction;
  },

  // Yatırım işlemlerini getir
  async getTransactions(investmentId: string) {
    const userId = getCurrentUserId();
    const snapshot = await getDocs(
      collection(db, 'users', userId, 'investments', investmentId, 'transactions')
    );
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InvestmentTransaction[];
  },

  // Yatırım detaylarını ve işlemleriyle birlikte getir
  async getWithTransactions(investmentId: string) {
    const userId = getCurrentUserId();
    const [investmentSnap, transactionsSnap] = await Promise.all([
      getDoc(doc(db, 'users', userId, 'investments', investmentId)),
      getDocs(collection(db, 'users', userId, 'investments', investmentId, 'transactions'))
    ]);

    if (!investmentSnap.exists()) {
      throw new Error('Yatırım bulunamadı');
    }

    const investment = {
      id: investmentSnap.id,
      ...investmentSnap.data()
    } as Investment;

    const transactions = transactionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as InvestmentTransaction[];

    // Tarih karşılaştırması için güvenli fonksiyon
    const getDateValue = (date: any): number => {
      if (!date) return 0;
      // Eğer date bir Firestore Timestamp ise
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().getTime();
      }
      // Eğer date bir string veya Date ise
      return new Date(date).getTime() || 0;
    };

    return {
      ...investment,
      transactions: transactions.sort((a, b) => 
        getDateValue(b.createdAt) - getDateValue(a.createdAt)
      )
    };
  }
};

// Örnek kullanım:
/*
// İşlem ekleme
await transactionService.add({
  type: 'expense',
  amount: 150,
  category: 'Market',
  description: 'Haftalık alışveriş',
  date: new Date().toISOString(),
  currency: 'TRY'
});

// Yatırım işlemi ekleme
await investmentService.addTransaction('investment123', {
  type: 'buy',
  quantity: 5,
  price: 100,
  totalAmount: 500,
  fee: 10,
  date: new Date().toISOString(),
  notes: 'İlk alım'
});

// Gerçek zamanlı dinleme
const unsubscribe = transactionService.onUpdate(transactions => {
  console.log('Güncel işlemler:', transactions);
});

// Dinlemeyi durdurmak için:
// unsubscribe();
*/
