import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

type InvestmentSummary = {
  buyTotal: number;
  sellTotal: number;
  totalGain: number;
};

type Props = {
  formatMonthYear: (d: Date) => string;
  currentDate: Date;
  trendColor: string;
  generalTrend: 'positive' | 'negative';
  currentMonthIncome: number;
  incomeChange: number;
  currentMonthExpenses: number;
  expenseChange: number;
  currentMonthNetIncome: number;
  netIncomeChange: number;
  investmentData: InvestmentSummary;
};

const ReportsCurrentMonthSummary: React.FC<Props> = ({
  formatMonthYear,
  currentDate,
  trendColor,
  generalTrend,
  currentMonthIncome,
  incomeChange,
  currentMonthExpenses,
  expenseChange,
  currentMonthNetIncome,
  netIncomeChange,
  investmentData
}) => {
  const { t, i18n } = useTranslation('reports');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  const trendLabel =
    generalTrend === 'positive' ? t('summary.trendPositive') : t('summary.trendNegative');

  return (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {t('summary.title', { month: formatMonthYear(currentDate) })}
      </h2>
      <div className={`flex items-center space-x-2 ${trendColor}`}>
        {generalTrend === 'positive' ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <TrendingDown className="w-5 h-5" />
        )}
        <span className="font-medium">{t('summary.trendLabel')} {trendLabel}</span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <div className="text-center">
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          ₺{currentMonthIncome.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('summary.income')}</p>
        <p className={`text-xs font-medium mt-1 ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% {t('summary.vsPrevMonth')}
        </p>
      </div>

      <div className="text-center">
        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          ₺{currentMonthExpenses.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('summary.expense')}</p>
        <p className={`text-xs font-medium mt-1 ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% {t('summary.vsPrevMonth')}
        </p>
      </div>

      <div className="text-center">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          ₺{currentMonthNetIncome.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('summary.netIncome')}</p>
        <p className={`text-xs font-medium mt-1 ${netIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {netIncomeChange >= 0 ? '+' : ''}{netIncomeChange.toFixed(1)}% {t('summary.vsPrevMonth')}
        </p>
      </div>

      <div className="text-center">
        <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <p
          className={`text-2xl font-bold ${investmentData.buyTotal >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-rose-600 dark:text-rose-400'}`}
        >
          {investmentData.buyTotal >= 0 ? '+' : ''}₺
          {Math.abs(investmentData.buyTotal).toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('summary.assetBuyCost')}</p>
      </div>

      <div className="text-center">
        <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <p
          className={`text-2xl font-bold ${investmentData.sellTotal >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-rose-600 dark:text-rose-400'}`}
        >
          {investmentData.sellTotal >= 0 ? '+' : ''}₺
          {Math.abs(investmentData.sellTotal).toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('summary.assetSellGain')}</p>
      </div>

      <div className="text-center">
        <div
          className={`p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center ${
            investmentData.totalGain >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
          }`}
        >
          <TrendingUp
            className={`w-8 h-8 ${
              investmentData.totalGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          />
        </div>
        <p
          className={`text-2xl font-bold ${
            investmentData.totalGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {investmentData.totalGain >= 0 ? '+' : ''}₺
          {investmentData.totalGain.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('summary.investmentGain')}</p>
        <p
          className={`text-xs font-medium mt-1 ${
            investmentData.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {investmentData.totalGain >= 0 ? t('summary.gain') : t('summary.loss')}
        </p>
      </div>
    </div>
  </div>
  );
};

export default ReportsCurrentMonthSummary;
