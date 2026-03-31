import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';

type Section4Operation = 'increase' | 'decrease';

interface CalculatorSection4Props {
  number: string;
  percentage: string;
  operation: Section4Operation;
  result: string;
  onNumberChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onOperationChange: (value: Section4Operation) => void;
}

const CalculatorSection4: React.FC<CalculatorSection4Props> = ({
  number,
  percentage,
  operation,
  result,
  onNumberChange,
  onPercentageChange,
  onOperationChange
}) => {
  const { t } = useTranslation('calculator');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
          {operation === 'increase' ? (
            <Plus className="w-5 h-5 text-white" />
          ) : (
            <Minus className="w-5 h-5 text-white" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sayıyı belirli bir yüzde olarak artırmak ya da azaltmak
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.number')}
            </label>
            <input
              type="number"
              value={number}
              onChange={(e) => onNumberChange(e.target.value)}
              placeholder="0"
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>
          <div className="pt-8">
            <span className="text-gray-600 dark:text-gray-400 font-medium">{t('s4.afterNumber')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Yüzde
            </label>
            <div className="relative">
              <input
                type="number"
                value={percentage}
                onChange={(e) => onPercentageChange(e.target.value)}
                placeholder="0"
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                %
              </span>
            </div>
          </div>
          <div className="pt-8">
            <select
              value={operation}
              onChange={(e) => onOperationChange(e.target.value as Section4Operation)}
              className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
            >
              <option value="increase">{t('s4.increase')}</option>
              <option value="decrease">{t('s4.decrease')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('common.result')}
          </label>
          <input
            type="text"
            value={result}
            readOnly
            placeholder={t('common.resultPlaceholder')}
            className="w-full p-3 border-2 border-orange-200 dark:border-orange-800 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 dark:text-white font-bold text-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default CalculatorSection4;

