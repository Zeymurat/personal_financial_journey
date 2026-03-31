import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type DetailedRow = {
  month: string;
  income: number;
  expenses: number;
  netIncome: number;
  investmentGain: number;
  savingsRate: number;
};

type Props = {
  monthlyDetailedReportData: DetailedRow[];
};

const ReportsDetailedTable: React.FC<Props> = ({ monthlyDetailedReportData }) => {
  const { t, i18n } = useTranslation('reports');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('detailed.title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('detailed.subtitle')}</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('detailed.month')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('detailed.income')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('detailed.expense')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('detailed.netIncome')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('detailed.investmentGain')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('detailed.savingsRate')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {monthlyDetailedReportData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {t('detailed.noData')}
                </td>
              </tr>
            ) : (
              monthlyDetailedReportData.map((report, index) => {
                const savingsRate = report.savingsRate.toFixed(1);
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">{report.month}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">
                        ₺{report.income.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 font-semibold">
                        ₺{report.expenses.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-blue-600 font-semibold">
                        ₺{report.netIncome.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${report.investmentGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {report.investmentGain >= 0 ? '+' : ''}₺
                        {report.investmentGain.toLocaleString(locale, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-900 dark:text-white font-medium mr-2">{savingsRate}%</span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsDetailedTable;
