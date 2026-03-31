import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Transaction } from '../../../types';

interface DashboardRecentTransactionsProps {
  loading: boolean;
  recentTransactions: Transaction[];
  convertToTRY: (transaction: Transaction) => number;
}

const DashboardRecentTransactions: React.FC<DashboardRecentTransactionsProps> = ({
  loading,
  recentTransactions,
  convertToTRY
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  return (
    <div className="xl:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('recent.title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{t('recent.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'transactions' }))}
          className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105"
        >
          {t('recent.seeAll')}
        </button>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('recent.loading')}</div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">{t('recent.empty')}</div>
        ) : (
          recentTransactions.map((transaction) => {
            const amount = convertToTRY(transaction);
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                      transaction.type === 'income'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                        : 'bg-gradient-to-r from-rose-500 to-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowDownRight className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                      {transaction.description || t('recent.noDescription')}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400 font-semibold">
                        {transaction.category || t('recent.noCategory')}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(transaction.date).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-black text-xl ${
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}₺{amount.toLocaleString(locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DashboardRecentTransactions;
