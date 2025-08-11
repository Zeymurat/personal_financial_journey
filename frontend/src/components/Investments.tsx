import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Plus, DollarSign, PieChart, Calendar, Eye, History, BarChart3, Target } from 'lucide-react';
import { mockInvestments } from '../data/mockData';
import { Investment, InvestmentTransaction } from '../types';

const Investments: React.FC = () => {
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalValue = mockInvestments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalGain = mockInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0);
  const totalGainPercentage = (totalGain / (totalValue - totalGain)) * 100;

  const stockInvestments = mockInvestments.filter(inv => inv.type === 'stock');
  const cryptoInvestments = mockInvestments.filter(inv => inv.type === 'crypto');

  const AddInvestmentModal = () => {
    const [formData, setFormData] = useState({
      symbol: '',
      name: '',
      type: 'stock' as 'stock' | 'crypto',
      quantity: '',
      price: '',
      date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Add investment logic would go here
      setShowAddModal(false);
      setFormData({
        symbol: '',
        name: '',
        type: 'stock',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Yeni Yatırım Ekle</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Portföyünüze yeni varlık ekleyin</p>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Yatırım Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'stock'})}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === 'stock'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-semibold">Hisse Senedi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'crypto'})}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === 'crypto'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-semibold">Kripto Para</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Sembol
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                  className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                  placeholder="AAPL"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Miktar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Şirket/Varlık Adı
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                placeholder="Apple Inc."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Alış Fiyatı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                  placeholder="150.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
              >
                Ekle
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const InvestmentDetailModal = () => {
    if (!selectedInvestment) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                {selectedInvestment.symbol} - {selectedInvestment.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg font-medium">Yatırım Detayları ve İşlem Geçmişi</p>
            </div>
            <button
              onClick={() => setSelectedInvestment(null)}
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
                ₺{selectedInvestment.totalValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/30">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Ortalama Maliyet</p>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
                ₺{selectedInvestment.averagePrice.toLocaleString()}
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-700/30">
              <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Güncel Fiyat</p>
              <p className="text-3xl font-black text-violet-700 dark:text-violet-300 mt-2">
                ₺{selectedInvestment.currentPrice.toLocaleString()}
              </p>
            </div>
            <div className={`rounded-2xl p-6 border ${
              selectedInvestment.profitLoss >= 0 
                ? 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30'
                : 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200/50 dark:border-rose-700/30'
            }`}>
              <p className={`text-sm font-bold uppercase tracking-wide ${
                selectedInvestment.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                Kazanç/Kayıp
              </p>
              <p className={`text-3xl font-black mt-2 ${
                selectedInvestment.profitLoss >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}>
                {selectedInvestment.profitLoss >= 0 ? '+' : ''}₺{selectedInvestment.profitLoss.toLocaleString()}
              </p>
              <p className={`text-sm font-bold mt-1 ${
                selectedInvestment.profitLoss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {selectedInvestment.profitLossPercentage >= 0 ? '+' : ''}{selectedInvestment.profitLossPercentage.toFixed(2)}%
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
                  {selectedInvestment.transactions.map((transaction, index) => (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Yatırım Portföyü
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
              Yatırımlarınızı takip edin ve analiz edin
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Yatırım</span>
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Toplam Portföy Değeri</p>
                <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">₺{totalValue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className={`backdrop-blur-sm rounded-3xl p-8 border shadow-xl hover:shadow-2xl transition-all duration-300 ${
            totalGain >= 0 
              ? 'bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-700/30'
              : 'bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200/50 dark:border-rose-700/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold uppercase tracking-wide ${
                  totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  Toplam Kazanç/Kayıp
                </p>
                <p className={`text-3xl font-black mt-2 ${
                  totalGain >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {totalGain >= 0 ? '+' : ''}₺{totalGain.toLocaleString()}
                </p>
                <p className={`text-sm font-bold mt-1 ${
                  totalGain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {totalGainPercentage >= 0 ? '+' : ''}{totalGainPercentage.toFixed(2)}%
                </p>
              </div>
              <div className={`p-4 rounded-2xl shadow-lg ${
                totalGain >= 0 ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-rose-100 dark:bg-rose-900'
              }`}>
                {totalGain >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Toplam Pozisyon</p>
                <p className="text-3xl font-black text-violet-700 dark:text-violet-300 mt-2">{mockInvestments.length}</p>
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400 mt-1">Aktif yatırım</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                <PieChart className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Ortalama ROI</p>
                <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-2">+{(totalGainPercentage / mockInvestments.length).toFixed(1)}%</p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">Yıllık bazda</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Investment Categories */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Stocks */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Hisse Senetleri</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Borsa yatırımları</p>
              </div>
              <span className="text-sm font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full">
                {stockInvestments.length} pozisyon
              </span>
            </div>
            <div className="space-y-4">
              {stockInvestments.map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-lg">{investment.symbol}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{investment.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">{investment.quantity} adet</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white text-lg">₺{investment.totalValue.toLocaleString()}</p>
                      <p className={`text-sm font-bold ${investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()} 
                        ({investment.profitLossPercentage.toFixed(2)}%)
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedInvestment(investment)}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Crypto */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Kripto Para</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Dijital varlıklar</p>
              </div>
              <span className="text-sm font-bold bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full">
                {cryptoInvestments.length} pozisyon
              </span>
            </div>
            <div className="space-y-4">
              {cryptoInvestments.map((investment) => (
                <div key={investment.id} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-2xl transition-all duration-300 hover:scale-102 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-lg">{investment.symbol}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{investment.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-1">{investment.quantity} adet</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white text-lg">₺{investment.totalValue.toLocaleString()}</p>
                      <p className={`text-sm font-bold ${investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()} 
                        ({investment.profitLossPercentage.toFixed(2)}%)
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedInvestment(investment)}
                      className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Investment Table */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Detaylı Portföy</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Tüm yatırımlarınızın detaylı görünümü</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>Son güncelleme: Bugün</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Varlık
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tür
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Miktar
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ortalama Fiyat
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Güncel Fiyat
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Toplam Değer
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kazanç/Kayıp
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {mockInvestments.map((investment) => (
                  <tr key={investment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{investment.symbol}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{investment.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        investment.type === 'stock' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {investment.type === 'stock' ? 'Hisse' : 'Kripto'}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-lg font-bold text-slate-900 dark:text-white">
                      {investment.quantity}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-lg font-bold text-slate-900 dark:text-white">
                      ₺{investment.averagePrice.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">₺{investment.currentPrice.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Güncel</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-lg font-black text-slate-900 dark:text-white">
                      ₺{investment.totalValue.toLocaleString()}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-right">
                        <p className={`text-lg font-black ${
                          investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {investment.profitLoss >= 0 ? '+' : ''}₺{investment.profitLoss.toLocaleString()}
                        </p>
                        <p className={`text-sm font-bold ${
                          investment.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {investment.profitLossPercentage >= 0 ? '+' : ''}{investment.profitLossPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedInvestment(investment)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="text-slate-600 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">
                          <History className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedInvestment && <InvestmentDetailModal />}
        {showAddModal && <AddInvestmentModal />}
      </div>
    </div>
  );
};

export default Investments;