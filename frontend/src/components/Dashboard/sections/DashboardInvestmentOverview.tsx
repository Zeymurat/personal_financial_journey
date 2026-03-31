import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

interface InvestmentRow {
  id?: string;
  _id?: string;
  symbol: string;
  quantity: number;
  type?: string;
  displayType?: string;
  totalValue?: number | null;
  profitLoss?: number | null;
  profitLossPercentage?: number | null;
  hasValidPrice?: boolean;
}

interface DashboardInvestmentOverviewProps {
  loading: boolean;
  activeInvestments: InvestmentRow[];
}

const DashboardInvestmentOverview: React.FC<DashboardInvestmentOverviewProps> = ({
  loading,
  activeInvestments
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  const typeLabel = useCallback(
    (displayType: string | undefined) => {
      const d = displayType || '';
      if (d === 'stock') return t('investmentTypes.stock');
      if (d === 'fund') return t('investmentTypes.fund');
      if (d === 'crypto') return t('investmentTypes.crypto');
      if (d === 'gold') return t('investmentTypes.gold');
      if (d === 'currency' || d === 'forex') return t('investmentTypes.currency');
      if (d === 'preciousMetal') return t('investmentTypes.preciousMetal');
      return t('investmentTypes.other');
    },
    [t]
  );

  const typeStyle = (displayType: string | undefined) => {
    const d = displayType || '';
    let typeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    let iconBgClass = 'bg-gradient-to-r from-gray-500 to-gray-600';
    if (d === 'stock' || d === 'fund') {
      typeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      iconBgClass = 'bg-gradient-to-r from-blue-500 to-cyan-600';
    } else if (d === 'crypto') {
      typeClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      iconBgClass = 'bg-gradient-to-r from-yellow-500 to-orange-600';
    } else if (d === 'gold') {
      typeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      iconBgClass = 'bg-gradient-to-r from-amber-500 to-yellow-600';
    } else if (d === 'currency' || d === 'forex') {
      typeClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      iconBgClass = 'bg-gradient-to-r from-green-500 to-emerald-600';
    } else if (d === 'preciousMetal') {
      typeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      iconBgClass = 'bg-gradient-to-r from-purple-500 to-indigo-600';
    }
    return { typeClass, iconBgClass };
  };

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{t('investmentOverview.title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('investmentOverview.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'investments' }))}
          className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105"
        >
          {t('investmentOverview.details')}
        </button>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('investmentOverview.loading')}</div>
        ) : activeInvestments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('investmentOverview.empty')}</div>
        ) : (
          activeInvestments.map((investment) => {
            const displayType = investment.displayType || investment.type;
            const { typeClass, iconBgClass } = typeStyle(displayType);
            const label = typeLabel(displayType);

            const hasValid = investment.hasValidPrice !== false;
            const tv = investment.totalValue && hasValid ? investment.totalValue : 0;
            const pl = investment.profitLoss;

            return (
              <div
                key={investment.id || investment._id}
                className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${iconBgClass}`}
                  >
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{investment.symbol}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${typeClass}`}>{label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {investment.quantity} {t('investmentOverview.units')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-slate-900 dark:text-white">
                    ₺{tv.toLocaleString(locale, { maximumFractionDigits: 3 })}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      pl && hasValid && (pl || 0) >= 0
                        ? 'text-emerald-600'
                        : pl && hasValid
                          ? 'text-rose-600'
                          : 'text-slate-500'
                    }`}
                  >
                    {pl && hasValid
                      ? `${(pl || 0) >= 0 ? '+' : ''}₺${Math.abs(pl || 0).toLocaleString(locale, {
                          maximumFractionDigits: 3
                        })}${
                          investment.profitLossPercentage !== null && investment.profitLossPercentage !== undefined
                            ? ` (${investment.profitLossPercentage.toFixed(2)}%)`
                            : ''
                        }`
                      : t('investmentOverview.noPrice')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DashboardInvestmentOverview;
