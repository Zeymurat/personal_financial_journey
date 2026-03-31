import React from 'react';
import { useTranslation } from 'react-i18next';

const TrackCompareHeader: React.FC = () => {
  const { t } = useTranslation('trackCompare');

  return (
    <div className="space-y-2">
      <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
        {t('header.title')}
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">{t('header.subtitle')}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400 font-100">{t('header.disclaimer')}</p>
    </div>
  );
};

export default TrackCompareHeader;
