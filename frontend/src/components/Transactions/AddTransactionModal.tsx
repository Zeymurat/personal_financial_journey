import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction } from '../../types';
import { transactionAPI } from '../../services/apiService';
import { getExchangeRates } from '../../services/currencyService';
import { altinkaynakAPI } from '../../services/apiService';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionAdded: (transaction: Transaction) => void;
}

const CURRENCIES = [
  { code: 'TRY', name: 'TRY (₺)' },
  { code: 'USD', name: 'USD ($)' },
  { code: 'EUR', name: 'EUR (€)' },
  { code: 'GBP', name: 'GBP (£)' },
  { code: 'JPY', name: 'JPY (¥)' },
  { code: 'CHF', name: 'CHF' },
  { code: 'AUD', name: 'AUD' },
  { code: 'CAD', name: 'CAD' },
  { code: 'CNY', name: 'CNY' }
];

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onTransactionAdded
}) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    currency: 'TRY'
  });

  const categories = {
    income: ['Maaş', 'Freelance', 'Yatırım', 'Bonus', 'Kira Geliri', 'Diğer Gelir'],
    expense: ['Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Teknoloji', 'Giyim', 'Diğer Gider']
  };

  // Döviz kurlarını yükle ve TL karşılığını hesapla - Altınkaynak API kullan
  const calculateAmountInTRY = async (amount: number, currency: string): Promise<number> => {
    if (currency === 'TRY') {
      return amount;
    }
    
    try {
      // Önce Altınkaynak API'sinden dene
      try {
        const altinkaynakData = await altinkaynakAPI.getMain();
        if (altinkaynakData?.success && altinkaynakData?.data?.exchange_rates) {
          const rateData = altinkaynakData.data.exchange_rates[currency];
          const rate = rateData?.rate || rateData?.buy || 0;
          if (rate && rate > 0) {
            return amount * rate;
          }
        }
      } catch (altinkaynakError) {
        console.warn('Altınkaynak API hatası, Firestore\'a fallback:', altinkaynakError);
      }
      
      // Fallback: Firestore
      const rates = await getExchangeRates('TRY');
      const rate = rates[currency]?.rate;
      if (!rate || rate === 0) {
        console.warn(`Döviz kuru bulunamadı: ${currency}, varsayılan değer kullanılıyor`);
        return amount;
      }
      // rate değeri "1 [currency] = rate TRY" formatında (örn: 1 USD = 30 TRY ise rate = 30)
      return amount * rate;
    } catch (error) {
      console.error('Döviz kuru hesaplanırken hata:', error);
      // Hata durumunda varsayılan kurlar
      const defaultRates: Record<string, number> = {
        'USD': 30,
        'EUR': 29,
        'GBP': 37,
        'JPY': 0.20,
        'CHF': 32,
        'AUD': 20,
        'CAD': 22,
        'CNY': 4.2
      };
      const defaultRate = defaultRates[currency] || 1;
      return amount * defaultRate;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(formData.amount);
      // O günkü kur ile TL karşılığını hesapla
      const amountInTRY = await calculateAmountInTRY(amount, formData.currency);
      
      const newTransactionData = {
        type: formData.type,
        amount: amount,
        category: formData.category,
        description: formData.description,
        date: formData.date,
        currency: formData.currency,
        amountInTRY: amountInTRY // O günkü kur ile hesaplanmış TL karşılığı
      };

      const result = await transactionAPI.create(newTransactionData);
      
      // Yeni işlemi listeye ekle
      const newTransaction: Transaction = {
        id: result.id || Date.now().toString(),
        ...newTransactionData
      };
      
      onTransactionAdded(newTransaction);
      onClose();
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        currency: 'TRY'
      });
    } catch (error) {
      console.error('İşlem eklenirken hata:', error);
      alert('İşlem eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 !mt-0 !mb-0"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Yeni İşlem Ekle</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gelir veya gider işlemi ekleyin</p>
          </div>
          <button
            onClick={onClose}
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
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50'
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
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50'
                }`}
              >
                <ArrowDownRight className="w-6 h-6 mx-auto mb-2" />
                <span className="font-semibold">Gider</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1.3fr] gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Miktar
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
                Döviz
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                required
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>{currency.name}</option>
                ))}
              </select>
            </div>
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
              onClick={onClose}
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

export default AddTransactionModal;

