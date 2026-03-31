import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Activity } from 'lucide-react';

interface DashboardHeaderProps {
  totalNetWorth: number;
  totalInvestmentValue: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalNetWorth,
  totalInvestmentValue
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  const dateStr = new Date().toLocaleDateString(locale);

  return (
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {t('header.title')}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">{t('header.subtitle')}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-100">{t('header.disclaimer')}</p>
        <div className="flex items-center mt-4 text-sm text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{t('header.lastUpdate', { date: dateStr })}</span>
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="text-right bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">
            {t('header.totalNetWorth')}
          </p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            ₺{(totalNetWorth + totalInvestmentValue).toLocaleString(locale)}
          </p>
          <div className="flex items-center justify-end mt-2">
            <div className="flex items-center text-emerald-600 text-sm font-semibold">
              <Activity className="w-4 h-4 mr-1" />
              <span>{t('header.totalAssets')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
