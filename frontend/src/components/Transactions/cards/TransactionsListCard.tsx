import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Eye,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Transaction } from '../../../types';
import { getCurrencySymbol } from '../utils';

export type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last30days' | 'custom';

interface TransactionsListCardProps {
  loading: boolean;
  sortedTransactions: Transaction[];
  paginatedTransactions: Transaction[];
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterType: 'all' | 'income' | 'expense';
  onFilterTypeChange: (value: 'all' | 'income' | 'expense') => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (value: DateFilterType) => void;
  customDateStart: string;
  onCustomDateStartChange: (value: string) => void;
  customDateEnd: string;
  onCustomDateEndChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  allCategories: string[];
  sortField: 'date' | 'amount' | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'date' | 'amount') => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  totalPages: number;
  onShowAddModal: () => void;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const TransactionsListCard: React.FC<TransactionsListCardProps> = ({
  loading,
  sortedTransactions,
  paginatedTransactions,
  searchTerm,
  onSearchTermChange,
  filterType,
  onFilterTypeChange,
  dateFilter,
  onDateFilterChange,
  customDateStart,
  onCustomDateStartChange,
  customDateEnd,
  onCustomDateEndChange,
  categoryFilter,
  onCategoryFilterChange,
  allCategories,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalPages,
  onShowAddModal,
  onView,
  onEdit,
  onDelete
}) => {
  const { t, i18n } = useTranslation('transactions');
  const locale = i18n.language;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-2xl">
      <div className="px-8 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('list.title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {loading
                ? t('list.subtitleLoading')
                : t('list.showingCount', { count: sortedTransactions.length })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('list.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white w-48 transition-all duration-200"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => onFilterTypeChange(e.target.value as 'all' | 'income' | 'expense')}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
              >
                <option value="all">{t('list.filterAll')}</option>
                <option value="income">{t('labels.income')}</option>
                <option value="expense">{t('labels.expense')}</option>
              </select>
            </div>

            <select
              value={dateFilter}
              onChange={(e) => {
                const value = e.target.value as DateFilterType;
                onDateFilterChange(value);
                if (value !== 'custom') {
                  onCustomDateStartChange('');
                  onCustomDateEndChange('');
                }
              }}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
            >
              <option value="all">{t('list.dateAll')}</option>
              <option value="today">{t('list.today')}</option>
              <option value="week">{t('list.week')}</option>
              <option value="month">{t('list.month')}</option>
              <option value="last30days">{t('list.last30days')}</option>
              <option value="custom">{t('list.customRange')}</option>
            </select>

            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => onCustomDateStartChange(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                />
                <span className="text-slate-500 dark:text-slate-400">-</span>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => onCustomDateEndChange(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                />
              </div>
            )}

            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
            >
              <option value="all">{t('list.allCategories')}</option>
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto" data-table-container>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('list.colTransaction')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('list.colCategory')}
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => onSort('date')}
                  className="flex items-center space-x-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <span>{t('list.colDate')}</span>
                  {sortField === 'date' ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  ) : (
                    <div className="w-4 h-4 opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => onSort('amount')}
                  className="flex items-center space-x-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <span>{t('list.colAmount')}</span>
                  {sortField === 'amount' ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  ) : (
                    <div className="w-4 h-4 opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </th>
              <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('list.colActions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">{t('list.loading')}</span>
                  </div>
                </td>
              </tr>
            ) : sortedTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-12 text-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">{t('list.emptyTitle')}</h3>
                    <p className="text-slate-500 dark:text-slate-500 mb-4">{t('list.emptyHint')}</p>
                    <button
                      type="button"
                      onClick={onShowAddModal}
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{t('list.firstAdd')}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`p-3 rounded-2xl mr-4 shadow-lg ${
                          transaction.type === 'income'
                            ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                            : 'bg-gradient-to-r from-rose-500 to-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="w-4 h-4 text-white" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">{transaction.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {new Date(transaction.date).toLocaleDateString(locale)}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        ({new Date(transaction.date).toLocaleDateString(locale, { weekday: 'long' })})
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex flex-row items-center space-x-2">
                        <span
                          className={`text-xl font-black ${
                            transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {getCurrencySymbol(transaction.currency)}
                          {transaction.amount.toLocaleString()}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{transaction.currency}</p>
                      </div>
                      {transaction.currency !== 'TRY' && (
                        <div className="flex flex-row items-center space-x-2">
                          <span
                            className={`text-sm font-black ${
                              transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            ₺ {transaction.amountInTRY?.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => onView(transaction)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(transaction)}
                        className="text-emerald-600 hover:text-emerald-800 transition-colors p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(transaction)}
                        className="text-rose-600 hover:text-rose-800 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sortedTransactions.length > 0 && (
        <div className="px-8 py-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {t('pagination.totalRecords', { count: sortedTransactions.length })}
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  onItemsPerPageChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {t('pagination.perPage', { count: n })}
                  </option>
                ))}
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
                {t('pagination.pageOf', { current: currentPage, total: totalPages })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsListCard;
