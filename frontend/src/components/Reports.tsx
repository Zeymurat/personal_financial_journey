import React from 'react';
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';
import { mockMonthlyReports } from '../data/mockData';

const Reports: React.FC = () => {
  const currentMonth = mockMonthlyReports[0];
  const previousMonth = mockMonthlyReports[1];

  const incomeChange = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100;
  const expenseChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
  const netIncomeChange = ((currentMonth.netIncome - previousMonth.netIncome) / previousMonth.netIncome) * 100;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Raporlar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Finansal performansınızı analiz edin</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Calendar className="w-5 h-5" />
            <span>Dönem Seç</span>
          </button>
          <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200">
            <Download className="w-5 h-5" />
            <span>Rapor İndir</span>
          </button>
        </div>
      </div>

      {/* Current Month Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bu Ay Özeti - {currentMonth.month}</h2>
          <div className="flex items-center space-x-2 text-green-600">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Genel Trend: Pozitif</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{currentMonth.income.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gelir</p>
            <p className={`text-xs font-medium mt-1 ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% (önceki ay)
            </p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{currentMonth.expenses.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gider</p>
            <p className={`text-xs font-medium mt-1 ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% (önceki ay)
            </p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{currentMonth.netIncome.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Gelir</p>
            <p className={`text-xs font-medium mt-1 ${netIncomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netIncomeChange >= 0 ? '+' : ''}{netIncomeChange.toFixed(1)}% (önceki ay)
            </p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₺{currentMonth.investmentGain.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Yatırım Kazancı</p>
            <p className="text-xs font-medium text-green-600 mt-1">Bu ay</p>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income vs Expenses Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gelir vs Gider Trendi</h3>
          <div className="space-y-4">
            {mockMonthlyReports.slice(0, 6).map((report, index) => {
              const maxValue = Math.max(report.income, report.expenses);
              const incomePercentage = (report.income / maxValue) * 100;
              const expensePercentage = (report.expenses / maxValue) * 100;
              
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{report.month}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Net: ₺{report.netIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-green-600 w-12">Gelir</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${incomePercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-20">
                        ₺{report.income.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-red-600 w-12">Gider</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${expensePercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-20">
                        ₺{report.expenses.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Investment Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yatırım Performansı</h3>
          <div className="space-y-4">
            {mockMonthlyReports.slice(0, 6).map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{report.month}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Yatırım getirisi</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    report.investmentGain >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {report.investmentGain >= 0 ? '+' : ''}₺{report.investmentGain.toLocaleString()}
                  </p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    report.investmentGain >= 0 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {report.investmentGain >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <BarChart3 className="w-3 h-3 mr-1" />
                    )}
                    {report.investmentGain >= 0 ? 'Kazanç' : 'Kayıp'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Monthly Report */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Aylık Detaylı Rapor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gelir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Gider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Net Gelir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Yatırım Kazancı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tasarruf Oranı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockMonthlyReports.map((report, index) => {
                const savingsRate = ((report.netIncome / report.income) * 100).toFixed(1);
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">{report.month}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">₺{report.income.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 font-semibold">₺{report.expenses.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-blue-600 font-semibold">₺{report.netIncome.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${
                        report.investmentGain >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {report.investmentGain >= 0 ? '+' : ''}₺{report.investmentGain.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-gray-900 dark:text-white font-medium mr-2">{savingsRate}%</span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(parseFloat(savingsRate), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;