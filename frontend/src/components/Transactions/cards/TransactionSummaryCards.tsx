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

const cardClass =
  'bg-brand-surface dark:bg-brand-surface-dark backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-brand-ink/10 dark:border-brand-champagne/15 shadow-brand hover:shadow-brand-lg transition-all duration-300';

const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({
  totalIncome,
  totalExpense,
  thisMonthNet,
  thisMonthTransactionCount,
  totalNetWorth,
  incomePercentageChange,
  expensePercentageChange,
  netPercentageChange,
  netChangeAmount,
}) => {
  const { t } = useTranslation('transactions');

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 uppercase tracking-wide">
              {t('summary.totalIncome')}
            </p>
            <p className="text-2xl font-black text-brand-ink dark:text-brand-champagne mt-2 leading-tight">
              ₺{totalIncome.toLocaleString()}
            </p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatPercentage(incomePercentageChange)} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <ArrowUpRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 uppercase tracking-wide">
              {t('summary.totalExpense')}
            </p>
            <p className="text-2xl font-black text-brand-ink dark:text-brand-champagne mt-2 leading-tight">
              ₺{totalExpense.toLocaleString()}
            </p>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mt-1">
              {formatPercentage(expensePercentageChange)} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-rose-600 to-red-700 rounded-xl shadow-lg flex-shrink-0">
            <ArrowDownRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 uppercase tracking-wide">
              {t('summary.monthlyStatus')}
            </p>
            <p
              className={`text-2xl font-black mt-2 leading-tight ${
                thisMonthNet >= 0
                  ? 'text-brand-ink dark:text-brand-champagne'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              ₺{thisMonthNet.toLocaleString()}
            </p>
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 mt-1">
              {formatPercentage(netPercentageChange)} {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 uppercase tracking-wide">
              {t('summary.transactionCount')}
            </p>
            <p className="text-2xl font-black text-brand-ink dark:text-brand-champagne mt-2 leading-tight">
              {thisMonthTransactionCount}
            </p>
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 mt-1">
              {t('summary.thisMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className={`${cardClass} pb-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink/70 dark:text-brand-champagne/70 uppercase tracking-wide">
              {t('summary.netStatus')}
            </p>
            <p
              className={`text-2xl font-black mt-2 leading-tight ${
                totalNetWorth >= 0
                  ? 'text-brand-ink dark:text-brand-champagne'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              ₺{totalNetWorth.toLocaleString()}
            </p>
            <p
              className={`text-xs font-bold mt-1 ${
                netChangeAmount >= 0
                  ? 'text-brand-ink/70 dark:text-brand-champagne/70'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netChangeAmount >= 0 ? '+' : ''}₺{netChangeAmount.toLocaleString()}{' '}
              {t('summary.vsPreviousMonth')}
            </p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummaryCards;
