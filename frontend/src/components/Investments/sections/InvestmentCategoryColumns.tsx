import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Eye } from 'lucide-react';
import type { Investment } from '../../../types';

interface InvestmentCategoryColumnsProps {
  stockInvestments: Investment[];
  cryptoInvestments: Investment[];
  onSelectInvestment: (investment: Investment) => void;
}

const InvestmentCategoryColumns: React.FC<InvestmentCategoryColumnsProps> = ({
  stockInvestments,
  cryptoInvestments,
  onSelectInvestment
}) => {
  const { t } = useTranslation('investments');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('category.stocksFundsTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('category.stocksFundsSubtitle')}</p>
          </div>
          <span className="text-sm font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full">
            {t('category.positions', { count: stockInvestments.length })}
          </span>
        </div>
        <div className="space-y-4">
          {stockInvestments.map((investment) => {
            const displayType = (investment as Investment & { displayType?: string }).displayType || investment.type;
            let iconGradient = 'from-blue-500 to-cyan-600';
            if (displayType === 'fund') {
              iconGradient = 'from-purple-500 to-pink-600';
            } else if (displayType === 'stock') {
              iconGradient = 'from-blue-500 to-cyan-600';
            }

            return (
              <div
                key={investment.id}
                className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-4 bg-gradient-to-r ${iconGradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-lg">{investment.symbol}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{investment.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                      {t('category.units', { count: investment.quantity })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {(investment as Investment & { hasValidPrice?: boolean }).hasValidPrice !== false &&
                    investment.totalValue != null ? (
                      <>
                        <p className="font-black text-slate-900 dark:text-white text-lg">₺{investment.totalValue.toLocaleString()}</p>
                        <p
                          className={`text-sm font-bold ${
                            investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()}
                          {investment.profitLossPercentage != null && (
                            <> ({investment.profitLossPercentage.toFixed(2)}%)</>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500">-</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectInvestment(investment)}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t('category.cryptoForexTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('category.cryptoForexSubtitle')}</p>
          </div>
          <span className="text-sm font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full">
            {t('category.positions', { count: cryptoInvestments.length })}
          </span>
        </div>
        <div className="space-y-4">
          {cryptoInvestments.map((investment) => {
            const displayType = (investment as Investment & { displayType?: string }).displayType || investment.type;
            let iconGradient = 'from-yellow-500 to-orange-600';

            if (displayType === 'currency' || displayType === 'forex') {
              iconGradient = 'from-green-500 to-emerald-600';
            } else if (displayType === 'gold') {
              iconGradient = 'from-amber-500 to-yellow-600';
            } else if (displayType === 'preciousMetal') {
              iconGradient = 'from-slate-500 to-gray-600';
            } else if (displayType === 'crypto') {
              iconGradient = 'from-yellow-500 to-orange-600';
            }

            return (
              <div
                key={investment.id}
                className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-4 bg-gradient-to-r ${iconGradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-lg">{investment.symbol}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{investment.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">
                      {t('category.units', { count: investment.quantity })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {(investment as Investment & { hasValidPrice?: boolean }).hasValidPrice !== false &&
                    investment.totalValue != null ? (
                      <>
                        <p className="font-black text-slate-900 dark:text-white text-lg">₺{investment.totalValue.toLocaleString()}</p>
                        <p
                          className={`text-sm font-bold ${
                            investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()}
                          {investment.profitLossPercentage != null && (
                            <> ({investment.profitLossPercentage.toFixed(2)}%)</>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500">-</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectInvestment(investment)}
                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InvestmentCategoryColumns;
