import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Wallet, Activity } from 'lucide-react';

interface DashboardPerformanceSectionProps {
  effectiveMonthlyTarget: number;
  netIncome: number;
  remainingToTarget: number;
  monthlyTargetProgress: number;
  onEditMonthlyTarget: () => void;
  savingsRate: number;
  thisMonthIncome: number;
  savingsRateChange: number;
  investmentROI: number;
  totalInvestmentValue: number;
  totalInvestmentGain: number;
  totalSavingsTarget: number | null;
  totalNetWorth: number;
  totalSavingsProgress: number | null;
  remainingToTotalTarget: number | null;
  onEditSavingsTarget: () => void;
  onAddSavingsTarget: () => void;
}

const DashboardPerformanceSection: React.FC<DashboardPerformanceSectionProps> = ({
  effectiveMonthlyTarget,
  netIncome,
  remainingToTarget,
  monthlyTargetProgress,
  onEditMonthlyTarget,
  savingsRate,
  thisMonthIncome,
  savingsRateChange,
  investmentROI,
  totalInvestmentValue,
  totalInvestmentGain,
  totalSavingsTarget,
  totalNetWorth,
  totalSavingsProgress,
  remainingToTotalTarget,
  onEditSavingsTarget,
  onAddSavingsTarget
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  const roiLabel =
    investmentROI >= 15 ? t('performance.roiExcellent') : investmentROI >= 0 ? t('performance.roiGood') : t('performance.roiLow');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-700/30 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('performance.monthlyTarget')}</h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ₺{effectiveMonthlyTarget.toLocaleString(locale, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditMonthlyTarget}
            className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
            title={t('performance.editTargetTitle')}
          >
            {t('performance.editTarget')}
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.netIncomeThisMonth')}</span>
              <span className={`text-sm font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netIncome >= 0 ? '+' : ''}₺{netIncome.toLocaleString(locale, { maximumFractionDigits: 3 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.remainingToTarget')}</span>
              <span
                className={`text-sm font-bold ${
                  remainingToTarget === 0 ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {remainingToTarget === 0
                  ? t('performance.targetReached')
                  : `₺${remainingToTarget.toLocaleString(locale, { maximumFractionDigits: 3 })}`}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.progress')}</span>
              <span className={`text-sm font-bold ${monthlyTargetProgress > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {monthlyTargetProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(monthlyTargetProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('performance.savingsRate')}</h3>
            <p className="text-blue-600 dark:text-blue-400 font-semibold">{savingsRate.toFixed(1)}%</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.incomeThisMonth')}</span>
              <span className="text-sm font-bold text-blue-600">
                ₺{thisMonthIncome.toLocaleString(locale, { maximumFractionDigits: 3 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.netThisMonth')}</span>
              <span className={`text-sm font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netIncome >= 0 ? '+' : ''}₺{netIncome.toLocaleString(locale, { maximumFractionDigits: 3 })}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.vsLastMonthShort')}</span>
              <span className={`text-sm font-bold ${savingsRateChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {savingsRateChange >= 0 ? '+' : ''}
                {savingsRateChange.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl shadow-lg">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{t('performance.investmentRoi')}</h3>
            <p
              className={`font-semibold ${
                investmentROI >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {investmentROI >= 0 ? '+' : ''}
              {investmentROI.toFixed(2)}%
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.totalValue')}</span>
              <span className="text-sm font-bold text-violet-600">
                ₺{totalInvestmentValue.toLocaleString(locale, { maximumFractionDigits: 3 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.profitLoss')}</span>
              <span className={`text-sm font-bold ${totalInvestmentGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalInvestmentGain >= 0 ? '+' : ''}₺
                {totalInvestmentGain.toLocaleString(locale, { maximumFractionDigits: 3 })}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.performance')}</span>
              <span
                className={`text-sm font-bold ${
                  investmentROI >= 15 ? 'text-emerald-600' : investmentROI >= 0 ? 'text-violet-600' : 'text-rose-600'
                }`}
              >
                {roiLabel}
              </span>
            </div>
            <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  investmentROI >= 0
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600'
                    : 'bg-gradient-to-r from-rose-500 to-red-600'
                }`}
                style={{ width: `${Math.min(Math.max(Math.abs(investmentROI), 0), 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {totalSavingsTarget !== null && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{t('performance.savingsGoal')}</h3>
                <p className="text-amber-600 dark:text-amber-400 font-semibold">
                  ₺{totalSavingsTarget.toLocaleString(locale, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditSavingsTarget}
              className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all"
              title={t('performance.editTargetTitle')}
            >
              {t('performance.editTarget')}
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.currentSavings')}</span>
                <span className="text-sm font-bold text-amber-600">
                  ₺{(totalNetWorth + totalInvestmentValue).toLocaleString(locale, { maximumFractionDigits: 3 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.remainingToTarget')}</span>
                <span
                  className={`text-sm font-bold ${
                    remainingToTotalTarget !== null && remainingToTotalTarget === 0
                      ? 'text-emerald-600'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {remainingToTotalTarget !== null && remainingToTotalTarget === 0
                    ? t('performance.targetReached')
                    : `₺${(remainingToTotalTarget || 0).toLocaleString(locale, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('performance.progress')}</span>
                <span className="text-sm font-bold text-amber-600">
                  {totalSavingsProgress !== null ? `${totalSavingsProgress.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalSavingsProgress !== null ? Math.min(totalSavingsProgress, 100) : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {totalSavingsTarget === null && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl text-center">
          <Target className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{t('performance.setSavingsGoalTitle')}</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{t('performance.setSavingsGoalBody')}</p>
          <button
            type="button"
            onClick={onAddSavingsTarget}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            {t('performance.setGoalButton')}
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPerformanceSection;
