import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hash } from 'lucide-react';
import { formatTrMoneyInput, formatTrPercentageInput, formatTrFixedTwoFromEnDecimal } from '../../../utils/trNumberInput';

interface CalculatorSection5Props {
  percentage: string;
  value: string;
  result: string;
  onPercentageChange: (value: string) => void;
  onValueChange: (value: string) => void;
}

const CalculatorSection5: React.FC<CalculatorSection5Props> = ({
  percentage,
  value,
  result,
  onPercentageChange,
  onValueChange
}) => {
  const { t } = useTranslation('calculator');

  return (
    <div className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 border border-brand-ink/10 dark:border-brand-champagne/15 shadow-lg hover:shadow-brand transition-all duration-300 lg:col-span-2">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-brand-ink to-brand-ink-light rounded-lg">
          <Hash className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('s5.title')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s1.percentLabel')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold text-lg">
              %
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={percentage}
              onChange={(e) => onPercentageChange(formatTrPercentageInput(e.target.value))}
              placeholder="0"
              className="w-full p-3 pl-8 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-ink focus:border-brand-ink dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 block">{t('s5.percentSuffix')}</span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.value')}
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => onValueChange(formatTrMoneyInput(e.target.value))}
            placeholder="0"
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-ink focus:border-brand-ink dark:bg-gray-700 dark:text-white transition-all"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 mt-1 block">{t('s5.valueHint')}</span>
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

export default CalculatorSection5;

