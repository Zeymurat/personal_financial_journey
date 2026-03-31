import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';

interface CalculatorSection2Props {
  number1: string;
  number2: string;
  result: string;
  onNumber1Change: (value: string) => void;
  onNumber2Change: (value: string) => void;
}

const CalculatorSection2: React.FC<CalculatorSection2Props> = ({
  number1,
  number2,
  result,
  onNumber1Change,
  onNumber2Change
}) => {
  const { t } = useTranslation('calculator');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
          <ArrowUpDown className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('s2.title')}</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.firstNumber')}
            </label>
            <input
              type="number"
              value={number1}
              onChange={(e) => onNumber1Change(e.target.value)}
              placeholder="0"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="pt-8">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('s2.firstSuffix')}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              İkinci Sayı
            </label>
            <input
              type="number"
              value={number2}
              onChange={(e) => onNumber2Change(e.target.value)}
              placeholder="0"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="pt-8">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('s2.secondSuffix')}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s2.resultPercent')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={result}
              readOnly
              placeholder={t('common.resultPlaceholder')}
              className="w-full p-3 border-2 border-purple-200 dark:border-purple-800 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-white font-bold text-lg pr-10"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600 dark:text-purple-400 font-bold">
              %
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorSection2;

