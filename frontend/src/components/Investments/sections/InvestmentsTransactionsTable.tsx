import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Investment } from '../../../types';
import { investmentTableTypeLabel } from '../utils/investmentTypeLabels';

/** Detaylı portföy tablosunda satır (işlem + yatırım özeti) */
export interface PortfolioTransactionRow {
  id: string;
  investment: Investment & { displayType?: string; name: string };
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
  date: string;
}

interface InvestmentsTransactionsTableProps {
  loadingTableTransactions: boolean;
  totalRowCount: number;
  paginatedTransactions: PortfolioTransactionRow[];
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  allInvestmentsForLookup: Investment[];
  onViewInvestment: (investment: Investment) => void;
  onEditTransaction: (payload: {
    investmentId: string;
    transactionId: string;
    transaction: PortfolioTransactionRow;
  }) => void;
  onDeleteTransaction: (payload: {
    investmentId: string;
    transactionId: string;
    transaction: PortfolioTransactionRow;
  }) => void;
}

const InvestmentsTransactionsTable: React.FC<InvestmentsTransactionsTableProps> = ({
  loadingTableTransactions,
  totalRowCount,
  paginatedTransactions,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  onPageChange,
  totalPages,
  allInvestmentsForLookup,
  onViewInvestment,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const { t, i18n } = useTranslation('investments');
  const dateLocale = i18n.language || undefined;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-2xl">
      <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('table.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('table.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full">
            <Calendar className="w-4 h-4" />
            <span>{t('table.lastUpdateToday')}</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto" data-table-container>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colAsset')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colType')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colQty')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colTradePrice')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colTradeAmount')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colTradeType')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colDate')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('table.colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loadingTableTransactions ? (
              <>
                {[...Array(itemsPerPage)].map((_, index) => (
                  <tr key={`shimmer-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="h-5 shimmer rounded w-24" />
                        <div className="h-4 shimmer rounded w-40" />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-7 shimmer rounded-full w-20" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-6 shimmer rounded w-16" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-6 shimmer rounded w-24" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-6 shimmer rounded w-28" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-7 shimmer rounded-full w-20" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-5 shimmer rounded w-24" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-8 shimmer rounded w-8" />
                    </td>
                  </tr>
                ))}
              </>
            ) : totalRowCount === 0 ? (
              <tr>
                <td colSpan={8} className="px-8 py-12 text-center text-slate-500 dark:text-slate-400">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => {
                const investment = transaction.investment;
                const totalValue = transaction.quantity * transaction.price;
                const displayType = investment.displayType || investment.type;
                const typeLabel = investmentTableTypeLabel(t, displayType);
                let typeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
                if (displayType === 'stock' || displayType === 'fund') {
                  typeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                } else if (displayType === 'crypto') {
                  typeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                } else if (displayType === 'gold') {
                  typeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
                } else if (displayType === 'currency' || displayType === 'forex') {
                  typeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                } else if (displayType === 'preciousMetal') {
                  typeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
                }

                return (
                  <tr key={`${investment.id}-${transaction.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{investment.symbol}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {investment.name.substring(0, 40)} {investment.name.length > 40 ? '...' : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${typeClass}`}>{typeLabel}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-lg font-bold text-slate-900 dark:text-white">
                      {transaction.quantity}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-lg font-bold text-slate-900 dark:text-white">
                      ₺{transaction.price.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-lg font-black text-slate-900 dark:text-white">
                      ₺{totalValue.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full ${
                          transaction.type === 'buy'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {transaction.type === 'buy' ? t('table.buyShort') : t('table.sellShort')}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(transaction.date).toLocaleDateString(dateLocale, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            const inv = allInvestmentsForLookup.find((i) => i.id === investment.id);
                            if (inv) onViewInvestment(inv);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl"
                          title={t('table.tooltipView')}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onEditTransaction({
                              investmentId: investment.id,
                              transactionId: transaction.id,
                              transaction
                            })
                          }
                          className="text-emerald-600 hover:text-emerald-800 transition-colors p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl"
                          title={t('table.tooltipEdit')}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteTransaction({
                              investmentId: investment.id,
                              transactionId: transaction.id,
                              transaction
                            })
                          }
                          className="text-rose-600 hover:text-rose-800 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl"
                          title={t('table.tooltipDelete')}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalRowCount > 0 && (
        <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t('table.totalRecords', { count: totalRowCount })}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  onItemsPerPageChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>{t('table.perPage', { count: 10 })}</option>
                <option value={25}>{t('table.perPage', { count: 25 })}</option>
                <option value={50}>{t('table.perPage', { count: 50 })}</option>
                <option value={100}>{t('table.perPage', { count: 100 })}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <span className="text-sm text-slate-600 dark:text-slate-400 ml-4">
                {t('table.pageOf', { current: currentPage, total: totalPages })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsTransactionsTable;
