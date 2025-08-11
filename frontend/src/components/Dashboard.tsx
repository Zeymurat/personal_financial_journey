import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, DollarSign, PieChart, Activity, Target, Calendar, Plus } from 'lucide-react';
import { mockTransactions, mockInvestments } from '../data/mockData';

const Dashboard: React.FC = () => {
  const totalIncome = mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netIncome = totalIncome - totalExpenses;
  
  const totalInvestmentValue = mockInvestments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalInvestmentGain = mockInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0);

  const stats = [
    {
      title: 'Toplam Gelir',
      value: `₺${totalIncome.toLocaleString()}`,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: ArrowUpRight,
      color: 'from-emerald-500 via-green-500 to-teal-600',
      bgColor: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20'
    },
    {
      title: 'Toplam Gider',
      value: `₺${totalExpenses.toLocaleString()}`,
      change: '-8.2%',
      changeType: 'negative' as const,
      icon: ArrowDownRight,
      color: 'from-rose-500 via-red-500 to-pink-600',
      bgColor: 'from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20'
    },
    {
      title: 'Net Gelir',
      value: `₺${netIncome.toLocaleString()}`,
      change: '+15.8%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-blue-500 via-indigo-500 to-purple-600',
      bgColor: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20'
    },
    {
      title: 'Yatırım Portföyü',
      value: `₺${totalInvestmentValue.toLocaleString()}`,
      change: `+₺${totalInvestmentGain.toLocaleString()}`,
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-violet-500 via-purple-500 to-indigo-600',
      bgColor: 'from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20'
    }
  ];

  const recentTransactions = mockTransactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
              Finansal durumunuzun kapsamlı özeti
            </p>
            <div className="flex items-center mt-4 text-sm text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Toplam Net Değer</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                ₺{(netIncome + totalInvestmentValue).toLocaleString()}
              </p>
              <div className="flex items-center justify-end mt-2">
                <div className="flex items-center text-emerald-600 text-sm font-semibold">
                  <Activity className="w-4 h-4 mr-1" />
                  <span>+12.3% bu ay</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className={`relative overflow-hidden bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-slate-700/30 hover:shadow-2xl hover:scale-105 transition-all duration-500 group cursor-pointer`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      stat.changeType === 'positive' 
                        ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30' 
                        : 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">bu ay</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="xl:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Son İşlemler</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Son 5 finansal işlem</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105">
                Tümünü Gör
              </button>
            </div>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                      transaction.type === 'income' 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                        : 'bg-gradient-to-r from-rose-500 to-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-lg">{transaction.description}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400 font-semibold">
                          {transaction.category}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(transaction.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-xl ${
                      transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Overview */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Yatırım Portföyü</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">En iyi performans</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-105">
                Detaylar
              </button>
            </div>
            <div className="space-y-4">
              {mockInvestments.slice(0, 4).map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                      investment.type === 'stock' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600' 
                        : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                    }`}>
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{investment.symbol}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          investment.type === 'stock' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {investment.type === 'stock' ? 'Hisse' : 'Kripto'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {investment.quantity} adet
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-slate-900 dark:text-white">
                      ₺{investment.totalValue.toLocaleString()}
                    </p>
                    <p className={`text-sm font-bold ${
                      investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()} 
                      ({investment.profitLossPercentage.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'Gelir Ekle', icon: ArrowUpRight, color: 'from-emerald-500 to-green-600', bgColor: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20' },
              { title: 'Gider Ekle', icon: ArrowDownRight, color: 'from-rose-500 to-red-600', bgColor: 'hover:bg-rose-50 dark:hover:bg-rose-900/20' },
              { title: 'Yatırım Ekle', icon: TrendingUp, color: 'from-blue-500 to-cyan-600', bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
              { title: 'Rapor Görüntüle', icon: PieChart, color: 'from-violet-500 to-purple-600', bgColor: 'hover:bg-violet-50 dark:hover:bg-violet-900/20' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className={`flex flex-col items-center p-8 bg-slate-50 dark:bg-slate-700/50 rounded-2xl ${action.bgColor} transition-all duration-300 hover:scale-105 group border border-slate-200/50 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500`}
                >
                  <div className={`p-5 rounded-2xl bg-gradient-to-r ${action.color} mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{action.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-700/30 shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Aylık Hedef</h3>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold">₺15,000</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">İlerleme</span>
                <span className="text-sm font-bold text-emerald-600">78%</span>
              </div>
              <div className="w-full bg-emerald-200 dark:bg-emerald-800 rounded-full h-3">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-500" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Tasarruf Oranı</h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold">42%</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Bu Ay</span>
                <span className="text-sm font-bold text-blue-600">+5%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Yatırım ROI</h3>
                <p className="text-violet-600 dark:text-violet-400 font-semibold">+18.5%</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Yıllık</span>
                <span className="text-sm font-bold text-violet-600">Hedefin Üstünde</span>
              </div>
              <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-3">
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;