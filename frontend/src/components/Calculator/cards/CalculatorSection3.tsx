import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';

interface CalculatorSection3Props {
  initial: string;
  final: string;
  result: string;
  onInitialChange: (value: string) => void;
  onFinalChange: (value: string) => void;
}

const CalculatorSection3: React.FC<CalculatorSection3Props> = ({
  initial,
  final,
  result,
  onInitialChange,
  onFinalChange
}) => {
  const { t } = useTranslation('calculator');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('s3.title')}</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.initialValue')}
            </label>
            <input
              type="number"
              value={initial}
              onChange={(e) => onInitialChange(e.target.value)}
              placeholder="0"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="pt-8">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('s3.suffix1')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.finalValue')}
            </label>
            <input
              type="number"
              value={final}
              onChange={(e) => onFinalChange(e.target.value)}
              placeholder="0"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="pt-8">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('s3.suffix2')}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s3.resultLabel')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={result}
              readOnly
              placeholder={t('common.resultPlaceholder')}
              className={`w-full p-3 border-2 rounded-xl font-bold text-lg pr-10 transition-all ${
                result && parseFloat(result) >= 0
                  ? 'border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-white'
                  : 'border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 dark:text-white'
              }`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 font-bold">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorSection3;

