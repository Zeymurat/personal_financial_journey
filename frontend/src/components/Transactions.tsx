import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Edit, Trash2, Calendar, Eye, Download, TrendingUp, Loader2 } from 'lucide-react';
import { Transaction } from '../types';
import { transactionAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const Transactions: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesFilter && matchesDate;
  });
  console.log("currentUser",currentUser)
  // Veri yükleme
  useEffect(() => {
    if (currentUser) {
      loadTransactions();
    }
  }, [currentUser]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionAPI.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('İşlemler yüklenirken hata:', error);
      // Hata durumunda kullanıcıya bilgi ver
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const AddTransactionModal = () => {
    const [formData, setFormData] = useState({
      type: 'expense' as 'income' | 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });

    const categories = {
      income: ['Maaş', 'Freelance', 'Yatırım', 'Bonus', 'Kira Geliri', 'Diğer Gelir'],
      expense: ['Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Teknoloji', 'Giyim', 'Diğer Gider']
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const newTransactionData = {
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          currency: 'TRY'
        };

        const result = await transactionAPI.create(newTransactionData);
        
        // Yeni işlemi listeye ekle
        const newTransaction: Transaction = {
          id: result.id || Date.now().toString(),
          ...newTransactionData
        };
        
        setTransactions([newTransaction, ...transactions]);
        setShowAddModal(false);
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('İşlem eklenirken hata:', error);
        alert('İşlem eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Yeni İşlem Ekle</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Gelir veya gider işlemi ekleyin</p>
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
                İşlem Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'income'})}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === 'income'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <ArrowUpRight className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-semibold">Gelir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'expense'})}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === 'expense'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <ArrowDownRight className="w-6 h-6 mx-auto mb-2" />
                  <span className="font-semibold">Gider</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Miktar (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full p-4 text-xl font-bold border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                required
              >
                <option value="">Kategori Seçin</option>
                {categories[formData.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Açıklama
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                placeholder="İşlem açıklaması"
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

  const TransactionDetailModal = () => {
    if (!selectedTransaction) return null;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">İşlem Detayları</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Detaylı işlem bilgileri</p>
            </div>
            <button
              onClick={() => setSelectedTransaction(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
              <div className={`p-4 rounded-2xl shadow-lg ${
                selectedTransaction.type === 'income' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                  : 'bg-gradient-to-r from-rose-500 to-red-600'
              }`}>
                {selectedTransaction.type === 'income' ? (
                  <ArrowUpRight className="w-8 h-8 text-white" />
                ) : (
                  <ArrowDownRight className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white text-xl">
                  {selectedTransaction.description}
                </p>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">
                  {selectedTransaction.type === 'income' ? 'Gelir İşlemi' : 'Gider İşlemi'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Tutar</p>
                <p className={`text-2xl font-black ${
                  selectedTransaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {selectedTransaction.type === 'income' ? '+' : '-'}₺{selectedTransaction.amount.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Kategori</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedTransaction.category}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Tarih</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {new Date(selectedTransaction.date).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-6">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Para Birimi</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {selectedTransaction.currency} - Türk Lirası
              </p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Düzenle</span>
              </button>
              <button className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2">
                <Trash2 className="w-5 h-5" />
                <span>Sil</span>
              </button>
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
              İşlemler
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
              Gelir ve giderlerinizi yönetin
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 font-semibold">
              <Download className="w-5 h-5" />
              <span>Dışa Aktar</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni İşlem</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Toplam Gelir</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">₺{totalIncome.toLocaleString()}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">+12.5% bu ay</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                <ArrowUpRight className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 backdrop-blur-sm rounded-3xl p-8 border border-rose-200/50 dark:border-rose-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Toplam Gider</p>
                <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-2">₺{totalExpense.toLocaleString()}</p>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">-8.2% bu ay</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl shadow-lg">
                <ArrowDownRight className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Net Durum</p>
                <p className={`text-3xl font-black mt-2 ${
                  totalIncome - totalExpense >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  ₺{(totalIncome - totalExpense).toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">+15.8% bu ay</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">İşlem Sayısı</p>
                <p className="text-3xl font-black text-violet-700 dark:text-violet-300 mt-2">{filteredTransactions.length}</p>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mt-1">Bu dönem</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0 lg:space-x-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="İşlem ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white w-full sm:w-64 transition-all duration-200"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                >
                  <option value="all">Tüm İşlemler</option>
                  <option value="income">Gelir</option>
                  <option value="expense">Gider</option>
                </select>
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
              >
                <option value="all">Tüm Tarihler</option>
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Tüm İşlemler</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {loading ? 'Yükleniyor...' : `${filteredTransactions.length} işlem gösteriliyor`}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>Son güncelleme: {loading ? 'Yükleniyor...' : 'Bugün'}</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    İşlem
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                          İşlemler yükleniyor...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                          Henüz işlem bulunmuyor
                        </h3>
                        <p className="text-slate-500 dark:text-slate-500 mb-4">
                          İlk işleminizi ekleyerek başlayın
                        </p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          <span>İlk İşlemi Ekle</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-2xl mr-4 shadow-lg ${
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
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                              ID: {transaction.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div>
                          <p className="text-lg font-black text-slate-900 dark:text-white">
                            {new Date(transaction.date).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {new Date(transaction.date).toLocaleDateString('tr-TR', { weekday: 'long' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div>
                          <span className={`text-xl font-black ${
                            transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString()}
                          </span>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                            {transaction.currency}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="text-emerald-600 hover:text-emerald-800 transition-colors p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button className="text-rose-600 hover:text-rose-800 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAddModal && <AddTransactionModal />}
        {selectedTransaction && <TransactionDetailModal />}
      </div>
    </div>
  );
};

export default Transactions;