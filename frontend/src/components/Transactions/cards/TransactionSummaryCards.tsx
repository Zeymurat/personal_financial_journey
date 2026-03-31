import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPercentage } from '../utils';

interface TransactionSummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  thisMonthNet: number;
  thisMonthTransactionCount: number;
  totalNetWorth: number;
  incomePercentageChange: number;
  expensePercentageChange: number;
  netPercentageChange: number;
  netChangeAmount: number;
}

const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  thisMonthNet,
  thisMonthTransactionCount,
  totalNetWorth,
  incomePercentageChange,
  expensePercentageChange,
  netPercentageChange,
  netChangeAmount
}) => {
  const { t } = useTranslation('transactions');

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-emerald-200/50 dark:border-emerald-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{t('summary.totalIncome')}</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2 leading-tight">₺{totalIncome.toLocaleString()}</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatPercentage(incomePercentageChange)} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg flex-shrink-0">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-rose-200/50 dark:border-rose-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">{t('summary.totalExpense')}</p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2 leading-tight">₺{totalExpense.toLocaleString()}</p>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatPercentage(expensePercentageChange)} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl shadow-lg flex-shrink-0">
            <ArrowDownRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('summary.monthlyStatus')}</p>
            <p
              className={`text-2xl font-black mt-2 leading-tight ${
                thisMonthNet >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              ₺{thisMonthNet.toLocaleString()}
            </p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
              {formatPercentage(netPercentageChange)} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t('summary.transactionCount')}</p>
            <p className="text-2xl font-black text-violet-700 dark:text-violet-300 mt-2 leading-tight">{thisMonthTransactionCount}</p>
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-1">{t('summary.thisMonth')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 pb-3 border border-amber-200/50 dark:border-amber-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('summary.netStatus')}</p>
            <p
              className={`text-2xl font-black mt-2 leading-tight ${
                totalNetWorth >= 0 ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              ₺{totalNetWorth.toLocaleString()}
            </p>
            <p
              className={`text-xs font-bold mt-1 ${
                netChangeAmount >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netChangeAmount >= 0 ? '+' : ''}₺{netChangeAmount.toLocaleString()} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummaryCards;
