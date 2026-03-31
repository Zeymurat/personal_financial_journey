import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ModalPortal } from '../../common/ModalPortal';
import { BarChart3, TrendingUp, Coins, Gem, DollarSign, X, Search, AlertCircle, Loader2, Save } from 'lucide-react';
import { Investment } from '../../../types';
import { fundsAPI } from '../../../services/apiService';

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

interface EditInvestmentModalProps {
  investment: Investment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Investment>) => Promise<void>;
  // Tüm veri kaynakları (selected değil, tümü)
  allCurrencies?: CurrencyRate[];
  allFunds?: Array<{ key: string; value: string }>;
  allStocks?: StockData[];
}

const EditInvestmentModal: React.FC<EditInvestmentModalProps> = ({
  investment,
  isOpen,
  onClose,
  onUpdate,
  allCurrencies = [],
  allFunds = [],
  allStocks = []
}) => {
  const { t } = useTranslation('investments');

  const labelForAssetType = (
    type: 'currency' | 'gold' | 'preciousMetal' | 'fund' | 'stock' | 'crypto'
  ): string => {
    switch (type) {
      case 'currency':
        return t('types.currency');
      case 'gold':
        return t('types.gold');
      case 'preciousMetal':
        return t('types.preciousMetal');
      case 'fund':
        return t('types.fund');
      case 'stock':
        return t('types.stock');
      case 'crypto':
        return t('types.crypto');
      default:
        return '';
    }
  };

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'stock' as 'currency' | 'gold' | 'preciousMetal' | 'fund' | 'stock' | 'crypto',
    quantity: '',
    averagePrice: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [fundPriceLoading, setFundPriceLoading] = useState(false);
  const [fundPriceInfo, setFundPriceInfo] = useState<{
    needsApiRequest: boolean;
    quota?: { remaining: number; request_count: number };
    message?: string;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Mevcut investment'ın type'ını modal type'ına çevir (useMemo ile hesapla)
  const modalType = useMemo((): 'currency' | 'gold' | 'preciousMetal' | 'fund' | 'stock' | 'crypto' => {
    if (!investment) return 'stock';
    
    if (investment.type === 'stock') return 'stock';
    if (investment.type === 'crypto') return 'crypto';
    
    // forex için symbol'e bakarak tahmin et
    if (investment.type === 'forex') {
      // Altın kontrolü
      const gold = allCurrencies.find(c => c.code === investment.symbol && c.type === 'gold');
      if (gold) return 'gold';
      
      // Değerli metal kontrolü
      const metal = allCurrencies.find(c => c.code === investment.symbol && c.type === 'metal');
      if (metal) return 'preciousMetal';
      
      // Kripto kontrolü (aslında crypto type olmalı ama kontrol edelim)
      const crypto = allCurrencies.find(c => c.code === investment.symbol && c.type === 'crypto');
      if (crypto) return 'crypto';
      
      // Fon kontrolü
      const fund = allFunds.find(f => f.key === investment.symbol);
      if (fund) return 'fund';
      
      // Varsayılan olarak currency
      return 'currency';
    }
    
    return 'stock';
  }, [investment, allCurrencies, allFunds]);

  // Investment yüklendiğinde veya modalType değiştiğinde formu doldur
  // modalType zaten allCurrencies ve allFunds'a bağımlı, bu yüzden veriler yüklendiğinde otomatik güncellenir
  useEffect(() => {
    if (investment && isOpen) {
      // Form verilerini güncelle - investment verileri her zaman mevcut
      setFormData({
        symbol: investment.symbol || '',
        name: investment.name || '',
        type: modalType,
        quantity: investment.quantity?.toString() || '0',
        averagePrice: investment.averagePrice?.toString() || '0'
      });
      
      // Search query'yi güncelle
      if (investment.symbol && investment.name) {
        setSearchQuery(`${investment.symbol} - ${investment.name}`);
      }
      
      setShowDropdown(false);
      setFundPriceInfo(null);
    }
  }, [investment, isOpen, modalType]);

  // Seçilen türe göre tüm mevcut seçenekleri filtrele
  const getAvailableOptions = () => {
    let options: Array<{ code: string; name: string }> = [];

    switch (formData.type) {
      case 'currency':
        options = allCurrencies
          .filter(c => c.code !== 'TRY' && c.type === 'currency')
          .map(c => ({ code: c.code, name: c.name }));
        break;
      
      case 'gold':
        options = allCurrencies
          .filter(c => c.type === 'gold')
          .map(c => ({ code: c.code, name: c.name }));
        break;
      
      case 'preciousMetal':
        options = allCurrencies
          .filter(c => c.type === 'metal')
          .map(c => ({ code: c.code, name: c.name }));
        break;
      
      case 'fund':
        options = allFunds.map(f => ({ code: f.key, name: f.value }));
        break;
      
      case 'stock':
        options = allStocks.map(s => ({ code: s.code, name: s.name }));
        break;
      
      case 'crypto':
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
    let price = '';
    
    // Yatırım türüne göre güncel fiyatı otomatik doldur (sadece bilgi amaçlı)
    switch (formData.type) {
      case 'stock':
        const stock = allStocks.find(s => s.code === code);
        if (stock) {
          price = stock.last_price.toString();
        }
        break;
      
      case 'currency':
      case 'gold':
      case 'preciousMetal':
        const currency = allCurrencies.find(c => c.code === code);
        if (currency) {
          price = currency.buy.toString(); // Edit için buy fiyatını göster
        }
        break;
      
      case 'crypto':
        const crypto = allCurrencies.find(c => c.code === code && c.type === 'crypto');
        if (crypto) {
          price = crypto.buy.toString();
        }
        break;
      
      case 'fund':
        // Fonlar için fiyat kontrolü yap (API isteği gerekebilir)
        checkFundPrice(code);
        break;
    }
    
    setFormData({
      ...formData,
      symbol: code,
      name: name,
      averagePrice: price || formData.averagePrice // Eğer fiyat bulunduysa güncelle, yoksa eskisini koru
    });
    setSearchQuery(`${code} - ${name}`);
    setShowDropdown(false);
  };
  
  // Fon fiyat kontrolü (bugünün tarihi için)
  const checkFundPrice = async (fundCode: string) => {
    if (formData.type !== 'fund') return;
    
    const today = new Date().toISOString().split('T')[0];
    setFundPriceLoading(true);
    setFundPriceInfo(null);
    
    try {
      const response = await fundsAPI.checkFundPrice(fundCode, today);
      
      if (response.success) {
        if (response.has_price && response.price) {
          // Fiyat bulundu, otomatik doldur
          setFormData(prev => ({
            ...prev,
            averagePrice: response.price.toString()
          }));
          setFundPriceInfo({
            needsApiRequest: false,
            quota: response.quota,
            message: response.message
          });
        } else {
          // Fiyat bulunamadı
          setFundPriceInfo({
            needsApiRequest: response.needs_api_request || false,
            quota: response.quota,
            message: response.message || t('addModal.priceNotFound')
          });
        }
      }
    } catch (error) {
      console.error('Fon fiyat kontrolü hatası:', error);
      setFundPriceInfo({
        needsApiRequest: true,
        quota: { remaining: 0, request_count: 10 },
        message: t('addModal.fundPriceCheckError')
      });
    } finally {
      setFundPriceLoading(false);
    }
  };
  
  // Fiyat doldur butonu (API'den çek)
  const handleFetchPrice = async () => {
    if (!formData.symbol || formData.type !== 'fund') return;
    
    const today = new Date().toISOString().split('T')[0];
    setFundPriceLoading(true);
    
    try {
      const response = await fundsAPI.getFundDetail(formData.symbol, today);
      
      if (response.success && response.data) {
        const data = response.data.data || response.data;
        const topList = data.topList || [];
        
        let price: number | null = null;
        
        // Güncel tarih için topList'ten fiyat al
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
        
        if (price !== null) {
          setFormData(prev => ({
            ...prev,
            averagePrice: price!.toString()
          }));
          setFundPriceInfo({
            needsApiRequest: false,
            quota: response.quota
          });
        }
      }
    } catch (error) {
      console.error('Fiyat çekme hatası:', error);
      toast.error(t('addModal.priceFetchFailed'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol.trim() || !formData.name.trim()) {
      toast.error(t('editInvestmentModal.validSymbolName'));
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const averagePrice = parseFloat(formData.averagePrice);

    if (isNaN(quantity) || quantity < 0) {
      toast.error(t('editInvestmentModal.validQuantity'));
      return;
    }

    if (isNaN(averagePrice) || averagePrice < 0) {
      toast.error(t('editInvestmentModal.validUnitPrice'));
      return;
    }

    // Type mapping: modal type'larını backend type'larına çevir
    let investmentType: 'stock' | 'crypto' | 'forex';
    if (formData.type === 'stock') {
      investmentType = 'stock';
    } else if (formData.type === 'crypto') {
      investmentType = 'crypto';
    } else {
      // currency, gold, preciousMetal, fund -> forex
      investmentType = 'forex';
    }

    setIsUpdating(true);
    try {
      await onUpdate(investment!.id, {
        symbol: formData.symbol.trim(),
        name: formData.name.trim(),
        quantity: quantity,
        averagePrice: averagePrice,
        type: investmentType
      });
      toast.success(t('editInvestmentModal.updateSuccess'));
      onClose();
    } catch (error: any) {
      console.error('Yatırım güncelleme hatası:', error);
      const errorMessage = error?.message || error?.error || t('toast.unknownError');
      toast.error(t('editInvestmentModal.updateError', { message: errorMessage }));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !investment) return null;

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] !mt-0 !mb-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('editInvestmentModal.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('editInvestmentModal.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Yatırım Türü */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              {t('form.investmentType')}
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
                <span className="font-semibold">{t('types.currency')}</span>
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
                <span className="font-semibold">{t('types.gold')}</span>
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
                <span className="font-semibold">{t('types.preciousMetal')}</span>
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
                <span className="font-semibold">{t('types.fund')}</span>
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
                <span className="font-semibold">{t('types.stock')}</span>
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
                <span className="font-semibold">{t('types.crypto')}</span>
              </button>
            </div>
          </div>

          {/* Arama Yapılabilir Değer Seçimi */}
          <div className="relative dropdown-container">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t('addModal.selectLabel', { type: labelForAssetType(formData.type) })}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder={t('form.searchPlaceholder', { type: labelForAssetType(formData.type) })}
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('form.noResults')}</p>
                </div>
              )}
            </div>
            {formData.symbol && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t('form.selected')} <span className="font-semibold">{formData.symbol} - {formData.name}</span>
              </p>
            )}
          </div>

          {/* Varlık Adı (otomatik doldurulur, readonly) */}
          {formData.symbol && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('form.assetName')}
              </label>
              <input
                type="text"
                value={formData.name}
                readOnly
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white transition-all duration-200 cursor-not-allowed"
              />
            </div>
          )}

          {/* Adet ve Ortalama Fiyat */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('editInvestmentModal.quantityLabel')}
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all duration-200"
                placeholder="10"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('editInvestmentModal.avgPrice')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.averagePrice}
                  onChange={(e) => setFormData({...formData, averagePrice: e.target.value})}
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
                            {fundPriceInfo.message || t('addModal.fundPriceDefault')}
                          </p>
                          {fundPriceInfo.quota && (
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                              {t('addModal.quotaRemaining', { remaining: fundPriceInfo.quota.remaining })}
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
                                {t('addModal.loading')}
                              </>
                            ) : (
                              t('addModal.fetchPriceApi')
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : fundPriceInfo.message ? (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {fundPriceInfo.message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {t('addModal.priceAutoFilled')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
              disabled={isUpdating}
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdating || !formData.symbol || !formData.name}
            >
              <Save className="w-5 h-5" />
              <span>{isUpdating ? t('form.saving') : t('form.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

export default EditInvestmentModal;
