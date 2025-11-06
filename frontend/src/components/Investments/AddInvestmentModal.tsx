import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Coins, Gem, DollarSign, X, Search, AlertCircle, Loader2 } from 'lucide-react';
import { fundsAPI } from '../../services/apiService';

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}

interface StockData {
  code: string;
  name: string;
  last_price: number;
  rate: number;
  volume: number;
  high: number;
  low: number;
  time: string;
  icon?: string;
}

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (formData: {
    symbol: string;
    name: string;
    type: 'currency' | 'gold' | 'preciousMetal' | 'fund' | 'stock' | 'crypto';
    transactionType: 'buy' | 'sell';
    quantity: string;
    price: string;
    date: string;
  }) => void;
  // Tüm veri kaynakları (selected değil, tümü)
  allCurrencies?: CurrencyRate[];
  allFunds?: Array<{ key: string; value: string }>;
  allStocks?: StockData[];
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allCurrencies = [],
  allFunds = [],
  allStocks = []
}) => {
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock' as 'currency' | 'gold' | 'preciousMetal' | 'fund' | 'stock' | 'crypto',
    transactionType: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [fundPriceLoading, setFundPriceLoading] = useState(false);
  const [fundPriceInfo, setFundPriceInfo] = useState<{
    needsApiRequest: boolean;
    quota?: { remaining: number; request_count: number };
  } | null>(null);

  // Seçilen türe göre tüm mevcut seçenekleri filtrele
  const getAvailableOptions = () => {
    let options: Array<{ code: string; name: string }> = [];

    switch (formData.type) {
      case 'currency':
        // Tüm döviz kurları (TRY hariç)
        options = allCurrencies
          .filter(c => c.code !== 'TRY' && c.type === 'currency')
          .map(c => ({ code: c.code, name: c.name }));
        break;
      
      case 'gold':
        // Tüm altın fiyatları
        options = allCurrencies
          .filter(c => c.type === 'gold')
          .map(c => ({ code: c.code, name: c.name }));
        break;
      
      case 'preciousMetal':
        // Tüm değerli metaller
        options = allCurrencies
          .filter(c => c.type === 'metal')
          .map(c => ({ code: c.code, name: c.name }));
        break;
      
      case 'fund':
        // Tüm yatırım fonları
        options = allFunds.map(f => ({ code: f.key, name: f.value }));
        break;
      
      case 'stock':
        // Tüm hisse senetleri
        options = allStocks.map(s => ({ code: s.code, name: s.name }));
        break;
      
      case 'crypto':
        // Tüm kripto paralar
        options = allCurrencies
          .filter(c => c.type === 'crypto')
          .map(c => ({ code: c.code, name: c.name }));
        break;
    }

    // Arama sorgusuna göre filtrele
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      options = options.filter(opt => 
        opt.code.toLowerCase().includes(query) || 
        opt.name.toLowerCase().includes(query)
      );
    }

    return options;
  };

  const availableOptions = getAvailableOptions();

  // Seçilen değere göre sembol ve ismi güncelle
  const handleValueSelect = (code: string, name: string) => {
    setFormData({
      ...formData,
      symbol: code,
      name: name
    });
    setSearchQuery(`${code} - ${name}`);
    setShowDropdown(false);
    
    // Eğer fon seçildiyse fiyat kontrolü yap
    if (formData.type === 'fund') {
      checkFundPrice(code, formData.date);
    } else {
      setFundPriceInfo(null);
    }
  };
  
  // Fon fiyat kontrolü
  const checkFundPrice = async (fundCode: string, date: string) => {
    if (formData.type !== 'fund') return;
    
    setFundPriceLoading(true);
    setFundPriceInfo(null);
    
    try {
      const response = await fundsAPI.checkFundPrice(fundCode, date);
      
      if (response.success) {
        if (response.has_price && response.price) {
          // Fiyat bulundu, otomatik doldur
          setFormData(prev => ({
            ...prev,
            price: response.price.toString()
          }));
          setFundPriceInfo({
            needsApiRequest: false,
            quota: response.quota
          });
        } else if (response.needs_api_request) {
          // API isteği gerekli
          setFundPriceInfo({
            needsApiRequest: true,
            quota: response.quota
          });
        }
      }
    } catch (error) {
      console.error('Fon fiyat kontrolü hatası:', error);
      setFundPriceInfo({
        needsApiRequest: true,
        quota: { remaining: 0, request_count: 10 }
      });
    } finally {
      setFundPriceLoading(false);
    }
  };
  
  // Fiyat doldur butonu (API'den çek)
  const handleFetchPrice = async () => {
    if (!formData.symbol || formData.type !== 'fund') return;
    
    setFundPriceLoading(true);
    
    try {
      const response = await fundsAPI.getFundDetail(formData.symbol, formData.date);
      
      if (response.success && response.data) {
        const data = response.data.data || response.data;
        const topList = data.topList || [];
        const lineValues = data.lineValues || [];
        
        let price: number | null = null;
        
        // Güncel tarih için topList'ten fiyat al
        const today = new Date().toISOString().split('T')[0];
        if (formData.date === today) {
          for (const item of topList) {
            if (item.key === 'Son Fiyat (TL)') {
              try {
                const valueStr = String(item.value).replace(',', '.').trim();
                price = parseFloat(valueStr);
                break;
              } catch {
                continue;
              }
            }
          }
        }
        
        // Geçmiş tarih için lineValues'tan fiyat al
        if (!price && lineValues.length > 0) {
          const targetDate = formData.date;
          for (const item of lineValues) {
            if (item.date && item.date.startsWith(targetDate)) {
              price = item.value;
              break;
            }
          }
        }
        
        if (price !== null) {
          setFormData(prev => ({
            ...prev,
            price: price!.toString()
          }));
          setFundPriceInfo({
            needsApiRequest: false,
            quota: response.quota
          });
        }
      }
    } catch (error) {
      console.error('Fiyat çekme hatası:', error);
      alert('Fiyat bilgisi alınamadı. Lütfen manuel olarak girin.');
    } finally {
      setFundPriceLoading(false);
    }
  };

  // Arama sorgusu değiştiğinde dropdown'ı göster
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
    
    // Eğer seçim yapılmışsa ve input temizlenmişse, formData'yı da temizle
    if (!value && formData.symbol) {
      setFormData({
        ...formData,
        symbol: '',
        name: ''
      });
    }
  };

  // Modal açıldığında formu sıfırla
  useEffect(() => {
    if (isOpen) {
      setFormData({
        symbol: '',
        name: '',
        type: 'stock',
        transactionType: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setSearchQuery('');
      setShowDropdown(false);
    }
  }, [isOpen]);

  // Yatırım türü değiştiğinde arama sorgusunu temizle
  useEffect(() => {
    setSearchQuery('');
    setFormData(prev => ({ ...prev, symbol: '', name: '', price: '' }));
    setShowDropdown(false);
    setFundPriceInfo(null);
  }, [formData.type]);
  
  // Tarih değiştiğinde fon fiyat kontrolü yap
  useEffect(() => {
    if (formData.type === 'fund' && formData.symbol) {
      checkFundPrice(formData.symbol, formData.date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && formData.symbol && formData.name) {
      onSubmit(formData);
    }
    setFormData({
      symbol: '',
      name: '',
      type: 'stock',
      transactionType: 'buy',
      quantity: '',
      price: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSearchQuery('');
    setShowDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Yeni Yatırım İşlemi</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Portföyünüze yeni işlem ekleyin</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* İşlem Türü (Alış/Satış) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              İşlem Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, transactionType: 'buy'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.transactionType === 'buy'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <TrendingUp className="w-6 h-6 mx-auto mb-2" />
                <span className="font-semibold">Alış</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, transactionType: 'sell'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.transactionType === 'sell'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <TrendingDown className="w-6 h-6 mx-auto mb-2" />
                <span className="font-semibold">Satış</span>
              </button>
            </div>
          </div>

          {/* Yatırım Türü */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Yatırım Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData({...formData, type: 'currency', symbol: '', name: ''});
                }}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                  formData.type === 'currency'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <DollarSign className="w-5 h-5 mx-auto mb-1" />
                <span className="font-semibold">Döviz</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({...formData, type: 'gold', symbol: '', name: ''});
                }}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                  formData.type === 'gold'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <Coins className="w-5 h-5 mx-auto mb-1" />
                <span className="font-semibold">Altın</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({...formData, type: 'preciousMetal', symbol: '', name: ''});
                }}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                  formData.type === 'preciousMetal'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <Gem className="w-5 h-5 mx-auto mb-1" />
                <span className="font-semibold">Değerli Metal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({...formData, type: 'fund', symbol: '', name: ''});
                }}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                  formData.type === 'fund'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                <span className="font-semibold">Fon</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({...formData, type: 'stock', symbol: '', name: ''});
                }}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                  formData.type === 'stock'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                <span className="font-semibold">Hisse</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({...formData, type: 'crypto', symbol: '', name: ''});
                }}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                  formData.type === 'crypto'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                <span className="font-semibold">Kripto</span>
              </button>
            </div>
          </div>

          {/* Arama Yapılabilir Değer Seçimi */}
          <div className="relative dropdown-container">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {formData.type === 'currency' && 'Döviz'}
              {formData.type === 'gold' && 'Altın'}
              {formData.type === 'preciousMetal' && 'Değerli Metal'}
              {formData.type === 'fund' && 'Fon'}
              {formData.type === 'stock' && 'Hisse'}
              {formData.type === 'crypto' && 'Kripto'} Seçin
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder={`${formData.type === 'currency' ? 'Döviz' : formData.type === 'gold' ? 'Altın' : formData.type === 'preciousMetal' ? 'Değerli Metal' : formData.type === 'fund' ? 'Fon' : formData.type === 'stock' ? 'Hisse' : 'Kripto'} ara... (kod veya isim)`}
                className="w-full pl-10 pr-4 py-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                required
              />
              {showDropdown && availableOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {availableOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => handleValueSelect(option.code, option.name)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700 last:border-b-0"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{option.code}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{option.name}</div>
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && availableOptions.length === 0 && searchQuery.trim() && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl shadow-lg p-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sonuç bulunamadı</p>
                </div>
              )}
            </div>
            {formData.symbol && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Seçilen: <span className="font-semibold">{formData.symbol} - {formData.name}</span>
              </p>
            )}
          </div>

          {/* Varlık Adı (otomatik doldurulur, readonly) */}
          {formData.symbol && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Varlık Adı
              </label>
              <input
                type="text"
                value={formData.name}
                readOnly
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white transition-all duration-200 cursor-not-allowed"
              />
            </div>
          )}

          {/* Miktar ve Fiyat */}
          <div className="grid grid-cols-2 gap-4">
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
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {formData.transactionType === 'buy' ? 'Alış' : 'Satış'} Fiyatı (₺)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                  placeholder="150.00"
                  required
                />
                {fundPriceLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              
              {/* Fon için fiyat bilgisi ve buton */}
              {formData.type === 'fund' && formData.symbol && fundPriceInfo && (
                <div className="mt-2">
                  {fundPriceInfo.needsApiRequest ? (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                            Bu fon için fiyat bilgisi bulunamadı. Sorgulama gerekli. Elle Giriş Yapılabilir.
                          </p>
                          {fundPriceInfo.quota && (
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                              Kalan sorgu hakkı: {fundPriceInfo.quota.remaining} / 10
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleFetchPrice}
                            disabled={fundPriceLoading || (fundPriceInfo.quota && fundPriceInfo.quota.remaining === 0)}
                            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 text-sm font-semibold"
                          >
                            {fundPriceLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                                Yükleniyor...
                              </>
                            ) : (
                              'Fiyat Doldur'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Fiyat otomatik olarak dolduruldu
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              İşlem Tarihi
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
              disabled={!formData.symbol || !formData.name}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {formData.transactionType === 'buy' ? 'Alış İşlemi Ekle' : 'Satış İşlemi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvestmentModal;
