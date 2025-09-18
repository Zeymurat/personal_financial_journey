// src/components/Transactions/TransactionList.tsx
import React, { useEffect, useState } from 'react';
import { transactionService } from '../../services/firestoreService';
import { Transaction } from '../../types';

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // İlk yükleme
    const loadTransactions = async () => {
      try {
        const data = await transactionService.getAll();
        setTransactions(data);
      } catch (err) {
        setError('İşlemler yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();

    // Gerçek zamanlı güncellemeleri dinle
    const unsubscribe = transactionService.onUpdate((updatedTransactions) => {
      setTransactions(updatedTransactions);
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      try {
        await transactionService.delete(id);
      } catch (err) {
        setError('İşlem silinirken bir hata oluştu');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-4 text-center">Yükleniyor...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{error}</div>;

  return (
    <div className="space-y-3">
      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 p-4">Henüz işlem bulunmamaktadır.</div>
      ) : (
        transactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="p-4 border rounded-lg shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{transaction.description || 'Açıklama yok'}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {transaction.category} • {new Date(transaction.date).toLocaleDateString('tr-TR')}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}{' '}
                  {transaction.amount.toLocaleString('tr-TR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })} {transaction.currency}
                </div>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;