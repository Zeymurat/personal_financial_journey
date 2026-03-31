import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Edit, Trash2, Loader2 } from 'lucide-react';
import { ModalPortal } from '../../common/ModalPortal';
import { Investment, InvestmentTransaction } from '../../../types';
import EditInvestmentTransactionModal from './EditInvestmentTransactionModal';
import DeleteInvestmentTransactionModal from './DeleteInvestmentTransactionModal';
import { getInvestmentTransactions } from '../../../services/investmentService';

interface InvestmentDetailModalProps {
  investment: Investment | null;
  onClose: () => void;
  onUpdateTransaction?: (investmentId: string, transactionId: string, updates: Partial<InvestmentTransaction>) => Promise<void>;
  onDeleteTransaction?: (investmentId: string, transactionId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

const InvestmentDetailModal: React.FC<InvestmentDetailModalProps> = ({
  investment,
  onClose,
  onUpdateTransaction,
  onDeleteTransaction,
  onRefresh
}) => {
  const { t, i18n } = useTranslation('investments');
  const [editingTransaction, setEditingTransaction] = useState<InvestmentTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<InvestmentTransaction | null>(null);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Modal açıldığında transactions'ları yükle
  useEffect(() => {
    if (investment && investment.id) {
      const loadTransactions = async () => {
        setLoadingTransactions(true);
        try {
          const loadedTransactions = await getInvestmentTransactions(investment.id);
          setTransactions(loadedTransactions);
        } catch (error) {
          console.error('İşlem geçmişi yüklenirken hata:', error);
          setTransactions([]);
        } finally {
          setLoadingTransactions(false);
        }
      };
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [investment]);

  if (!investment) return null;

  // Transactions'lardan investment bilgilerini hesapla (gerçek zamanlı güncelleme için)
  const calculateInvestmentStats = () => {
    let totalQuantity = 0;
    let totalCost = 0;

    transactions.forEach(transaction => {
      if (transaction.type === 'buy') {
        totalQuantity += transaction.quantity;
        totalCost += transaction.totalAmount;
      } else {
        // Satış işlemlerinde
        totalQuantity -= transaction.quantity;
        // Satış tutarını çıkar (basit yaklaşım, FIFO daha doğru olurdu)
        totalCost -= transaction.totalAmount;
      }
    });

    const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const currentPrice = investment.currentPrice || 0;
    const totalValue = totalQuantity * currentPrice;
    const profitLoss = totalValue - totalCost;
    const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      quantity: totalQuantity,
      totalCost,
      averagePrice,
      currentPrice,
      totalValue,
      profitLoss,
      profitLossPercentage
    };
  };

  const calculatedStats = calculateInvestmentStats();

  const handleUpdateTransaction = async (investmentId: string, transactionId: string, updates: Partial<InvestmentTransaction>) => {
    if (onUpdateTransaction) {
      await onUpdateTransaction(investmentId, transactionId, updates);
      // Transactions'ları yeniden yükle
      const loadedTransactions = await getInvestmentTransactions(investmentId);
      setTransactions(loadedTransactions);
      if (onRefresh) {
        await onRefresh();
      }
    }
  };

  const handleDeleteTransaction = async (investmentId: string, transactionId: string) => {
    if (onDeleteTransaction) {
      await onDeleteTransaction(investmentId, transactionId);
      // Transactions'ları yeniden yükle
      const loadedTransactions = await getInvestmentTransactions(investmentId);
      setTransactions(loadedTransactions);
      if (onRefresh) {
        await onRefresh();
      }
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-[90rem] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {investment.symbol} - {investment.name}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg font-medium">{t('investmentDetail.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('investmentDetail.totalValue')}</p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">
              ₺{calculatedStats.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/30">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('investmentDetail.principal')}</p>
            <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-2">
              ₺{calculatedStats.totalCost.toLocaleString()}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('investmentDetail.principalHint')}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/30">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{t('investmentDetail.avgCost')}</p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
              ₺{calculatedStats.averagePrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-700/30">
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t('investmentDetail.currentPrice')}</p>
            <p className="text-3xl font-black text-violet-700 dark:text-violet-300 mt-2">
              ₺{calculatedStats.currentPrice.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-2xl p-6 border ${
            calculatedStats.profitLoss >= 0 
              ? 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30'
              : 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200/50 dark:border-rose-700/30'
          }`}>
            <p className={`text-sm font-bold uppercase tracking-wide ${
              calculatedStats.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {t('investmentDetail.profitLoss')}
            </p>
            <p className={`text-3xl font-black mt-2 ${
              calculatedStats.profitLoss >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}>
              {calculatedStats.profitLoss >= 0 ? '+' : ''}₺{calculatedStats.profitLoss.toLocaleString()}
            </p>
            <p className={`text-sm font-bold mt-1 ${
              calculatedStats.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {calculatedStats.profitLossPercentage >= 0 ? '+' : ''}{calculatedStats.profitLossPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
            <History className="w-6 h-6 mr-3" />
            {t('investmentDetail.historyTitle')}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-600 rounded-xl">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider rounded-tl-xl">
                    {t('investmentDetail.colDate')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t('investmentDetail.colType')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t('investmentDetail.colQty')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t('investmentDetail.colUnit')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t('investmentDetail.colTotal')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    {t('investmentDetail.colFees')}
                  </th>
                  {(onUpdateTransaction || onDeleteTransaction) && (
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider rounded-tr-xl">
                      {t('investmentDetail.colActions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {loadingTransactions ? (
                  <tr>
                    <td colSpan={onUpdateTransaction || onDeleteTransaction ? 7 : 6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                      <p className="text-slate-500 dark:text-slate-400 mt-4">{t('investmentDetail.loadingHistory')}</p>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={onUpdateTransaction || onDeleteTransaction ? 7 : 6} className="px-6 py-12 text-center">
                      <p className="text-slate-500 dark:text-slate-400">{t('investmentDetail.emptyHistory')}</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString(i18n.language, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        transaction.type === 'buy' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                      }`}>
                        {transaction.type === 'buy' ? t('types.buyUpper') : t('types.sellUpper')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      ₺{transaction.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                      ₺{transaction.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      ₺{transaction.fees || 0}
                    </td>
                    {(onUpdateTransaction || onDeleteTransaction) && (
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {onUpdateTransaction && (
                            <button
                              onClick={() => setEditingTransaction(transaction)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title={t('table.tooltipEdit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteTransaction && (
                            <button
                              onClick={() => setTransactionToDelete(transaction)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title={t('table.tooltipDelete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Transaction Modal */}
        {onUpdateTransaction && (
          <EditInvestmentTransactionModal
            transaction={editingTransaction}
            investmentId={investment.id}
            isOpen={!!editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onUpdate={handleUpdateTransaction}
          />
        )}

        {/* Delete Transaction Modal */}
        {onDeleteTransaction && (
          <DeleteInvestmentTransactionModal
            transaction={transactionToDelete}
            investmentId={investment.id}
            isOpen={!!transactionToDelete}
            onClose={() => setTransactionToDelete(null)}
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

export default InvestmentDetailModal;

