import { useState, useEffect } from 'react';
import { transactionAPI, investmentAPI, investmentTransactionAPI } from '../../../services/apiService';
import type { Transaction } from '../../../types';
import { mapTransactionFromApi } from '../../Dashboard/utils/mapTransactionFromApi';

export function useReportsData(currentUserId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [investmentTransactions, setInvestmentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);

        const transactionsResponse = await transactionAPI.getAll();
        if (transactionsResponse?.success && Array.isArray(transactionsResponse.data)) {
          const transactionsData = transactionsResponse.data.map(mapTransactionFromApi);
          setTransactions(transactionsData);
        }

        const investmentsResponse = await investmentAPI.getAll();
        if (investmentsResponse?.success && Array.isArray(investmentsResponse.data)) {
          setInvestments(investmentsResponse.data);

          const allInvestmentTransactions: any[] = [];
          for (const investment of investmentsResponse.data) {
            try {
              const transResponse = await investmentTransactionAPI.getByInvestment(
                investment.id || investment._id
              );
              if (transResponse?.success && Array.isArray(transResponse.data)) {
                const transactionsWithInvestmentId = transResponse.data.map((trans: any) => ({
                  ...trans,
                  investmentId: investment.id || investment._id
                }));
                allInvestmentTransactions.push(...transactionsWithInvestmentId);
              }
            } catch (error) {
              console.error(`Investment ${investment.id} transaction'ları yüklenirken hata:`, error);
            }
          }
          setInvestmentTransactions(allInvestmentTransactions);
        }
      } catch (error) {
        console.error('Rapor verileri yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentUserId]);

  return { transactions, investments, investmentTransactions, loading };
}
