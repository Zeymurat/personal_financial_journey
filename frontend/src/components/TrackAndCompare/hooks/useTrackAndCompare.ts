import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fundsAPI } from '../../../services/apiService';
import { useAuth } from '../../../contexts/AuthContext';
import { useFinance } from '../../../contexts/FinanceContext';
import {
  getFollowedBorsa,
  saveFollowedBorsa,
  addFollowedBorsa,
  removeFollowedBorsa,
  type FollowedBorsa,
  getFollowedCurrencies,
  saveFollowedCurrencies,
  addFollowedCurrency,
  removeFollowedCurrency,
  type FollowedCurrency,
  getFollowedFunds,
  saveFollowedFunds,
  addFollowedFund,
  removeFollowedFund,
  type FollowedFund
} from '../../../services/userSettingsService';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { ComparisonItem, CurrencyRate } from '../types';
import { buildAllCurrencyRates } from '../utils/buildCurrencyRates';
import { getTypeBadgeColor } from '../utils/comparisonLabels';

export function useTrackAndCompare() {
  const { t } = useTranslation('trackCompare');
  const { currentUser } = useAuth();

  const getTypeLabel = useCallback(
    (type: string) => {
      const key = `typeLabels.${type}`;
      const translated = t(key);
      return translated === key ? type : translated;
    },
    [t]
  );


  // Finance context - Tüm veriler buradan geliyor (login olduğunda yükleniyor)
  const {
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    borsaData,
    loadingBorsa
  } = useFinance();
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

  // Fonlar için fiyat ve değişim bilgisi
  const [fundPrices, setFundPrices] = useState<Record<string, { price: number | null; hasPrice: boolean; change: number | null }>>({});

  // Karşılaştırma tablosu için state'ler
  const [comparisonSearchTerm, setComparisonSearchTerm] = useState<string>('');
  const [comparisonTypeFilter, setComparisonTypeFilter] = useState<string>('all');
  const [comparisonSortField, setComparisonSortField] = useState<'name' | 'code' | 'price' | 'change' | null>(null);
  const [comparisonSortDirection, setComparisonSortDirection] = useState<'asc' | 'desc'>('desc');

  // Geçici olarak tabloya eklenen varlıklar (DB'ye kaydedilmez)
  const [temporaryItems, setTemporaryItems] = useState<ComparisonItem[]>([]);
  const [showAddToTableModal, setShowAddToTableModal] = useState<boolean>(false);

  // Tüm verileri (döviz, altın, kripto, metaller) CurrencyRate formatına dönüştür
  const allCurrencies: CurrencyRate[] = useMemo(
    () => buildAllCurrencyRates(exchangeRates, goldPrices, cryptoCurrencies, preciousMetals),
    [exchangeRates, goldPrices, cryptoCurrencies, preciousMetals]
  );

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Tüm veriler (döviz, borsa) FinanceContext'ten geliyor
  // Login olduğunda FinanceContext tüm verileri yüklüyor:
  // - Currency verileri (döviz, altın, kripto, metaller)
  // - Borsa verileri
  // Backend akıllı zaman kontrolü yapıyor: gerekirse API'den çeker, değilse cache'den döndürür
  // Burada tekrar API çağrısı yapmaya gerek yok, gereksiz istekleri önlemek için kaldırıldı

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
  const sortedCurrencies = useMemo(() => {
    if (followedCurrencies.length === 0) {
      return [];
    }

    return followedCurrencies
      .sort((a, b) => a.order - b.order)
      .map(followed => allCurrencies.find(c => c.code === followed.code))
      .filter((c): c is CurrencyRate => c !== undefined && c.code !== 'TRY');
  }, [allCurrencies, followedCurrencies]);

  // Sıralanmış ve takip edilen funds'ları oluştur
  const sortedFunds = useMemo(() => {
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
  const sortedStocks = useMemo(() => {
    if (followedBorsa.length === 0) {
      return [];
    }

    return followedBorsa
      .sort((a, b) => a.order - b.order)
      .map(followed => borsaData.find(s => s.code === followed.code))
      .filter((s): s is StockData => s !== undefined);
  }, [borsaData, followedBorsa]);

  // Fonlar için fiyat ve değişim kontrolü (cache'den okur, API'ye istek atmaz)
  useEffect(() => {
    const checkFundPrices = async () => {
      if (followedFunds.length === 0 || allFunds.length === 0) return;

      const today = new Date().toISOString().split('T')[0];
      const pricePromises = followedFunds.map(async (ff) => {
        try {
          // Önce fiyat kontrolü yap
          const priceResponse = await fundsAPI.checkFundPrice(ff.key, today);
          let price: number | null = null;
          let hasPrice = false;
          let change: number | null = null;

          if (priceResponse.success && priceResponse.has_price && priceResponse.price) {
            price = priceResponse.price;
            hasPrice = true;

            // Eğer fiyat varsa, günlük getiri bilgisini al
            try {
              const detailResponse = await fundsAPI.getFundDetail(ff.key, today);
              if (detailResponse.success && detailResponse.data) {
                const data = detailResponse.data.data || detailResponse.data;
                const topList = data.topList || [];

                // "Günlük Getiri (%)" alanını bul
                for (const item of topList) {
                  if (item.key === 'Günlük Getiri (%)' || item.key === 'Günlük Getiri' || item.key === 'Daily Return (%)') {
                    try {
                      const valueStr = String(item.value).replace(',', '.').replace('%', '').trim();
                      change = parseFloat(valueStr);
                      break;
                    } catch {
                      continue;
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Fon detay bilgisi hatası (${ff.key}):`, error);
              // Detay hatası olsa bile fiyat bilgisini kullan
            }
          }

          return {
            symbol: ff.key,
            price,
            hasPrice,
            change
          };
        } catch (error) {
          console.error(`Fon fiyat kontrolü hatası (${ff.key}):`, error);
          return {
            symbol: ff.key,
            price: null,
            hasPrice: false,
            change: null
          };
        }
      });

      const results = await Promise.all(pricePromises);
      const priceMap: Record<string, { price: number | null; hasPrice: boolean; change: number | null }> = {};
      results.forEach(result => {
        priceMap[result.symbol] = {
          price: result.price,
          hasPrice: result.hasPrice,
          change: result.change
        };
      });
      setFundPrices(priceMap);
    };

    if (followedFunds.length > 0 && allFunds.length > 0) {
      checkFundPrices();
    }
  }, [followedFunds, allFunds]);

  // Tüm takip edilen varlıkları birleştir + geçici eklenenler
  const allComparisonItems: ComparisonItem[] = useMemo(() => {
    const items: ComparisonItem[] = [];

    // Döviz kurları, altın, kripto, metaller
    sortedCurrencies.forEach((currency, index) => {
      items.push({
        id: `currency-${currency.code}`,
        name: currency.name,
        code: currency.code,
        type: currency.type || 'currency',
        price: currency.rate,
        change: currency.change,
        buy: currency.buy,
        sell: currency.sell,
        order: followedCurrencies.find(fc => fc.code === currency.code)?.order || index
      });
    });

    // Yatırım fonları (bugünün verisi varsa fiyat ve değişim göster)
    sortedFunds.forEach((fund, index) => {
      const fundPriceInfo = fundPrices[fund.key];
      const hasPrice = fundPriceInfo?.hasPrice && fundPriceInfo?.price !== null;
      const hasChange = fundPriceInfo?.change !== null && fundPriceInfo?.change !== undefined;

      items.push({
        id: `fund-${fund.key}`,
        name: fund.value,
        code: fund.key,
        type: 'fund',
        price: hasPrice ? fundPriceInfo.price! : 0, // Bugünün verisi varsa fiyat, yoksa 0
        change: hasChange ? fundPriceInfo.change! : 0, // Günlük getiri varsa göster, yoksa 0
        order: followedFunds.find(ff => ff.key === fund.key)?.order || index
      });
    });

    // Hisse senetleri
    sortedStocks.forEach((stock, index) => {
      items.push({
        id: `stock-${stock.code}`,
        name: stock.name,
        code: stock.code,
        type: 'stock',
        price: stock.last_price || stock.rate || 0,
        change: stock.rate || 0, // rate değişim yüzdesi
        order: followedBorsa.find(fb => fb.code === stock.code)?.order || index
      });
    });

    // Geçici olarak eklenen varlıklar (takip edilmeyenler)
    temporaryItems.forEach((item, index) => {
      // Eğer zaten takip edilenlerde varsa ekleme
      const exists = items.some(i =>
        (i.type === 'currency' || i.type === 'gold' || i.type === 'crypto' || i.type === 'metal') && i.code === item.code ||
        i.type === 'fund' && i.code === item.code ||
        i.type === 'stock' && i.code === item.code
      );
      if (!exists) {
        items.push({
          ...item,
          order: 10000 + index // Geçici olanlar en sonda
        });
      }
    });

    return items;
  }, [sortedCurrencies, sortedFunds, sortedStocks, followedCurrencies, followedFunds, followedBorsa, temporaryItems, fundPrices]);

  // Filtreleme ve sıralama
  const filteredAndSortedItems = useMemo(() => {
    let filtered = allComparisonItems;

    // Tip filtresi
    if (comparisonTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === comparisonTypeFilter);
    }

    // Arama filtresi
    if (comparisonSearchTerm) {
      const searchLower = comparisonSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.code.toLowerCase().includes(searchLower)
      );
    }

    // Sıralama
    if (comparisonSortField) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;

        switch (comparisonSortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'code':
            comparison = a.code.localeCompare(b.code);
            break;
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'change':
            comparison = a.change - b.change;
            break;
        }

        return comparisonSortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // Varsayılan sıralama: order'a göre
      filtered = [...filtered].sort((a, b) => a.order - b.order);
    }

    return filtered;
  }, [allComparisonItems, comparisonTypeFilter, comparisonSearchTerm, comparisonSortField, comparisonSortDirection]);

  // Sıralama butonuna tıklama
  const handleComparisonSort = (field: 'name' | 'code' | 'price' | 'change') => {
    if (comparisonSortField === field) {
      setComparisonSortDirection(comparisonSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setComparisonSortField(field);
      setComparisonSortDirection('desc');
    }
  };


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

  return {
    currentUser,
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    loadingBorsa,
    borsaData,
    allCurrencies,
    followedBorsa,
    followedCurrencies,
    followedFunds,
    isSelectingBorsa,
    setIsSelectingBorsa,
    searchBorsaQuery,
    setSearchBorsaQuery,
    isSelectingCurrencies,
    setIsSelectingCurrencies,
    allFunds,
    isSelectingFunds,
    setIsSelectingFunds,
    searchFundQuery,
    setSearchFundQuery,
    loadingFunds,
    fundDetailModal,
    setFundDetailModal,
    comparisonSearchTerm,
    setComparisonSearchTerm,
    comparisonTypeFilter,
    setComparisonTypeFilter,
    comparisonSortField,
    comparisonSortDirection,
    handleComparisonSort,
    temporaryItems,
    setTemporaryItems,
    showAddToTableModal,
    setShowAddToTableModal,
    sortedCurrencies,
    sortedFunds,
    sortedStocks,
    sensors,
    handleCurrencyDragEnd,
    handleFundDragEnd,
    handleBorsaDragEnd,
    toggleFollowedCurrency,
    toggleFollowedBorsa,
    toggleFollowedFund,
    handleCurrencySelectionChange,
    handleBorsaSelectionChange,
    handleFundSelectionChange,
    allComparisonItems,
    filteredAndSortedItems,
    getTypeBadgeColor,
    getTypeLabel
  };
}
