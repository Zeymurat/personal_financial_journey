import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import { formatTrIntegerInput, formatTrFromEnOptionalKurus } from '../../../utils/trNumberInput';

interface CalculatorSection6Props {
  creditLimit: string;
  statementBalance: string;
  minPayment: string;
  appliedRatePercent: string;
  onCreditLimitChange: (value: string) => void;
  onStatementBalanceChange: (value: string) => void;
}

const CalculatorSection6: React.FC<CalculatorSection6Props> = ({
  creditLimit,
  statementBalance,
  minPayment,
  appliedRatePercent,
  onCreditLimitChange,
  onStatementBalanceChange
}) => {
  const { t } = useTranslation('calculator');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 lg:col-span-2">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('s6.title')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s6.creditLimit')}
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={creditLimit}
            onChange={(e) => onCreditLimitChange(formatTrIntegerInput(e.target.value))}
            placeholder="0"
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s6.statementBalance')}
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={statementBalance}
            onChange={(e) => onStatementBalanceChange(formatTrIntegerInput(e.target.value))}
            placeholder="0"
            className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s6.appliedRate')}
          </label>
          <input
            type="text"
            value={appliedRatePercent ? `${appliedRatePercent}%` : ''}
            readOnly
            placeholder="—"
            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/40 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('s6.minPayment')}
          </label>
          <input
            type="text"
            value={minPayment ? formatTrFromEnOptionalKurus(minPayment) : ''}
            readOnly
            placeholder={t('common.resultPlaceholder')}
            className="w-full p-3 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 dark:text-white font-bold text-lg"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('s6.disclaimer')}</p>
    </div>
  );
};

export default CalculatorSection6;
