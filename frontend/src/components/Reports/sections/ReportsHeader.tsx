import React from 'react';
import { useTranslation } from 'react-i18next';

const ReportsHeader: React.FC = () => {
  const { t } = useTranslation('reports');
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('header.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('header.subtitle')}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-100">{t('header.disclaimer')}</p>
      </div>
    </div>
  );
};

export default ReportsHeader;
