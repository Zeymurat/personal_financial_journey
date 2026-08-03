import { useState, useEffect } from 'react';
import { investmentTransactionAPI } from '../../../services/apiService';
import { useFinance } from '../../../contexts/FinanceContext';
import type { Transaction } from '../../../types';

export function useReportsData(currentUserId: string | undefined) {
  const {
    transactions: financeTransactions,
    investments: financeInvestments,
    loadingTransactions,
    loadingInvestments,
  } = useFinance();

  const [investmentTransactions, setInvestmentTransactions] = useState<any[]>([]);
  const [loadingInvTx, setLoadingInvTx] = useState(false);

  useEffect(() => {
    const loadInvTx = async () => {
      if (!currentUserId || !financeInvestments?.length) {
        setInvestmentTransactions([]);
        return;
      }

      try {
        setLoadingInvTx(true);
        const results = await Promise.allSettled(
          financeInvestments.map((investment) =>
            investmentTransactionAPI.getByInvestment(investment.id || (investment as any)._id)
          )
        );

        const all: any[] = [];
        results.forEach((result, index) => {
          const investment = financeInvestments[index];
          const invId = investment.id || (investment as any)._id;
          if (result.status !== 'fulfilled') return;
          const transResponse = result.value;
          if (transResponse?.success && Array.isArray(transResponse.data)) {
            all.push(
              ...transResponse.data.map((trans: any) => ({
                ...trans,
                investmentId: invId,
              }))
            );
          }
        });
        setInvestmentTransactions(all);
      } catch (error) {
        console.error('Investment transaction’ları yüklenirken hata:', error);
      } finally {
        setLoadingInvTx(false);
      }
    };

    void loadInvTx();
  }, [currentUserId, financeInvestments]);

  const transactions: Transaction[] = financeTransactions || [];
  const investments = financeInvestments || [];
  const loading =
    !!currentUserId && (loadingTransactions || loadingInvestments || loadingInvTx);

  return { transactions, investments, investmentTransactions, loading };
}
