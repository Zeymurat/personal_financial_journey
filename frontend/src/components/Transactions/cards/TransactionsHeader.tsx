import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TransactionsHeaderProps {
  onAddClick: () => void;
}

const TransactionsHeader: React.FC<TransactionsHeaderProps> = ({ onAddClick }) => {
  const { t } = useTranslation('transactions');

  return (
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {t('header.title')}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">{t('header.subtitle')}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-100">{t('header.disclaimer')}</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>{t('header.newTransaction')}</span>
        </button>
      </div>
    </div>
  );
};

export default TransactionsHeader;
