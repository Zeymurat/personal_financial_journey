import React, { useState, useEffect } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Loader2, GripVertical, X, Plus, ArrowRight } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import {
  getSelectedCurrencies,
  saveSelectedCurrencies,
  SelectedCurrency,
  removeQuickConvert,
  QuickConvert
} from '../services/userSettingsService';
import CurrencySelectionModal from './Converter/CurrencySelectionModal';
import QuickConvertManagementModal from './Converter/QuickConvertManagementModal';
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

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}

// Sortable Quick Convert Card Component
interface SortableQuickConvertCardProps {
  convert: QuickConvert;
  allCurrencies: CurrencyRate[];
  onRemove?: (convert: QuickConvert) => void;
}

const SortableQuickConvertCard: React.FC<SortableQuickConvertCardProps> = ({ convert, allCurrencies, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `${convert.from}_${convert.to}_${convert.amount}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  };

  // Çevirim hesaplama
  const fromCurrencyData = allCurrencies.find(c => c.code === convert.from);
  const toCurrencyData = allCurrencies.find(c => c.code === convert.to);

  let result = 0;
  if (fromCurrencyData && toCurrencyData) {
    const fromRate = fromCurrencyData.rate || 1;
    const toRate = toCurrencyData.rate || 1;

    if (convert.from === 'TRY') {
      result = convert.amount / toRate;
    } else if (convert.to === 'TRY') {
      result = convert.amount * fromRate;
    } else {
      const inTRY = convert.amount * fromRate;
      result = inTRY / toRate;
    }
  }

  // Para birimi tipine göre format belirleme
  const getDecimalPlaces = (code: string): number => {
    const currencyData = allCurrencies.find(c => c.code === code);
    if (currencyData?.type === 'crypto') return 6;
    if (currencyData?.type === 'gold') return 2;
    return 3;
  };

  const fromDecimals = getDecimalPlaces(convert.from);
  const toDecimals = getDecimalPlaces(convert.to);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative p-5 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 rounded-xl" />

      {/* Kaldır butonu - Daha zarif konum */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(convert);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 bg-red-500/10 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-full text-red-600 dark:text-red-400 z-10 backdrop-blur-sm"
          title="Çevirimi listeden çıkar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Drag Handle - Sol üst köşede */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
        title="Sürükleyerek sırala"
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      </div>

      {/* Çevirim Bilgileri - Merkezi yerleşim */}
      <div className="text-center space-y-3 relative z-0">
        {/* Kaynak miktar - Üst */}
        <div className="space-y-1">
          <div className="flex flex-row justify-center">
            {fromCurrencyData?.name && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                {fromCurrencyData.name}
              </p>
            )}
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 tracking-wide px-2">
              ({convert.from})
            </p>

          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {convert.amount.toLocaleString('tr-TR', {
              minimumFractionDigits: fromDecimals,
              maximumFractionDigits: fromDecimals
            })}
          </p>
        </div>

        {/* Ok ikonu - Orta */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center space-x-1 text-gray-400 dark:text-gray-500">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Hedef miktar - Alt (vurgulu) */}
        <div className="space-y-1">
          <div className="flex flex-row justify-center">
            {toCurrencyData?.name && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                {toCurrencyData.name}
              </p>
            )}
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 tracking-wide px-2">
              ({convert.to})
            </p>

          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {result.toLocaleString('tr-TR', {
              minimumFractionDigits: toDecimals,
              maximumFractionDigits: toDecimals
            })}
          </p>
        </div>
      </div>

      {/* Alt çizgi - Dekoratif */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

// Sortable Currency Card Component
interface SortableCurrencyCardProps {
  currency: CurrencyRate;
  onRemove?: (currencyCode: string) => void;
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
      {/* Kaldır butonu - Kartın sağ üst köşesinde, bağımsız */}
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

const CurrencyConverter: React.FC = () => {
  const {
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    refreshRates
  } = useFinance();
  const { currentUser } = useAuth();
  
  // Token doğrulama - Geçersiz token durumunda login sayfasına yönlendirir
  useTokenValidation();
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('TRY');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [selectedCurrencies, setSelectedCurrencies] = useState<SelectedCurrency[]>([]);
  const [isSelectingCurrencies, setIsSelectingCurrencies] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Hızlı çevirimler
  const [quickConverts, setQuickConverts] = useState<QuickConvert[]>([]);
  const [isManagingConversions, setIsManagingConversions] = useState<boolean>(false);
  const [isInitialLoadConversions, setIsInitialLoadConversions] = useState<boolean>(true);

  // Tüm verileri (döviz, altın, kripto, metaller) CurrencyRate formatına dönüştür
  const allCurrencies: CurrencyRate[] = React.useMemo(() => {
    const currencies: CurrencyRate[] = [
      { code: 'TRY', name: 'Türk Lirası', rate: 1, buy: 1, sell: 1, change: 0 }
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

  // İlk yüklemede seçili currency'leri Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;

    const loadSelectedCurrencies = async () => {
      if (currentUser?.id && allCurrencies.length > 1) {
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
            // İlk yüklemede Firestore'a kaydet (isInitialLoad flag'i ile)
            try {
              await saveSelectedCurrencies(currentUser.id, initialSelected);
              console.log('📝 Varsayılan seçili kurlar oluşturuldu ve kaydedildi:', initialSelected);
            } catch (error) {
              console.error('❌ Varsayılan kurlar kaydedilirken hata:', error);
            }
          }
        }

        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    loadSelectedCurrencies();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, allCurrencies.length]);

  // Seçili currency'ler değiştiğinde Firestore'a kaydet (sıralama değişiklikleri için)
  useEffect(() => {
    // İlk yüklemede kaydetme (loadSelectedCurrencies zaten kaydediyor)
    if (isInitialLoad) {
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
  }, [currentUser?.id, selectedCurrencies, isInitialLoad]);

  // Hızlı çevirimleri Firestore'dan yükle
  useEffect(() => {
    let isMounted = true;

    const loadQuickConverts = async () => {
      if (currentUser?.id) {
        try {
          const { getQuickConverts } = await import('../services/userSettingsService');
          const saved = await getQuickConverts(currentUser.id);

          if (!isMounted) return;

          if (saved && saved.length > 0) {
            setQuickConverts(saved);
            console.log('✅ Hızlı çevirimler yüklendi:', saved);
          } else {
            // Varsayılan çevirimler
            const defaultConverts: QuickConvert[] = [
              { from: 'USD', to: 'TRY', amount: 100, order: 0 },
              { from: 'EUR', to: 'TRY', amount: 100, order: 1 },
              { from: 'TRY', to: 'USD', amount: 1000, order: 2 },
              { from: 'TRY', to: 'EUR', amount: 1000, order: 3 }
            ];

            if (isMounted) {
              setQuickConverts(defaultConverts);
              // İlk yüklemede Firestore'a kaydet
              try {
                const { saveQuickConverts } = await import('../services/userSettingsService');
                await saveQuickConverts(currentUser.id, defaultConverts);
                console.log('📝 Varsayılan hızlı çevirimler oluşturuldu ve kaydedildi');
              } catch (error) {
                console.error('❌ Varsayılan çevirimler kaydedilirken hata:', error);
              }
            }
          }

          if (isMounted) {
            setIsInitialLoadConversions(false);
          }
        } catch (error) {
          console.error('❌ Hızlı çevirimler yüklenirken hata:', error);
          if (isMounted) {
            setIsInitialLoadConversions(false);
          }
        }
      }
    };

    loadQuickConverts();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Hızlı çevirimler sıralaması değiştiğinde Firestore'a kaydet (debounced)
  useEffect(() => {
    if (isInitialLoadConversions || !currentUser?.id || quickConverts.length === 0 || isManagingConversions) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { saveQuickConverts } = await import('../services/userSettingsService');
        await saveQuickConverts(currentUser.id, quickConverts);
        console.log('💾 Hızlı çevirimler sıralaması kaydedildi');
      } catch (error) {
        console.error('❌ Hızlı çevirimler kaydedilirken hata:', error);
      }
    }, 1000); // 1 saniye debounce

    return () => clearTimeout(timeoutId);
  }, [quickConverts, currentUser?.id, isInitialLoadConversions, isManagingConversions]);

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

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler - Currency sıralama
  const handleDragEnd = (event: DragEndEvent) => {
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

  // Drag end handler - Quick Convert sıralama
  const handleQuickConvertDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuickConverts((items) => {
        const oldIndex = items.findIndex(item => `${item.from}_${item.to}_${item.amount}` === active.id);
        const newIndex = items.findIndex(item => `${item.from}_${item.to}_${item.amount}` === over.id);

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

  // Currency seç/çıkar - Modal içinde yapılıyor, burada sadece state güncellemesi için
  const handleCurrencySelectionChange = (currencies: SelectedCurrency[]) => {
    setSelectedCurrencies(currencies);
  };

  // toggleCurrencySelection - SortableCurrencyCard'da kullanılıyor (remove butonu için)
  const toggleCurrencySelection = async (currencyCode: string) => {
    if (!currentUser?.id) return;

    const isSelected = selectedCurrencies.some(sc => sc.code === currencyCode);

    if (isSelected) {
      // Çıkar
      const { removeSelectedCurrency } = await import('../services/userSettingsService');
      await removeSelectedCurrency(currentUser.id, currencyCode);
      setSelectedCurrencies(prev => prev.filter(sc => sc.code !== currencyCode));
    }
  };

  // Sayfa her açıldığında kurları kontrol et (Transactions sayfası gibi)
  // Backend akıllı zaman kontrolü yapıyor, gereksiz API çağrısı yapmıyor
  useEffect(() => {
    const loadRatesOnMount = async () => {
      console.log("💱 CurrencyConverter: Sayfa açıldı, döviz kurları kontrol ediliyor...");
      // Backend akıllı kontrol yapıyor:
      // - Eğer bugün için veri yoksa veya bir sonraki fetch saatine gelmişse → API'den çeker
      // - Aksi halde Firestore'dan mevcut veriyi döndürür
      await refreshRates();
    };

    loadRatesOnMount();
  }, []); // Sadece component mount olduğunda çalışır (sayfa her açıldığında)

  const handleConvert = () => {
    const fromRate = allCurrencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = allCurrencies.find(c => c.code === toCurrency)?.rate || 1;
    
    let result: number;
    if (fromCurrency === 'TRY') {
      result = parseFloat(amount) / toRate;
    } else if (toCurrency === 'TRY') {
      result = parseFloat(amount) * fromRate;
    } else {
      const inTRY = parseFloat(amount) * fromRate;
      result = inTRY / toRate;
    }
    
    setConvertedAmount(result);
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    handleConvert();
  };

  React.useEffect(() => {
    if (amount && allCurrencies.length > 1) {
      handleConvert();
    }
  }, [amount, fromCurrency, toCurrency, allCurrencies]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Döviz Çevirici</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Güncel kurlarla döviz çevirisi yapın</p>
        </div>
        {/* <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsSelectingCurrencies(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Döviz Seç</span>
          </button>
          <button 
            onClick={handleRefreshRates}
            disabled={loadingRates}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingRates ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
          <span>Kurları Güncelle</span>
            )}
        </button>
        </div> */}
      </div>

      {/* Currency Converter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* From Currency */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Çevrilecek Miktar
            </label>
            <div className="space-y-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <ArrowUpDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* To Currency */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Çevrilmiş Miktar
            </label>
            <div className="space-y-3">
              <div className="w-full p-4 text-2xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                {convertedAmount.toLocaleString('tr-TR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            1 {fromCurrency} = {
              fromCurrency === 'TRY' 
                ? (1 / (allCurrencies.find(c => c.code === toCurrency)?.rate || 1)).toFixed(4)
                : toCurrency === 'TRY'
                ? (allCurrencies.find(c => c.code === fromCurrency)?.rate || 1).toFixed(4)
                : ((allCurrencies.find(c => c.code === fromCurrency)?.rate || 1) / (allCurrencies.find(c => c.code === toCurrency)?.rate || 1)).toFixed(4)
            } {toCurrency}
          </p>
        </div>
      </div>
      {/* Quick Conversions */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hızlı Çevirimler</h3>
          <button
            onClick={() => setIsManagingConversions(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
            title="Çevirimleri yönet"
          >
            <Plus className="w-4 h-4" />
            <span>Ekle</span>
          </button>
        </div>

        {quickConverts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Henüz hızlı çevirim eklenmemiş. "Ekle" butonuna tıklayarak çevirim ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleQuickConvertDragEnd}
          >
            <SortableContext
              items={quickConverts.map(c => `${c.from}_${c.to}_${c.amount}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {quickConverts.map((convert) => (
                  <SortableQuickConvertCard
                    key={`${convert.from}_${convert.to}_${convert.amount}`}
                    convert={convert}
                    allCurrencies={allCurrencies}
                    onRemove={async (convertToRemove) => {
                      if (!currentUser?.id) return;
                      try {
                        await removeQuickConvert(currentUser.id, convertToRemove.from, convertToRemove.to, convertToRemove.amount);
                        setQuickConverts(prev => prev.filter(c =>
                          !(c.from === convertToRemove.from && c.to === convertToRemove.to && c.amount === convertToRemove.amount)
                        ));
                      } catch (error) {
                        console.error('❌ Çevirim çıkarılırken hata:', error);
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Currency Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Güncel Döviz Kurları</h2>
                {/* <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Güncellenme Zamanı: {sortedCurrencies[0].lastUpdated}
                </p> */}
                {/* {selectedCurrencies.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                    {selectedCurrencies.length} seçili
                  </span>
                )} */}
        </div>
              {/* <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Finans API'den güncel kurlar {lastUpdateTime && `• Son güncelleme: ${lastUpdateTime}`}
              </p> */}
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
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-6">
            {loadingRates && allCurrencies.length === 1 ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Kurlar yükleniyor...</span>
              </div>
            ) : sortedCurrencies.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Henüz seçili döviz kuru yok. Lütfen "Döviz Seç" butonuna tıklayarak görmek istediğiniz döviz kurlarını seçin.
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



      {/* Currency Selection Modal */}
      <CurrencySelectionModal
        isOpen={isSelectingCurrencies}
        onClose={() => setIsSelectingCurrencies(false)}
        allCurrencies={allCurrencies}
        selectedCurrencies={selectedCurrencies}
        onSelectionChange={handleCurrencySelectionChange}
        exchangeRates={exchangeRates as Record<string, CurrencyRate>}
        goldPrices={goldPrices as Record<string, CurrencyRate>}
        cryptoCurrencies={cryptoCurrencies as Record<string, CurrencyRate>}
        preciousMetals={preciousMetals as Record<string, CurrencyRate>}
        currentUserId={currentUser?.id}
      />

      {/* Quick Convert Management Modal */}
      <QuickConvertManagementModal
        isOpen={isManagingConversions}
        onClose={() => setIsManagingConversions(false)}
        allCurrencies={allCurrencies}
        quickConverts={quickConverts}
        onConvertsChange={setQuickConverts}
        currentUserId={currentUser?.id}
      />
    </div>
  );
};

export default CurrencyConverter;