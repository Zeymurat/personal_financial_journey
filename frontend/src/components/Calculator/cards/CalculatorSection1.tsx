import React from 'react';
import { useTranslation } from 'react-i18next';
import { Percent } from 'lucide-react';
import { formatTrMoneyInput, formatTrPercentageInput, formatTrFixedTwoFromEnDecimal } from '../../../utils/trNumberInput';

interface CalculatorSection1Props {
  number: string;
  percentage: string;
  result: string;
  onNumberChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
}

const CalculatorSection1: React.FC<CalculatorSection1Props> = ({
  number,
  percentage,
  result,
  onNumberChange,
  onPercentageChange
}) => {
  const { t } = useTranslation('calculator');

  return (
    <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 border border-brand-ink/10 dark:border-brand-champagne/15 shadow-lg hover:shadow-brand transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-lg">
          <Percent className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('s1.title')}</h2>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.number')}
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={number}
              onChange={(e) => onNumberChange(formatTrMoneyInput(e.target.value))}
              placeholder="0"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-ink focus:border-brand-ink dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="pt-8">
            <span className="text-gray-600 dark:text-gray-400 font-medium">sayısının</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('s1.percentLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={percentage}
                onChange={(e) => onPercentageChange(formatTrPercentageInput(e.target.value))}
                placeholder="0"
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-ink focus:border-brand-ink dark:bg-gray-700 dark:text-white transition-all"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                %
              </span>
            </div>
          </div>
          <div className="pt-8">
            <span className="text-2xl font-bold text-gray-400">=</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.result')}
          </label>
          <input
            type="text"
            value={result ? formatTrFixedTwoFromEnDecimal(result) : ''}
            readOnly
            placeholder={t('common.resultPlaceholder')}
            className="w-full p-3 border-2 border-brand-champagne-dark dark:border-brand-ink-light rounded-xl bg-gradient-to-r from-brand-surface to-brand-surface-muted dark:from-brand-surface-dark dark:to-brand-surface-dark-muted dark:text-white font-bold text-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CalculatorSection1;

