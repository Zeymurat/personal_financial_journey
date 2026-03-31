import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type IncomeExpenseRow = {
  month: string;
  income: number;
  expenses: number;
  netIncome: number;
};

type InvestmentMonthRow = {
  month: string;
  buyTotal: number;
  sellTotal: number;
  gain: number;
  value: number;
};

type Props = {
  monthlyIncomeExpenseData: IncomeExpenseRow[];
  monthlyInvestmentData: InvestmentMonthRow[];
};

const ReportsMonthlyTrends: React.FC<Props> = ({ monthlyIncomeExpenseData, monthlyInvestmentData }) => {
  const { t, i18n } = useTranslation('reports');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('trends.incomeVsExpense')}</h3>
        <div className="space-y-4">
          {monthlyIncomeExpenseData.map((report, index) => {
            const maxValue = Math.max(report.income, report.expenses, 1);
            const incomePercentage = (report.income / maxValue) * 100;
            const expensePercentage = (report.expenses / maxValue) * 100;

            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{report.month}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('trends.net')} ₺
                    {report.netIncome.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-green-600 w-12">{t('trends.incomeShort')}</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${incomePercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-20">
                      ₺{report.income.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-red-600 w-12">{t('trends.expenseShort')}</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${expensePercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-20">
                      ₺{report.expenses.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('trends.investmentPerformance')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('trends.month')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('trends.buyCost')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('trends.sellProceeds')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('trends.return')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('trends.value')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyInvestmentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {t('trends.noInvestmentData')}
                  </td>
                </tr>
              ) : (
                monthlyInvestmentData.map((monthData, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">{monthData.month}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-gray-900 dark:text-white font-semibold">
                        ₺{monthData.buyTotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-gray-900 dark:text-white font-semibold">
                        ₺{monthData.sellTotal.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${monthData.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthData.gain >= 0 ? '+' : ''}₺
                        {monthData.gain.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        ₺{monthData.value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsMonthlyTrends;
