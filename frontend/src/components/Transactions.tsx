import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Calendar, Eye, Download, TrendingUp, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction } from '../types';
import { transactionAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import { getExchangeRates } from '../services/currencyService';
import { tcmbAPI } from '../services/apiService';
import AddTransactionModal from './Transactions/AddTransactionModal';
import EditTransactionModal from './Transactions/EditTransactionModal';
import TransactionDetailModal from './Transactions/TransactionDetailModal';
import DeleteConfirmationModal from './Transactions/DeleteConfirmationModal';
import QuickActions from './Transactions/QuickActions';

const Transactions: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Token doğrulama - Geçersiz token durumunda login sayfasına yönlendirir
  useTokenValidation();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, { rate: number }>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  // Döviz kurlarını TCMB'den yükle
  useEffect(() => {
    const loadRates = async () => {
      console.log("💱 Transactions: Döviz kurları yükleniyor...");
      try {
        // Önce TCMB API'sinden dene
        try {
          console.log("💰 Transactions: TCMB API çağrılıyor...");
          const tcmbData = await tcmbAPI.getMain();
          
          if (tcmbData?.success && tcmbData?.data?.exchange_rates) {
            console.log("✅ Transactions: TCMB verisi alındı!");
            const rateMap: Record<string, { rate: number }> = {};
            
            // TCMB verilerini formatla
            Object.entries(tcmbData.data.exchange_rates).forEach(([code, rateData]: [string, any]) => {
              rateMap[code] = { 
                rate: rateData.rate || rateData.buy || 0 
              };
            });
            
            // TRY'yi ekle (base currency)
            rateMap['TRY'] = { rate: 1 };
            
            console.log("📊 Transactions: Formatlanmış kurlar:", rateMap);
            setExchangeRates(rateMap);
            return;
          }
        } catch (tcmbError) {
          console.warn("⚠️ Transactions: TCMB API hatası, Firestore'a fallback yapılıyor:", tcmbError);
        }
        
        // Fallback: Firestore'dan oku
        console.log("📚 Transactions: Firestore'dan kurlar okunuyor...");
        const rates = await getExchangeRates('TRY');
        const rateMap: Record<string, { rate: number }> = {};
        Object.keys(rates).forEach(code => {
          rateMap[code] = { rate: rates[code].rate };
        });
        setExchangeRates(rateMap);
        console.log("✅ Transactions: Firestore kurları yüklendi");
      } catch (error) {
        console.error('❌ Transactions: Döviz kurları yüklenirken hata:', error);
        // Hata durumunda varsayılan kurlar (TR yaklaşık değerler - 1 birim = kaç TRY)
        console.warn("⚠️ Transactions: Varsayılan kurlar kullanılıyor");
        setExchangeRates({
          'TRY': { rate: 1 },
          'USD': { rate: 30 }, // 1 USD = 30 TRY yaklaşık
          'EUR': { rate: 29 }, // 1 EUR = 29 TRY yaklaşık
          'GBP': { rate: 37 },
          'JPY': { rate: 0.20 }, // 1 JPY = 0.20 TRY yaklaşık (100 JPY = 20 TRY)
          'CHF': { rate: 32 },
          'AUD': { rate: 20 },
          'CAD': { rate: 22 },
          'CNY': { rate: 4.2 } // 1 CNY = 4.2 TRY yaklaşık
        });
      }
    };
    loadRates();
  }, []);

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

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await transactionAPI.delete(transactionToDelete.id);
      // Listeyi güncelle
      setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
      // Eğer silinen transaction detay modalında açıksa, modalı kapat
      if (selectedTransaction?.id === transactionToDelete.id) {
        setSelectedTransaction(null);
      }
      // Delete modal'ı kapat
      setShowDeleteModal(false);
      setTransactionToDelete(null);
    } catch (error) {
      console.error('İşlem silinirken hata:', error);
      alert('İşlem silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransactions(transactions.map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    ));
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  // Bu ayın başlangıç ve bitiş tarihleri
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Geçen ayın başlangıç ve bitiş tarihleri
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Para birimini TRY'ye çevir
  // Öncelikle kaydedilmiş amountInTRY değerini kullan, yoksa mevcut kur ile hesapla
  const convertToTRY = (transaction: Transaction): number => {
    // Eğer daha önce kaydedilmiş TL karşılığı varsa, onu kullan (sabit değer)
    if (transaction.amountInTRY !== undefined && transaction.amountInTRY !== null) {
      return transaction.amountInTRY;
    }

    // Geriye dönük uyumluluk için: Eğer amountInTRY yoksa, mevcut kur ile hesapla
    // (Bu, eski kayıtlar için geçici bir çözümdür)
    const currency = transaction.currency || 'TRY';
    if (currency === 'TRY') return transaction.amount;

    const rate = exchangeRates[currency]?.rate;
    if (!rate || rate === 0) {
      console.warn(`Döviz kuru bulunamadı: ${currency}, varsayılan değer kullanılıyor`);
      return transaction.amount; // Eğer kur yoksa olduğu gibi döndür
    }
    // currencyService.ts'deki mantığa göre: toCurrency === 'TRY' ise amount * rate
    // rate değeri "1 [currency] = rate TRY" formatında (örn: 1 USD = 30 TRY ise rate = 30)
    return transaction.amount * rate;
  };

  // Bu ayın gelir/gider/net durumu (Özet kartlar için) - TRY'ye çevrilmiş
  const thisMonthIncome = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'income' && tDate >= thisMonthStart && tDate <= thisMonthEnd;
    })
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const thisMonthExpense = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= thisMonthStart && tDate <= thisMonthEnd;
    })
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const thisMonthNet = thisMonthIncome - thisMonthExpense;

  // Bu ayın işlem sayısı
  const thisMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= thisMonthStart && tDate <= thisMonthEnd;
  });

  // Özet kartlar için (bu ayın verileri)
  const totalIncome = thisMonthIncome;
  const totalExpense = thisMonthExpense;

  // Tüm zamanların toplam net durumu (şimdiye kadarki tüm gelir - gider) - TRY'ye çevrilmiş
  const totalNetWorth = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + convertToTRY(t), 0) -
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertToTRY(t), 0);

  // Geçen ayın gelir/gider/net durumu - TRY'ye çevrilmiş
  const lastMonthIncome = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'income' && tDate >= lastMonthStart && tDate <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const lastMonthExpense = transactions
    .filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= lastMonthStart && tDate <= lastMonthEnd;
    })
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const lastMonthNet = lastMonthIncome - lastMonthExpense;

  // Yüzde değişimi hesapla
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomePercentageChange = calculatePercentageChange(thisMonthIncome, lastMonthIncome);
  const expensePercentageChange = calculatePercentageChange(thisMonthExpense, lastMonthExpense);
  const netPercentageChange = calculatePercentageChange(thisMonthNet, lastMonthNet);

  // Net durum değişimi (bu ay - geçen ay)
  const netChangeAmount = thisMonthNet - lastMonthNet;

  // Debug: Net durum karşılaştırması (sadece transactions değiştiğinde)
  useEffect(() => {
    console.log('📊 Net Durum Karşılaştırması:');
    console.log('  Geçen ay (lastMonthNet):', lastMonthNet.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }));
    console.log('  Bu ay (thisMonthNet):', thisMonthNet.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }));
    console.log('  Değişim (netChangeAmount):', netChangeAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  // Yüzde formatı (işaret ile)
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Currency sembolü getir
  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      'TRY': '₺',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CHF': 'CHF ',
      'AUD': 'A$',
      'CAD': 'C$',
      'CNY': '¥'
    };
    return symbols[currency] || currency;
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 backdrop-blur-sm rounded-3xl p-8 border border-emerald-200/50 dark:border-emerald-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Toplam Gelir</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">₺{totalIncome.toLocaleString()}</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatPercentage(incomePercentageChange)} bu ay
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg">
                <ArrowUpRight className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 backdrop-blur-sm rounded-3xl p-8 border border-rose-200/50 dark:border-rose-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Toplam Gider</p>
                <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-2">₺{totalExpense.toLocaleString()}</p>
                <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mt-1">
                  {formatPercentage(expensePercentageChange)} bu ay
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-rose-500 to-red-600 rounded-2xl shadow-lg">
                <ArrowDownRight className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-3xl p-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Aylık Durum</p>
                <p className={`text-3xl font-black mt-2 ${thisMonthNet >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'
                  }`}>
                  ₺{thisMonthNet.toLocaleString()}
                </p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {formatPercentage(netPercentageChange)} bu ay
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-3xl p-8 border border-violet-200/50 dark:border-violet-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">İşlem Sayısı</p>
                <p className="text-3xl font-black text-violet-700 dark:text-violet-300 mt-2">{thisMonthTransactions.length}</p>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mt-1">Bu ay</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Net Durum</p>
                <p className={`text-3xl font-black mt-2 ${totalNetWorth >= 0 ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'
                  }`}>
                  ₺{totalNetWorth.toLocaleString()}
                </p>
                <p className={`text-sm font-semibold mt-1 ${netChangeAmount >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                  {netChangeAmount >= 0 ? '+' : ''}₺{netChangeAmount.toLocaleString()} bu ay
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" />
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

        {/* Quick Actions */}
        <QuickActions onTransactionAdded={handleTransactionAdded} />

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
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-2xl mr-4 shadow-lg ${transaction.type === 'income'
                              ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                              : 'bg-gradient-to-r from-rose-500 to-red-600'
                            }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="w-4 h-4 text-white" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            {/* <p className="text-lg font-black text-slate-900 dark:text-white"> */}
                            <p className="text-sm md:text-base font-semibold text-slate-900 dark:text-white">
                              {transaction.description}
                            </p>
                            {/* <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                              ID: {transaction.id}
                            </p> */}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {new Date(transaction.date).toLocaleDateString('tr-TR')}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            ({new Date(transaction.date).toLocaleDateString('tr-TR', { weekday: 'long' })})
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex flex-row items-center space-x-2">
                            <span className={`text-xl font-black ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {getCurrencySymbol(transaction.currency)}
                              {transaction.amount.toLocaleString()}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                              {transaction.currency}
                            </p>
                          </div>
                          {transaction.currency !== 'TRY' && (
                          <div className="flex flex-row items-center space-x-2">
                            <span className={`text-sm font-black ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                             ₺ {transaction.amountInTRY?.toLocaleString()}
                            </span>
                          </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(transaction)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(transaction)}
                            className="text-rose-600 hover:text-rose-800 transition-colors p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl"
                          >
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

        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTransactionAdded={handleTransactionAdded}
        />
        <EditTransactionModal
          isOpen={showEditModal}
          transaction={editingTransaction}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onTransactionUpdated={handleTransactionUpdated}
        />
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          transaction={transactionToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setTransactionToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>
    </div>
  );
};

export default Transactions;