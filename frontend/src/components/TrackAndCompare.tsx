import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Loader2, GripVertical, X, Eye } from 'lucide-react';
import { borsaAPI, fundsAPI } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import { useFinance } from '../contexts/FinanceContext';
import HisseSelectionModal from './Investments/HisseSelectionModal';
import FundsSelectionModal from './Investments/FundsSelectionModal';
import CurrencySelectionModal from './Converter/CurrencySelectionModal';
import FundDetailModal from './Investments/FundDetailModal';
import { 
  getFollowedBorsa,
  saveFollowedBorsa,
  addFollowedBorsa,
  removeFollowedBorsa,
  FollowedBorsa,
  getFollowedCurrencies,
  saveFollowedCurrencies,
  addFollowedCurrency,
  removeFollowedCurrency,
  FollowedCurrency,
  getFollowedFunds,
  saveFollowedFunds,
  addFollowedFund,
  removeFollowedFund,
  FollowedFund
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

const TrackAndCompare: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Token doğrulama
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
  
  const [borsaData, setBorsaData] = useState<StockData[]>([]);
  const [loadingBorsa, setLoadingBorsa] = useState<boolean>(false);
  const [followedBorsa, setFollowedBorsa] = useState<FollowedBorsa[]>([]);
  const [isSelectingBorsa, setIsSelectingBorsa] = useState<boolean>(false);
  const [isInitialLoadBorsa, setIsInitialLoadBorsa] = useState<boolean>(true);
  const [searchBorsaQuery, setSearchBorsaQuery] = useState<string>('');
  
  // Currency states
  const [followedCurrencies, setFollowedCurrencies] = useState<FollowedCurrency[]>([]);
  const [isSelectingCurrencies, setIsSelectingCurrencies] = useState<boolean>(false);
  const [isInitialLoadCurrencies, setIsInitialLoadCurrencies] = useState<boolean>(true);
  
  // Funds states
  const [allFunds, setAllFunds] = useState<Array<{ key: string; value: string }>>([]);
  const [followedFunds, setFollowedFunds] = useState<FollowedFund[]>([]);
  const [isSelectingFunds, setIsSelectingFunds] = useState<boolean>(false);
  const [fundDetailModal, setFundDetailModal] = useState<{ isOpen: boolean; fundCode: string; fundName: string }>({
    isOpen: false,
    fundCode: '',
    fundName: ''
  });
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

  // Sayfa her açıldığında döviz kurları kontrolü yap
  useEffect(() => {
    const loadRatesOnMount = async () => {
      console.log("💱 TrackAndCompare: Sayfa açıldı, döviz kurları kontrol ediliyor...");
      await refreshRates();
    };

    loadRatesOnMount();
  }, []);

  // Borsa verilerini yükle
  useEffect(() => {
    const loadBorsaData = async () => {
      try {
        setLoadingBorsa(true);
        console.log("📈 TrackAndCompare: Borsa verileri yükleniyor...");
        const response = await borsaAPI.getBorsaData();
        
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
          console.log(`✅ TrackAndCompare: Borsa verileri yüklendi:`, stocks.length, "adet");
        }
      } catch (error) {
        console.error("❌ TrackAndCompare: Borsa verileri yüklenirken hata:", error);
        setBorsaData([]);
      } finally {
        setLoadingBorsa(false);
      }
    };

    loadBorsaData();
  }, []);

  // İlk yüklemede takip edilen hisseleri Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;
    
    const loadFollowedBorsa = async () => {
      if (currentUser?.id && !loadingBorsa && borsaData.length > 0) {
        const saved = await getFollowedBorsa(currentUser.id);
        
        if (!isMounted) return;
        
        if (saved && saved.length > 0) {
          setFollowedBorsa(saved);
          console.log('✅ Takip edilen hisse senetleri yüklendi:', saved);
        }
        
        if (isMounted) {
          setIsInitialLoadBorsa(false);
        }
      }
    };

    loadFollowedBorsa();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, borsaData.length, loadingBorsa]);

  // Takip edilen hisseler değiştiğinde Firestore'a kaydet
  useEffect(() => {
    if (isInitialLoadBorsa) {
      return;
    }

    const saveFollowed = async () => {
      if (currentUser?.id && followedBorsa.length >= 0) {
        try {
          await saveFollowedBorsa(currentUser.id, followedBorsa);
          console.log('💾 Takip edilen hisse senetleri kaydedildi:', followedBorsa);
        } catch (error) {
          console.error('❌ Takip edilen hisse senetleri kaydedilirken hata:', error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      saveFollowed();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, followedBorsa, isInitialLoadBorsa]);

  // İlk yüklemede takip edilen currency'leri Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;

    const loadFollowedCurrencies = async () => {
      const hasCurrencyData = Object.keys(exchangeRates).length > 0 || 
                             Object.keys(goldPrices).length > 0 || 
                             Object.keys(cryptoCurrencies).length > 0 || 
                             Object.keys(preciousMetals).length > 0;
      
      if (currentUser?.id && hasCurrencyData && !loadingRates && allCurrencies.length > 1) {
        const saved = await getFollowedCurrencies(currentUser.id);

        if (!isMounted) return;

        if (saved && saved.length > 0) {
          setFollowedCurrencies(saved);
          console.log('✅ Takip edilen döviz kurları yüklendi:', saved);
        }

        if (isMounted) {
          setIsInitialLoadCurrencies(false);
        }
      }
    };

    loadFollowedCurrencies();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, allCurrencies.length, loadingRates, exchangeRates, goldPrices, cryptoCurrencies, preciousMetals]);

  // Takip edilen currency'ler değiştiğinde Firestore'a kaydet
  useEffect(() => {
    if (isInitialLoadCurrencies) {
      return;
    }

    const saveFollowed = async () => {
      if (currentUser?.id && followedCurrencies.length >= 0) {
        try {
          await saveFollowedCurrencies(currentUser.id, followedCurrencies);
          console.log('💾 Takip edilen döviz kurları kaydedildi:', followedCurrencies);
        } catch (error) {
          console.error('❌ Takip edilen döviz kurları kaydedilirken hata:', error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      saveFollowed();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, followedCurrencies, isInitialLoadCurrencies]);

  // Funds verilerini yükle - Sayfa açıldığında
  useEffect(() => {
    const loadFunds = async () => {
      // Eğer zaten yüklendiyse tekrar yükleme
      if (allFunds.length > 0) {
        return;
      }
      
      try {
        setLoadingFunds(true);
        console.log("💰 TrackAndCompare: Funds verileri yükleniyor...");
        const response = await fundsAPI.getFunds();
        
        if (response?.success && response?.data?.funds) {
          const fundsList = response.data.funds.map((fund: any) => ({
            key: fund.key || fund.id,
            value: fund.value || ''
          }));
          
          setAllFunds(fundsList);
          console.log("✅ TrackAndCompare: Funds verileri yüklendi:", fundsList.length, "adet");
        }
      } catch (error) {
        console.error("❌ TrackAndCompare: Funds verileri yüklenirken hata:", error);
        setAllFunds([]);
      } finally {
        setLoadingFunds(false);
      }
    };

    loadFunds();
  }, []); // Sayfa açıldığında çalışır

  // İlk yüklemede takip edilen funds'ları Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;

    const loadFollowedFunds = async () => {
      if (currentUser?.id) {
        const saved = await getFollowedFunds(currentUser.id);

        if (!isMounted) return;

        if (saved && saved.length > 0) {
          setFollowedFunds(saved);
          console.log('✅ Takip edilen yatırım fonları yüklendi:', saved);
        }

        if (isMounted) {
          setIsInitialLoadFunds(false);
        }
      }
    };

    loadFollowedFunds();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Takip edilen funds'lar değiştiğinde Firestore'a kaydet
  useEffect(() => {
    if (isInitialLoadFunds || isSelectingFunds) {
      return;
    }

    const saveFollowed = async () => {
      if (currentUser?.id && followedFunds.length >= 0) {
        try {
          await saveFollowedFunds(currentUser.id, followedFunds);
          console.log('💾 Takip edilen yatırım fonları kaydedildi:', followedFunds);
        } catch (error) {
          console.error('❌ Takip edilen yatırım fonları kaydedilirken hata:', error);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      saveFollowed();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, followedFunds, isInitialLoadFunds, isSelectingFunds]);

  // Sıralanmış ve takip edilen kurları oluştur
  const sortedCurrencies = React.useMemo(() => {
    if (followedCurrencies.length === 0) {
      return [];
    }

    return followedCurrencies
      .sort((a, b) => a.order - b.order)
      .map(followed => allCurrencies.find(c => c.code === followed.code))
      .filter((c): c is CurrencyRate => c !== undefined && c.code !== 'TRY');
  }, [allCurrencies, followedCurrencies]);

  // Sıralanmış ve takip edilen funds'ları oluştur
  const sortedFunds = React.useMemo(() => {
    if (followedFunds.length === 0) {
      return [];
    }
    
    return followedFunds
      .sort((a, b) => a.order - b.order)
      .map(followed => {
        const fund = allFunds.find(f => f.key === followed.key);
        return fund ? { key: fund.key, value: fund.value } : null;
      })
      .filter((f): f is { key: string; value: string } => f !== null);
  }, [allFunds, followedFunds]);

  // Sıralanmış ve takip edilen hisseleri oluştur
  const sortedStocks = React.useMemo(() => {
    if (followedBorsa.length === 0) {
      return [];
    }
    
    return followedBorsa
      .sort((a, b) => a.order - b.order)
      .map(followed => borsaData.find(s => s.code === followed.code))
      .filter((s): s is StockData => s !== undefined);
  }, [borsaData, followedBorsa]);

  // Currency drag end handler
  const handleCurrencyDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFollowedCurrencies((items) => {
        const oldIndex = items.findIndex(item => item.code === active.id);
        const newIndex = items.findIndex(item => item.code === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
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
      setFollowedFunds((items) => {
        const oldIndex = items.findIndex(item => item.key === active.id);
        const newIndex = items.findIndex(item => item.key === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Borsa drag end handler
  const handleBorsaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFollowedBorsa((items) => {
        const oldIndex = items.findIndex(item => item.code === active.id);
        const newIndex = items.findIndex(item => item.code === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  // Currency seç/çıkar
  const toggleFollowedCurrency = async (currencyCode: string) => {
    if (!currentUser?.id) return;

    const isFollowed = followedCurrencies.some(fc => fc.code === currencyCode);
    
    if (isFollowed) {
      await removeFollowedCurrency(currentUser.id, currencyCode);
      setFollowedCurrencies(prev => prev.filter(fc => fc.code !== currencyCode));
    } else {
      const maxOrder = followedCurrencies.length > 0 
        ? Math.max(...followedCurrencies.map(fc => fc.order)) 
        : -1;
      await addFollowedCurrency(currentUser.id, currencyCode, maxOrder + 1);
      setFollowedCurrencies(prev => [...prev, { code: currencyCode, order: maxOrder + 1 }]);
    }
  };

  // Borsa seç/çıkar
  const toggleFollowedBorsa = async (borsaCode: string) => {
    if (!currentUser?.id) return;

    const isFollowed = followedBorsa.some(fb => fb.code === borsaCode);
    
    if (isFollowed) {
      await removeFollowedBorsa(currentUser.id, borsaCode);
      setFollowedBorsa(prev => prev.filter(fb => fb.code !== borsaCode));
    } else {
      const maxOrder = followedBorsa.length > 0 
        ? Math.max(...followedBorsa.map(fb => fb.order)) 
        : -1;
      await addFollowedBorsa(currentUser.id, borsaCode, maxOrder + 1);
      setFollowedBorsa(prev => [...prev, { code: borsaCode, order: maxOrder + 1 }]);
    }
  };

  // Fund seç/çıkar
  const toggleFollowedFund = async (fundKey: string) => {
    if (!currentUser?.id) return;

    const isFollowed = followedFunds.some(ff => ff.key === fundKey);
    
    if (isFollowed) {
      await removeFollowedFund(currentUser.id, fundKey);
      setFollowedFunds(prev => prev.filter(ff => ff.key !== fundKey));
    } else {
      const maxOrder = followedFunds.length > 0 
        ? Math.max(...followedFunds.map(ff => ff.order)) 
        : -1;
      await addFollowedFund(currentUser.id, fundKey, maxOrder + 1);
      setFollowedFunds(prev => [...prev, { key: fundKey, order: maxOrder + 1 }]);
    }
  };

  // Selection change handlers
  const handleCurrencySelectionChange = (currencies: FollowedCurrency[]) => {
    setFollowedCurrencies(currencies);
  };

  const handleBorsaSelectionChange = (borsa: FollowedBorsa[]) => {
    setFollowedBorsa(borsa);
  };

  const handleFundSelectionChange = (funds: FollowedFund[]) => {
    setFollowedFunds(funds);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Takip ve Karşılaştırma
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-medium">
            İlgilendiğiniz varlıkları takip edin ve karşılaştırın
          </p>
        </div>

        {/* Currency Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Güncel Döviz Kurları</h2>
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
                    Henüz takip edilen döviz kuru yok. Lütfen "Ekle" butonuna tıklayarak takip etmek istediğiniz döviz kurlarını seçin.
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
                      onRemove={toggleFollowedCurrency}
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
                    Henüz takip edilen yatırım fonu yok. Lütfen "Ekle" butonuna tıklayarak takip etmek istediğiniz yatırım fonlarını seçin.
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
                      onRemove={toggleFollowedFund}
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
                  onClick={() => setIsSelectingBorsa(true)}
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
            onDragEnd={handleBorsaDragEnd}
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
                    Henüz takip edilen hisse senedi yok. Lütfen "Ekle" butonuna tıklayarak takip etmek istediğiniz hisse senetlerini seçin.
                  </p>
                  <button
                    onClick={() => setIsSelectingBorsa(true)}
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
                      onRemove={toggleFollowedBorsa}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
        </div>

        {/* Modals */}
        <HisseSelectionModal
          isOpen={isSelectingBorsa}
          onClose={() => {
            setIsSelectingBorsa(false);
            setSearchBorsaQuery('');
          }}
          borsaData={borsaData}
          selectedHisse={followedBorsa.map(fb => ({ code: fb.code, order: fb.order }))}
          onSelectionChange={(hisse) => {
            handleBorsaSelectionChange(hisse.map(h => ({ code: h.code, order: h.order })));
          }}
          searchQuery={searchBorsaQuery}
          onSearchChange={setSearchBorsaQuery}
          toggleHisseSelection={toggleFollowedBorsa}
        />

        <CurrencySelectionModal
          isOpen={isSelectingCurrencies}
          onClose={() => {
            setIsSelectingCurrencies(false);
          }}
          allCurrencies={allCurrencies}
          selectedCurrencies={followedCurrencies.map(fc => ({ code: fc.code, order: fc.order }))}
          onSelectionChange={(currencies) => {
            handleCurrencySelectionChange(currencies.map(c => ({ code: c.code, order: c.order })));
          }}
          exchangeRates={exchangeRates as Record<string, CurrencyRate>}
          goldPrices={goldPrices as Record<string, CurrencyRate>}
          cryptoCurrencies={cryptoCurrencies as Record<string, CurrencyRate>}
          preciousMetals={preciousMetals as Record<string, CurrencyRate>}
          currentUserId={currentUser?.id}
          onToggle={toggleFollowedCurrency}
        />

        <FundsSelectionModal
          isOpen={isSelectingFunds}
          onClose={() => {
            setIsSelectingFunds(false);
            setSearchFundQuery('');
          }}
          allFunds={allFunds}
          selectedFunds={followedFunds.map(ff => ({ key: ff.key, order: ff.order }))}
          onSelectionChange={(funds) => {
            handleFundSelectionChange(funds.map(f => ({ key: f.key, order: f.order })));
          }}
          searchQuery={searchFundQuery}
          onSearchChange={setSearchFundQuery}
          toggleFundSelection={toggleFollowedFund}
        />

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

export default TrackAndCompare;

