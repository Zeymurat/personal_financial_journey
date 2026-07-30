import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Activity } from 'lucide-react';
import PageHeader from '../../common/PageHeader';

interface DashboardHeaderProps {
  totalNetWorth: number;
  totalInvestmentValue: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalNetWorth,
  totalInvestmentValue,
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = useMemo(() => {
    const map: Record<string, string> = {
      tr: 'tr-TR',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES',
    };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  const dateStr = new Date().toLocaleDateString(locale);

  return (
    <PageHeader
      title={t('header.title')}
      subtitle={t('header.subtitle')}
      disclaimer={t('header.disclaimer')}
      actions={
        <div className="flex flex-col items-end gap-3">
          <div className="elite-panel text-right p-6 min-w-[220px]">
            <p className="text-[11px] text-gold font-semibold uppercase tracking-[0.14em]">
              {t('header.totalNetWorth')}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-foreground mt-2">
              ₺{(totalNetWorth + totalInvestmentValue).toLocaleString(locale)}
            </p>
            <div className="flex items-center justify-end mt-2">
              <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                <Activity className="w-4 h-4 mr-1" />
                <span>{t('header.totalAssets')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 mr-2 text-gold" />
            <span>{t('header.lastUpdate', { date: dateStr })}</span>
          </div>
        </div>
      }
    />
  );
};

export default DashboardHeader;
