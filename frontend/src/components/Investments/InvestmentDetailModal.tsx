import React from 'react';
import { History } from 'lucide-react';
import { Investment } from '../../types';

interface InvestmentDetailModalProps {
  investment: Investment | null;
  onClose: () => void;
}

const InvestmentDetailModal: React.FC<InvestmentDetailModalProps> = ({
  investment,
  onClose
}) => {
  if (!investment) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">
              {investment.symbol} - {investment.name}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg font-medium">Yatırım Detayları ve İşlem Geçmişi</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/30">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Toplam Değer</p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">
              ₺{investment.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/30">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Ortalama Maliyet</p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
              ₺{investment.averagePrice.toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-700/30">
            <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Güncel Fiyat</p>
            <p className="text-3xl font-black text-violet-700 dark:text-violet-300 mt-2">
              ₺{investment.currentPrice.toLocaleString()}
            </p>
          </div>
          <div className={`rounded-2xl p-6 border ${
            investment.profitLoss >= 0 
              ? 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30'
              : 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200/50 dark:border-rose-700/30'
          }`}>
            <p className={`text-sm font-bold uppercase tracking-wide ${
              investment.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              Kazanç/Kayıp
            </p>
            <p className={`text-3xl font-black mt-2 ${
              investment.profitLoss >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}>
              {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()}
            </p>
            <p className={`text-sm font-bold mt-1 ${
              investment.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {investment.profitLossPercentage >= 0 ? '+' : ''}{investment.profitLossPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center">
            <History className="w-6 h-6 mr-3" />
            İşlem Geçmişi
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-600 rounded-xl">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider rounded-tl-xl">
                    Tarih
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    İşlem Türü
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Birim Fiyat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Toplam Tutar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider rounded-tr-xl">
                    Komisyon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                {investment.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        transaction.type === 'buy' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                      }`}>
                        {transaction.type === 'buy' ? 'ALIŞ' : 'SATIŞ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                      ₺{transaction.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                      ₺{transaction.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      ₺{transaction.fees || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailModal;

