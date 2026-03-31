import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, ArrowRight } from 'lucide-react';

interface InvestmentSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInvestments?: () => void;
}

const InvestmentSuggestionModal: React.FC<InvestmentSuggestionModalProps> = ({
  isOpen,
  onClose,
  onNavigateToInvestments
}) => {
  const { t } = useTranslation('transactions');

  if (!isOpen) return null;

  const handleNavigate = () => {
    if (onNavigateToInvestments) {
      onNavigateToInvestments();
    }
    onClose();
  };

  const area = t('investmentSuggestion.areaLabel');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('investmentSuggestion.title')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
            {t('investmentSuggestion.body', { area })}
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <span>{t('investmentSuggestion.goToInvestments')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-semibold"
            >
              {t('investmentSuggestion.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSuggestionModal;
