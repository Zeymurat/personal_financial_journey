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
      <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-3xl pl-8 pr-4 py-8 border border-brand-ink/10 dark:border-brand-champagne/15 shadow-brand hover:shadow-brand-lg transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark uppercase tracking-wide">{t('portfolio.totalCost')}</p>
            <p className="text-2xl font-black mt-2 text-brand-ink dark:text-brand-champagne leading-tight">₺{totalInvested.toLocaleString()}</p>
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark mt-1">{t('portfolio.totalPrincipal')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-3xl pl-8 pr-4 py-8 border border-brand-ink/15 dark:border-brand-ink-light/30 shadow-brand hover:shadow-brand-lg transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark uppercase tracking-wide">{t('portfolio.totalValue')}</p>
            <p className="text-2xl font-black text-brand-ink dark:text-brand-champagne mt-2 leading-tight">₺{totalValue.toLocaleString()}</p>
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark mt-1">{t('portfolio.currentMarketValue')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div
        className={`backdrop-blur-sm rounded-3xl pl-8 pr-2 py-8 border shadow-brand hover:shadow-brand-lg transition-all duration-300 ${
          totalGain >= 0
            ? 'bg-brand-surface dark:bg-brand-surface-dark border-brand-ink/10 dark:border-brand-champagne/15'
            : 'bg-brand-surface dark:bg-brand-surface-dark border-brand-ink/10 dark:border-brand-champagne/15'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-bold uppercase tracking-wide ${
                totalGain >= 0 ? 'text-brand-ink dark:text-brand-champagne-dark' : 'text-rose-600 dark:text-rose-400'
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
                totalGain >= 0 ? 'text-brand-ink dark:text-brand-champagne-dark' : 'text-rose-600 dark:text-rose-400'
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
              <TrendingUp className="w-4 h-4  text-brand-ink dark:text-brand-champagne-dark" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-3xl pl-8 pr-4 py-8 border border-brand-ink/15 dark:border-brand-ink-light/30 shadow-brand hover:shadow-brand-lg transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark uppercase tracking-wide">{t('portfolio.totalPositions')}</p>
            <p className="text-2xl font-black text-brand-ink dark:text-brand-champagne mt-2 leading-tight">{activePositionCount}</p>
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark mt-1">{t('portfolio.activePositionsHint')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <PieChart className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-3xl pl-8 pr-4 py-8 border border-brand-ink/10 dark:border-brand-champagne/15 shadow-brand hover:shadow-brand-lg transition-all duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark uppercase tracking-wide">{t('portfolio.roi')}</p>
            <p className={`text-2xl font-black mt-2 leading-tight ${roi >= 0 ? 'text-brand-ink dark:text-brand-champagne' : 'text-red-600 dark:text-red-400'}`}>
              {roi >= 0 ? '+' : ''}
              {roi.toFixed(2)}%
            </p>
            <p className="text-sm font-bold text-brand-ink dark:text-brand-champagne-dark mt-1">{t('portfolio.roiHint')}</p>
          </div>
          <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-xl shadow-lg flex-shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummaryCards;
