import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, DollarSign, PieChart, Calendar, Eye, History, Target, Loader2, GripVertical, X } from 'lucide-react';
import { mockInvestments } from '../data/mockData';
import { Investment } from '../types';
import { borsaAPI, fundsAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import { useFinance } from '../contexts/FinanceContext';
import HisseSelectionModal from './Investments/HisseSelectionModal';
import FundsSelectionModal from './Investments/FundsSelectionModal';
import AddInvestmentModal from './Investments/AddInvestmentModal';
import InvestmentDetailModal from './Investments/InvestmentDetailModal';
import CurrencySelectionModal from './Converter/CurrencySelectionModal';
import FundDetailModal from './Investments/FundDetailModal';
import { 
  getSelectedHisse, 
  saveSelectedHisse,
  addSelectedHisse,
  removeSelectedHisse,
  SelectedHisse,
  getSelectedCurrencies,
  saveSelectedCurrencies,
  addSelectedCurrency,
  removeSelectedCurrency,
  SelectedCurrency,
  getSelectedFunds,
  saveSelectedFunds,
  addSelectedFund,
  removeSelectedFund,
  SelectedFund
} from '../services/userSettingsService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}

interface SortableCurrencyCardProps {
  currency: CurrencyRate;
  onRemove?: (currencyCode: string) => void;
}

interface SortableStockCardProps {
  stock: StockData;
}

interface SortableStockCardPropsWithRemove extends SortableStockCardProps {
  onRemove?: (stockCode: string) => void;
}

const SortableCurrencyCard: React.FC<SortableCurrencyCardProps> = ({ currency, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: currency.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800 group"
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(currency.code);
          }}
          className="absolute top-1 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 z-10"
          title="Kartı listeden çıkar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{currency.code}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currency.name}</p>
          </div>
        </div>
        <div className={`p-2 rounded-full ${currency.change >= 0
          ? 'bg-green-100 dark:bg-green-900'
          : 'bg-red-100 dark:bg-red-900'
          }`}>
          {currency.change >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>

      {/* Buy ve Sell değerleri - Aynı satırda */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Alış:</span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2">
            ₺{currency.type === 'crypto'
              ? currency.buy.toFixed(6)
              : currency.type === 'gold'
                ? currency.buy.toFixed(2)
                : currency.buy.toFixed(3)}
          </span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-xs text-gray-600 dark:text-gray-400">Satış:</span>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400 ml-2">
            ₺{currency.type === 'crypto'
              ? currency.sell.toFixed(6)
              : currency.type === 'gold'
                ? currency.sell.toFixed(2)
                : currency.sell.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Değişim yüzdesi */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Değişim:</span>
        <span className={`text-sm font-medium ${currency.change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
          {currency.change >= 0 ? '+' : ''}{currency.change.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

// Sortable Fund Card Component
interface SortableFundCardProps {
  fund: { key: string; value: string };
  onRemove?: (fundKey: string) => void;
  onViewDetail?: (fundCode: string, fundName: string) => void;
}

const SortableFundCard: React.FC<SortableFundCardProps> = ({ fund, onRemove, onViewDetail }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: fund.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800 group"
    >
      {/* Kaldır butonu - Kartın sağ üst köşesinde */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(fund.key);
          }}
          className="absolute top-1 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 z-10"
          title="Fonu listeden çıkar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{fund.key}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{fund.value}</p>
          </div>
        </div>
      </div>

      {/* Detay Butonu */}
      {onViewDetail && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(fund.key, fund.value);
          }}
          className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
          title="Fon detay bilgilerini görüntüle"
        >
          <Eye className="w-4 h-4" />
          <span>Detay</span>
        </button>
      )}
    </div>
  );
};

const SortableStockCard: React.FC<SortableStockCardPropsWithRemove> = ({ stock, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stock.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800 group"
    >
      {/* Kaldır butonu - Kartın sağ üst köşesinde, bağımsız */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(stock.code);
          }}
          className="absolute top-1 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 z-10"
          title="Kartı listeden çıkar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{stock.code}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stock.name}</p>
          </div>
        </div>
        <div className={`p-2 rounded-full ${
          stock.rate >= 0 
            ? 'bg-green-100 dark:bg-green-900' 
            : 'bg-red-100 dark:bg-red-900'
        }`}>
          {stock.rate >= 0 ? (
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>
      
      {/* Son Fiyat */}
      <div className="mb-3">
        <span className="text-xs text-gray-600 dark:text-gray-400">Son Fiyat:</span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white ml-2">
          ₺{stock.last_price.toFixed(2)}
        </span>
      </div>
      
      {/* Yüksek/Düşük */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">Yüksek:</span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 ml-2">
            ₺{stock.high.toFixed(2)}
          </span>
        </div>
        <div className="flex-1 text-right">
          <span className="text-xs text-gray-600 dark:text-gray-400">Düşük:</span>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400 ml-2">
            ₺{stock.low.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Değişim ve Hacim */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">Değişim:</span>
        <span className={`text-sm font-medium ${
          stock.rate >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {stock.rate >= 0 ? '+' : ''}{stock.rate.toFixed(2)}%
        </span>
      </div>
      {stock.volume > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">Hacim: </span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            ₺{(stock.volume / 1000000).toFixed(2)}M
          </span>
        </div>
      )}
    </div>
  );
};

const Investments: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Token doğrulama - Geçersiz token durumunda login sayfasına yönlendirir
  useTokenValidation();
  
  // Finance context
  const {
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    refreshRates
  } = useFinance();
  
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [fundDetailModal, setFundDetailModal] = useState<{ isOpen: boolean; fundCode: string; fundName: string }>({
    isOpen: false,
    fundCode: '',
    fundName: ''
  });
  const [borsaData, setBorsaData] = useState<StockData[]>([]);
  const [loadingBorsa, setLoadingBorsa] = useState<boolean>(false);
  const [selectedHisse, setSelectedHisse] = useState<SelectedHisse[]>([]);
  const [isSelectingHisse, setIsSelectingHisse] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [searchHisseQuery, setSearchHisseQuery] = useState<string>('');
  
  // Currency states
  const [selectedCurrencies, setSelectedCurrencies] = useState<SelectedCurrency[]>([]);
  const [isSelectingCurrencies, setIsSelectingCurrencies] = useState<boolean>(false);
  const [isInitialLoadCurrencies, setIsInitialLoadCurrencies] = useState<boolean>(true);
  
  // Funds states
  const [allFunds, setAllFunds] = useState<Array<{ key: string; value: string }>>([]);
  const [selectedFunds, setSelectedFunds] = useState<SelectedFund[]>([]);
  const [isSelectingFunds, setIsSelectingFunds] = useState<boolean>(false);
  const [isInitialLoadFunds, setIsInitialLoadFunds] = useState<boolean>(true);
  const [searchFundQuery, setSearchFundQuery] = useState<string>('');
  const [loadingFunds, setLoadingFunds] = useState<boolean>(false);

  // Tüm verileri (döviz, altın, kripto, metaller) CurrencyRate formatına dönüştür
  const allCurrencies: CurrencyRate[] = React.useMemo(() => {
    const currencies: CurrencyRate[] = [
      { code: 'TRY', name: 'Türk Lirası', rate: 1, buy: 1, sell: 1, change: 0, type: 'currency' }
    ];

    // Döviz kurları
    Object.entries(exchangeRates).forEach(([code, currency]) => {
      if (code !== 'TRY') {
        currencies.push({
          code: currency.code || code,
          name: currency.name || code,
          rate: currency.rate || 0,
          buy: (currency as any).buy || currency.rate || 0,
          sell: (currency as any).sell || currency.rate || 0,
          change: currency.change || 0,
          type: 'currency'
        });
      }
    });

    // Altın fiyatları
    Object.entries(goldPrices).forEach(([code, gold]) => {
      currencies.push({
        code: gold.code || code,
        name: gold.name || code,
        rate: gold.rate || 0,
        buy: (gold as any).buy || gold.rate || 0,
        sell: (gold as any).sell || gold.rate || 0,
        change: gold.change || 0,
        type: 'gold'
      });
    });

    // Kripto paralar
    Object.entries(cryptoCurrencies).forEach(([code, crypto]) => {
      currencies.push({
        code: crypto.code || code,
        name: crypto.name || code,
        rate: crypto.rate || 0,
        buy: (crypto as any).buy || crypto.rate || 0,
        sell: (crypto as any).sell || crypto.rate || 0,
        change: crypto.change || 0,
        type: 'crypto'
      });
    });

    // Değerli metaller (Platin, Paladyum)
    Object.entries(preciousMetals).forEach(([code, metal]) => {
      currencies.push({
        code: metal.code || code,
        name: metal.name || code,
        rate: metal.rate || 0,
        buy: (metal as any).buy || metal.rate || 0,
        sell: (metal as any).sell || metal.rate || 0,
        change: metal.change || 0,
        type: 'metal'
      });
    });

    return currencies;
  }, [exchangeRates, goldPrices, cryptoCurrencies, preciousMetals]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sayfa her açıldığında döviz kurları kontrolü yap (CurrencyConverter.tsx gibi)
  // Backend akıllı zaman kontrolü yapıyor, gereksiz API çağrısı yapmıyor
  useEffect(() => {
    const loadRatesOnMount = async () => {
      console.log("💱 Investments: Sayfa açıldı, döviz kurları kontrol ediliyor (akıllı kontrol ile)...");
      // Backend akıllı kontrol yapıyor:
      // - Eğer bugün için veri yoksa veya bir sonraki fetch saatine gelmişse → API'den çeker
      // - Aksi halde Firestore'dan mevcut veriyi döndürür
      await refreshRates();
    };

    loadRatesOnMount();
  }, []); // Sadece component mount olduğunda çalışır (sayfa her açıldığında)

  // Borsa verilerini yükle - Sayfa her açıldığında akıllı kontrol yapılır
  // Backend akıllı zaman kontrolü yapıyor: gerekirse API'den çeker, değilse Firestore'dan döndürür
  useEffect(() => {
    const loadBorsaData = async () => {
      try {
        setLoadingBorsa(true);
        console.log("📈 Investments: Sayfa açıldı, borsa verileri kontrol ediliyor (akıllı kontrol ile)...");
        // Backend akıllı kontrol yapıyor:
        // - Eğer bugün için veri yoksa veya bir sonraki fetch saatine gelmişse → API'den çeker
        // - Aksi halde Firestore'dan mevcut veriyi döndürür
        const response = await borsaAPI.getBorsaData();
        
        console.log("📈 Investments: Borsa API response alındı:", response);
        
        if (response?.success && response?.data?.stocks) {
          const stocks: StockData[] = response.data.stocks.map((stock: any) => ({
            code: stock.code,
            name: stock.name,
            last_price: stock.last_price || 0,
            rate: stock.rate || 0,
            volume: stock.volume || 0,
            high: stock.high || 0,
            low: stock.low || 0,
            time: stock.time || '',
            icon: stock.icon
          }));
          
          setBorsaData(stocks);
          console.log(`✅ Investments: Borsa verileri yüklendi (kaynak: ${response.source || 'Firestore'}):`, stocks.length, "adet");
        } else {
          console.warn("⚠️ Investments: Borsa response beklenen formatta değil:", response);
        }
      } catch (error) {
        console.error("❌ Investments: Borsa verileri yüklenirken hata:", error);
        setBorsaData([]); // Hata durumunda boş array set et
      } finally {
        setLoadingBorsa(false);
      }
    };

    loadBorsaData();
  }, []); // Sadece component mount olduğunda çalışır (sayfa her açıldığında)

  // İlk yüklemede seçili hisseleri Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;
    
    const loadSelectedHisse = async () => {
      // Borsa verileri yüklenene kadar bekle
      if (currentUser?.id && !loadingBorsa && borsaData.length > 0) {
        // Firestore'dan seçili hisseleri yükle
        const saved = await getSelectedHisse(currentUser.id);
        
        if (!isMounted) return;
        
        if (saved && saved.length > 0) {
          // Firestore'dan gelen seçili hisseleri kullan
          setSelectedHisse(saved);
          console.log('✅ Seçili hisse senetleri yüklendi:', saved);
        } else {
          // Firestore'da yoksa, varsayılan olarak ilk 10 hisseyi seç
          const defaultCodes = borsaData.slice(0, 10).map(s => s.code);
          const initialSelected = defaultCodes.map((code, index) => ({ code, order: index }));
          
          if (initialSelected.length > 0 && isMounted) {
            setSelectedHisse(initialSelected);
            // İlk yüklemede Firestore'a kaydet
            try {
              await saveSelectedHisse(currentUser.id, initialSelected);
              console.log('📝 Varsayılan seçili hisseler oluşturuldu ve kaydedildi:', initialSelected);
            } catch (error) {
              console.error('❌ Varsayılan hisseler kaydedilirken hata:', error);
            }
          }
        }
        
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    loadSelectedHisse();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, borsaData.length, loadingBorsa]);

  // Seçili hisseler değiştiğinde Firestore'a kaydet (sıralama değişiklikleri için)
  useEffect(() => {
    // İlk yüklemede kaydetme (loadSelectedHisse zaten kaydediyor)
    if (isInitialLoad) {
      return;
    }

    const saveSelected = async () => {
      if (currentUser?.id && selectedHisse.length >= 0) {
        try {
          await saveSelectedHisse(currentUser.id, selectedHisse);
          console.log('💾 Seçili hisse senetleri kaydedildi:', selectedHisse);
        } catch (error) {
          console.error('❌ Seçili hisse senetleri kaydedilirken hata:', error);
        }
      }
    };

    // Debounce: 500ms bekle, sonra kaydet
    const timeoutId = setTimeout(() => {
      saveSelected();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, selectedHisse, isInitialLoad]);

  // İlk yüklemede seçili currency'leri Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;

    const loadSelectedCurrencies = async () => {
      // exchangeRates, goldPrices, vb. yüklenene kadar bekle
      const hasCurrencyData = Object.keys(exchangeRates).length > 0 || 
                             Object.keys(goldPrices).length > 0 || 
                             Object.keys(cryptoCurrencies).length > 0 || 
                             Object.keys(preciousMetals).length > 0;
      
      if (currentUser?.id && hasCurrencyData && !loadingRates && allCurrencies.length > 1) {
        // Firestore'dan seçili currency'leri yükle
        const saved = await getSelectedCurrencies(currentUser.id);

        if (!isMounted) return;

        if (saved && saved.length > 0) {
          // Firestore'dan gelen seçili currency'leri kullan
          setSelectedCurrencies(saved);
          console.log('✅ Seçili döviz kurları yüklendi:', saved);
        } else {
          // Firestore'da yoksa, varsayılan olarak popüler kurları seç (USD, EUR, GBP)
          const defaultCodes = ['USD', 'EUR', 'GBP'];
          const initialSelected = defaultCodes
            .filter(code => allCurrencies.some(c => c.code === code))
            .map((code, index) => ({ code, order: index }));

          if (initialSelected.length > 0 && isMounted) {
            setSelectedCurrencies(initialSelected);
            // İlk yüklemede Firestore'a kaydet (isInitialLoadCurrencies flag'i ile)
            try {
              await saveSelectedCurrencies(currentUser.id, initialSelected);
              console.log('📝 Varsayılan seçili kurlar oluşturuldu ve kaydedildi:', initialSelected);
            } catch (error) {
              console.error('❌ Varsayılan kurlar kaydedilirken hata:', error);
            }
          }
        }

        if (isMounted) {
          setIsInitialLoadCurrencies(false);
        }
      }
    };

    loadSelectedCurrencies();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, allCurrencies.length, loadingRates, exchangeRates, goldPrices, cryptoCurrencies, preciousMetals]);

  // Seçili currency'ler değiştiğinde Firestore'a kaydet (sıralama değişiklikleri için)
  useEffect(() => {
    // İlk yüklemede kaydetme (loadSelectedCurrencies zaten kaydediyor)
    if (isInitialLoadCurrencies) {
      return;
    }

    const saveSelected = async () => {
      if (currentUser?.id && selectedCurrencies.length >= 0) {
        try {
          await saveSelectedCurrencies(currentUser.id, selectedCurrencies);
          console.log('💾 Seçili döviz kurları kaydedildi:', selectedCurrencies);
        } catch (error) {
          console.error('❌ Seçili döviz kurları kaydedilirken hata:', error);
        }
      }
    };

    // Debounce: 500ms bekle, sonra kaydet
    const timeoutId = setTimeout(() => {
      saveSelected();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, selectedCurrencies, isInitialLoadCurrencies]);

  // Funds verilerini yükle - Sayfa açıldığında ve modal açıldığında
  useEffect(() => {
    const loadFunds = async () => {
      // Eğer zaten yüklendiyse tekrar yükleme
      if (allFunds.length > 0) {
        return;
      }
      
      try {
        setLoadingFunds(true);
        console.log("💰 Funds verileri yükleniyor...");
        const response = await fundsAPI.getFunds();
        
        console.log("💰 Funds API response alındı:", response);
        
        if (response?.success && response?.data?.funds) {
          const fundsList = response.data.funds.map((fund: any) => ({
            key: fund.key || fund.id,
            value: fund.value || ''
          }));
          
          setAllFunds(fundsList);
          console.log("✅ Funds verileri yüklendi:", fundsList.length, "adet");
        } else {
          console.warn("⚠️ Funds response beklenen formatta değil:", response);
        }
      } catch (error) {
        console.error("❌ Funds verileri yüklenirken hata:", error);
        setAllFunds([]); // Hata durumunda boş array set et
      } finally {
        setLoadingFunds(false);
      }
    };

    loadFunds();
  }, []); // Sayfa açıldığında çalışır

  // İlk yüklemede seçili funds'ları Firestore'dan yükle
  // Funds verileri modal açıldığında yüklenecek, bu yüzden sadece Firestore'dan seçili funds'ları yükle
  useEffect(() => {
    let isMounted = true;

    const loadSelectedFunds = async () => {
      // Funds verileri modal açıldığında yüklenecek, bu yüzden sadece seçili funds'ları yükle
      if (currentUser?.id) {
        // Firestore'dan seçili funds'ları yükle
        const saved = await getSelectedFunds(currentUser.id);

        if (!isMounted) return;

        if (saved && saved.length > 0) {
          // Firestore'dan gelen seçili funds'ları kullan
          setSelectedFunds(saved);
          console.log('✅ Seçili yatırım fonları yüklendi:', saved);
        }

        if (isMounted) {
          setIsInitialLoadFunds(false);
        }
      }
    };

    loadSelectedFunds();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]); // Funds verileri modal açıldığında yüklenecek

  // Seçili funds'lar değiştiğinde Firestore'a kaydet (sıralama değişiklikleri için)
  useEffect(() => {
    // İlk yüklemede kaydetme (loadSelectedFunds zaten kaydediyor)
    if (isInitialLoadFunds || isSelectingFunds) {
      return;
    }

    const saveSelected = async () => {
      if (currentUser?.id && selectedFunds.length >= 0) {
        try {
          await saveSelectedFunds(currentUser.id, selectedFunds);
          console.log('💾 Seçili yatırım fonları kaydedildi:', selectedFunds);
        } catch (error) {
          console.error('❌ Seçili yatırım fonları kaydedilirken hata:', error);
        }
      }
    };

    // Debounce: 500ms bekle, sonra kaydet
    const timeoutId = setTimeout(() => {
      saveSelected();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, selectedFunds, isInitialLoadFunds, isSelectingFunds]);

  // Sıralanmış ve seçili kurları oluştur
  const sortedCurrencies = React.useMemo(() => {
    if (selectedCurrencies.length === 0) {
      return [];
    }

    // selectedCurrencies'a göre sırala (order field'ına göre)
    return selectedCurrencies
      .sort((a, b) => a.order - b.order)
      .map(selected => allCurrencies.find(c => c.code === selected.code))
      .filter((c): c is CurrencyRate => c !== undefined && c.code !== 'TRY');
  }, [allCurrencies, selectedCurrencies]);

  // Sıralanmış ve seçili funds'ları oluştur
  const sortedFunds = React.useMemo(() => {
    if (selectedFunds.length === 0) {
      return [];
    }
    
    // selectedFunds'a göre sırala (order field'ına göre)
    return selectedFunds
      .sort((a, b) => a.order - b.order)
      .map(selected => {
        const fund = allFunds.find(f => f.key === selected.key);
        return fund ? { key: fund.key, value: fund.value } : null;
      })
      .filter((f): f is { key: string; value: string } => f !== null);
  }, [allFunds, selectedFunds]);

  // Sıralanmış ve seçili hisseleri oluştur
  const sortedStocks = React.useMemo(() => {
    if (selectedHisse.length === 0) {
      return [];
    }
    
    // selectedHisse'a göre sırala (order field'ına göre)
    return selectedHisse
      .sort((a, b) => a.order - b.order)
      .map(selected => borsaData.find(s => s.code === selected.code))
      .filter((s): s is StockData => s !== undefined);
  }, [borsaData, selectedHisse]);

  // Currency drag end handler
  const handleCurrencyDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedCurrencies((items) => {
        const oldIndex = items.findIndex(item => item.code === active.id);
        const newIndex = items.findIndex(item => item.code === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Order değerlerini güncelle
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Funds drag end handler
  const handleFundDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedFunds((items) => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Order değerlerini güncelle
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Hisse drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedHisse((items) => {
        const oldIndex = items.findIndex(item => item.code === active.id);
        const newIndex = items.findIndex(item => item.code === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Order değerlerini güncelle
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Currency seç/çıkar (CurrencyConverter'daki gibi direkt Firestore'a kaydeder)
  const toggleCurrencySelection = async (currencyCode: string) => {
    if (!currentUser?.id) return;

    const isSelected = selectedCurrencies.some(sc => sc.code === currencyCode);
    
    if (isSelected) {
      // Çıkar
      await removeSelectedCurrency(currentUser.id, currencyCode);
      setSelectedCurrencies(prev => prev.filter(sc => sc.code !== currencyCode));
    } else {
      // Ekle (en sona)
      const maxOrder = selectedCurrencies.length > 0 
        ? Math.max(...selectedCurrencies.map(sc => sc.order)) 
        : -1;
      await addSelectedCurrency(currentUser.id, currencyCode, maxOrder + 1);
      setSelectedCurrencies(prev => [...prev, { code: currencyCode, order: maxOrder + 1 }]);
    }
  };

  // Hisse seç/çıkar (CurrencyConverter'daki gibi direkt Firestore'a kaydeder)
  const toggleHisseSelection = async (hisseCode: string) => {
    if (!currentUser?.id) return;

    const isSelected = selectedHisse.some(sh => sh.code === hisseCode);
    
    if (isSelected) {
      // Çıkar
      await removeSelectedHisse(currentUser.id, hisseCode);
      setSelectedHisse(prev => prev.filter(sh => sh.code !== hisseCode));
    } else {
      // Ekle (en sona)
      const maxOrder = selectedHisse.length > 0 
        ? Math.max(...selectedHisse.map(sh => sh.order)) 
        : -1;
      await addSelectedHisse(currentUser.id, hisseCode, maxOrder + 1);
      setSelectedHisse(prev => [...prev, { code: hisseCode, order: maxOrder + 1 }]);
    }
  };

  // Fund seç/çıkar (CurrencyConverter'daki gibi direkt Firestore'a kaydeder)
  const toggleFundSelection = async (fundKey: string) => {
    if (!currentUser?.id) return;

    const isSelected = selectedFunds.some(sf => sf.key === fundKey);
    
    if (isSelected) {
      // Çıkar
      await removeSelectedFund(currentUser.id, fundKey);
      setSelectedFunds(prev => prev.filter(sf => sf.key !== fundKey));
    } else {
      // Ekle (en sona)
      const maxOrder = selectedFunds.length > 0 
        ? Math.max(...selectedFunds.map(sf => sf.order)) 
        : -1;
      await addSelectedFund(currentUser.id, fundKey, maxOrder + 1);
      setSelectedFunds(prev => [...prev, { key: fundKey, order: maxOrder + 1 }]);
    }
  };

  const totalValue = mockInvestments.reduce((sum, inv) => sum + inv.totalValue, 0);
  const totalGain = mockInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0);
  const totalGainPercentage = (totalGain / (totalValue - totalGain)) * 100;

  const stockInvestments = mockInvestments.filter(inv => inv.type === 'stock');
  const cryptoInvestments = mockInvestments.filter(inv => inv.type === 'crypto');

  // Currency selection change handler
  const handleCurrencySelectionChange = (currencies: SelectedCurrency[]) => {
    setSelectedCurrencies(currencies);
  };

  // Hisse selection change handler  
  const handleHisseSelectionChange = (hisse: SelectedHisse[]) => {
    setSelectedHisse(hisse);
  };

  // Fund selection change handler
  const handleFundSelectionChange = (funds: SelectedFund[]) => {
    setSelectedFunds(funds);
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

        {/* Currency Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sahip</h2>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {loadingRates && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                )}
                <button
                  onClick={() => setIsSelectingCurrencies(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
                  title="Döviz kurları seç"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCurrencyDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
              {loadingRates ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Kurlar yükleniyor...</span>
                </div>
              ) : sortedCurrencies.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Henüz seçili döviz kuru yok. Lütfen "Ekle" butonuna tıklayarak görmek istediğiniz döviz kurlarını seçin.
                  </p>
                  <button
                    onClick={() => setIsSelectingCurrencies(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Döviz Kurları Seç
                  </button>
                </div>
              ) : (
                <SortableContext items={sortedCurrencies.map(c => c.code)} strategy={rectSortingStrategy}>
                  {sortedCurrencies.map((currency) => (
                    <SortableCurrencyCard
                      key={currency.code}
                      currency={currency}
                      onRemove={toggleCurrencySelection}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
        </div>

        {/* Funds Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Takip Edilen Yatırım Fonları</h2>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {loadingFunds && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                )}
                <button
                  onClick={() => setIsSelectingFunds(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
                  title="Yatırım fonları seç"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFundDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
              {sortedFunds.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Henüz seçili yatırım fonu yok. Lütfen "Ekle" butonuna tıklayarak görmek istediğiniz yatırım fonlarını seçin.
                  </p>
                  <button
                    onClick={() => setIsSelectingFunds(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Yatırım Fonları Seç
                  </button>
                </div>
              ) : (
                <SortableContext items={sortedFunds.map(f => f.key)} strategy={rectSortingStrategy}>
                  {sortedFunds.map((fund) => (
                    <SortableFundCard
                      key={fund.key}
                      fund={fund}
                      onRemove={toggleFundSelection}
                      onViewDetail={(code, name) => {
                        setFundDetailModal({
                          isOpen: true,
                          fundCode: code,
                          fundName: name
                        });
                      }}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
        </div>

        {/* Borsa Verileri */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Güncel Borsa Verileri</h2>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {loadingBorsa && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                )}
                <button 
                  onClick={() => setIsSelectingHisse(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
                  title="Hisse senetleri seç"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
              {loadingBorsa && borsaData.length === 0 ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Borsa verileri yükleniyor...</span>
                </div>
              ) : sortedStocks.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Henüz seçili hisse senedi yok. Lütfen "Ekle" butonuna tıklayarak görmek istediğiniz hisse senetlerini seçin.
                  </p>
                  <button
                    onClick={() => setIsSelectingHisse(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Hisse Senetleri Seç
                  </button>
                </div>
              ) : (
                <SortableContext items={sortedStocks.map(s => s.code)} strategy={rectSortingStrategy}>
                  {sortedStocks.map((stock) => (
                    <SortableStockCard 
                      key={stock.code} 
                      stock={stock}
                      onRemove={toggleHisseSelection}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
        </div>

        {/* Hisse Seçim Modal */}
        <HisseSelectionModal
          isOpen={isSelectingHisse}
          onClose={() => {
            setIsSelectingHisse(false);
            setSearchHisseQuery('');
          }}
          borsaData={borsaData}
          selectedHisse={selectedHisse}
          onSelectionChange={handleHisseSelectionChange}
          searchQuery={searchHisseQuery}
          onSearchChange={setSearchHisseQuery}
          toggleHisseSelection={toggleHisseSelection}
        />

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
              {stockInvestments.map((investment, _index) => (
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

        {/* Currency Selection Modal */}
        <CurrencySelectionModal
          isOpen={isSelectingCurrencies}
          onClose={() => {
            setIsSelectingCurrencies(false);
          }}
          allCurrencies={allCurrencies}
          selectedCurrencies={selectedCurrencies}
          onSelectionChange={handleCurrencySelectionChange}
          exchangeRates={exchangeRates as Record<string, CurrencyRate>}
          goldPrices={goldPrices as Record<string, CurrencyRate>}
          cryptoCurrencies={cryptoCurrencies as Record<string, CurrencyRate>}
          preciousMetals={preciousMetals as Record<string, CurrencyRate>}
          currentUserId={currentUser?.id}
        />

        {/* Funds Selection Modal */}
        <FundsSelectionModal
          isOpen={isSelectingFunds}
          onClose={() => {
            setIsSelectingFunds(false);
            setSearchFundQuery('');
          }}
          allFunds={allFunds}
          selectedFunds={selectedFunds}
          onSelectionChange={handleFundSelectionChange}
          searchQuery={searchFundQuery}
          onSearchChange={setSearchFundQuery}
          toggleFundSelection={toggleFundSelection}
        />

        {/* Investment Detail Modal */}
        <InvestmentDetailModal
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
        />

        {/* Add Investment Modal */}
        <AddInvestmentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          allCurrencies={allCurrencies}
          allFunds={allFunds}
          allStocks={borsaData}
        />

        {/* Fund Detail Modal */}
        <FundDetailModal
          isOpen={fundDetailModal.isOpen}
          onClose={() => setFundDetailModal({ isOpen: false, fundCode: '', fundName: '' })}
          fundCode={fundDetailModal.fundCode}
          fundName={fundDetailModal.fundName}
        />
      </div>
    </div>
  );
};

export default Investments;