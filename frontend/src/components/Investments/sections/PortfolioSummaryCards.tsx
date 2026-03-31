import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Target } from 'lucide-react';

interface PortfolioSummaryCardsProps {
  totalInvested: number;
  totalValue: number;
  totalGain: number;
  totalGainPercentage: number;
  activePositionCount: number;
  roi: number;
}

const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({
  totalInvested,
  totalValue,
  totalGain,
  totalGainPercentage,
  activePositionCount,
  roi
}) => {
  const { t } = useTranslation('investments');

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('portfolio.totalCost')}</p>
            <p className="text-2xl font-black mt-2 text-amber-700 dark:text-amber-300 leading-tight">₺{totalInvested.toLocaleString()}</p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{t('portfolio.totalPrincipal')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg flex-shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('portfolio.totalValue')}</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2 leading-tight">₺{totalValue.toLocaleString()}</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">{t('portfolio.currentMarketValue')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div
        className={`backdrop-blur-sm rounded-3xl pl-8 pr-2 py-8 border shadow-xl hover:shadow-2xl transition-all duration-300 ${
          totalGain >= 0
            ? 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30'
            : 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200/50 dark:border-rose-700/30'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-bold uppercase tracking-wide ${
                totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {t('portfolio.totalGainLoss')}
            </p>
            <p
              className={`text-2xl font-black mt-2 leading-tight ${
                totalGain >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {totalGain >= 0 ? '+' : ''}₺{totalGain.toLocaleString()}
            </p>
            <p
              className={`text-sm font-bold mt-1 ${
                totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {totalGainPercentage >= 0 ? '+' : ''}
              {totalGainPercentage.toFixed(2)}%
            </p>
          </div>
          <div
            className={`p-2 rounded-xl shadow-lg flex-shrink-0 ${
              totalGain >= 0 ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-rose-100 dark:bg-rose-900'
            }`}
          >
            {totalGain >= 0 ? (
              <TrendingUp className="w-4 h-4  text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{t('portfolio.totalPositions')}</p>
            <p className="text-2xl font-black text-violet-700 dark:text-violet-300 mt-2 leading-tight">{activePositionCount}</p>
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-1">{t('portfolio.activePositionsHint')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
            <PieChart className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-3xl pl-8 pr-4 py-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('portfolio.roi')}</p>
            <p className={`text-2xl font-black mt-2 leading-tight ${roi >= 0 ? 'text-amber-700 dark:text-amber-300' : 'text-red-600 dark:text-red-400'}`}>
              {roi >= 0 ? '+' : ''}
              {roi.toFixed(2)}%
            </p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">{t('portfolio.roiHint')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg flex-shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummaryCards;
