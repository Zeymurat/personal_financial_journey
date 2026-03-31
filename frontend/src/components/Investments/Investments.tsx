import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Investment } from '../../types';
import { fundsAPI, investmentAPI } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useFinance } from '../../contexts/FinanceContext';
import { HisseSelectionModal, FundsSelectionModal, CurrencySelectionModal } from '../shared/modals';
import AddInvestmentModal from './modals/AddInvestmentModal';
import InvestmentDetailModal from './modals/InvestmentDetailModal';
import FundDetailModal from './modals/FundDetailModal';
import DeleteInvestmentModal from './modals/DeleteInvestmentModal';
import EditInvestmentModal from './modals/EditInvestmentModal';
import EditInvestmentTransactionModal from './modals/EditInvestmentTransactionModal';
import DeleteInvestmentTransactionModal from './modals/DeleteInvestmentTransactionModal';
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
} from '../../services/userSettingsService';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { CurrencyRate } from './types';
import { buildAllCurrencies } from './utils/buildAllCurrencies';
import {
  getSortedSelectedCurrencies,
  getSortedSelectedFunds,
  getSortedSelectedStocks
} from './utils/selectionOrdering';
import { useInvestmentsFetchTimes } from './hooks/useInvestmentsFetchTimes';
import InvestmentsHeader from './sections/InvestmentsHeader';
import PortfolioSummaryCards from './sections/PortfolioSummaryCards';
import CurrencyRatesPanel from './sections/CurrencyRatesPanel';
import FundsRatesPanel from './sections/FundsRatesPanel';
import BorsaStocksPanel from './sections/BorsaStocksPanel';
import InvestmentCategoryColumns from './sections/InvestmentCategoryColumns';
import InvestmentsTransactionsTable, {
  type PortfolioTransactionRow
} from './sections/InvestmentsTransactionsTable';

const Investments: React.FC = () => {
  const { t } = useTranslation('investments');
  const { currentUser } = useAuth();

  // Token doğrulama - Geçersiz token durumunda login sayfasına yönlendirir
  useTokenValidation();

  // Finance context - Tüm veriler buradan geliyor (login olduğunda yükleniyor)
  const {
    exchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    loadingRates,
    investments,
    addInvestmentTransaction,
    updateInvestment,
    deleteInvestment,
    refreshInvestments,
    borsaData,
    loadingBorsa
  } = useFinance();

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<{ investmentId: string; transactionId: string; transaction: any } | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<{ investmentId: string; transactionId: string; transaction: any } | null>(null);
  const [fundDetailModal, setFundDetailModal] = useState<{ isOpen: boolean; fundCode: string; fundName: string }>({
    isOpen: false,
    fundCode: '',
    fundName: ''
  });
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
  const [fundPrices, setFundPrices] = useState<Record<string, { price: number | null; hasPrice: boolean }>>({});
  
  const { currenciesFetchTime, borsaFetchTime } = useInvestmentsFetchTimes();

  const allCurrencies: CurrencyRate[] = React.useMemo(
    () => buildAllCurrencies(exchangeRates, goldPrices, cryptoCurrencies, preciousMetals),
    [exchangeRates, goldPrices, cryptoCurrencies, preciousMetals]
  );

  // Tüm veriler (döviz, borsa) FinanceContext'ten geliyor
  // Login olduğunda FinanceContext tüm verileri yüklüyor:
  // - Currency verileri (döviz, altın, kripto, metaller)
  // - Borsa verileri
  // Backend akıllı zaman kontrolü yapıyor: gerekirse API'den çeker, değilse cache'den döndürür
  // Burada tekrar API çağrısı yapmaya gerek yok, gereksiz istekleri önlemek için kaldırıldı

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
          // console.log('✅ Seçili hisse senetleri yüklendi:', saved);
        } else {
          // Firestore'da yoksa, varsayılan olarak ilk 10 hisseyi seç
          const defaultCodes = borsaData.slice(0, 10).map(s => s.code);
          const initialSelected = defaultCodes.map((code, index) => ({ code, order: index }));

          if (initialSelected.length > 0 && isMounted) {
            setSelectedHisse(initialSelected);
            // İlk yüklemede Firestore'a kaydet
            try {
              await saveSelectedHisse(currentUser.id, initialSelected);
              // console.log('📝 Varsayılan seçili hisseler oluşturuldu ve kaydedildi:', initialSelected);
            } catch (error) {
              // console.error('❌ Varsayılan hisseler kaydedilirken hata:', error);
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
          // console.log('💾 Seçili hisse senetleri kaydedildi:', selectedHisse);
        } catch (error) {
          // console.error('❌ Seçili hisse senetleri kaydedilirken hata:', error);
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
        // console.log("💰 Funds verileri yükleniyor...");
        const response = await fundsAPI.getFunds();

        // console.log("💰 Funds API response alındı:", response);

        if (response?.success && response?.data?.funds) {
          const fundsList = response.data.funds.map((fund: any) => ({
            key: fund.key || fund.id,
            value: fund.value || ''
          }));

          setAllFunds(fundsList);
          // console.log("✅ Funds verileri yüklendi:", fundsList.length, "adet");
        } else {
          // console.warn("⚠️ Funds response beklenen formatta değil:", response);
        }
      } catch (error) {
        // console.error("❌ Funds verileri yüklenirken hata:", error);
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
          // console.log('✅ Seçili yatırım fonları yüklendi:', saved);
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
          // console.log('💾 Seçili yatırım fonları kaydedildi:', selectedFunds);
        } catch (error) {
          // console.error('❌ Seçili yatırım fonları kaydedilirken hata:', error);
        }
      }
    };

    // Debounce: 500ms bekle, sonra kaydet
    const timeoutId = setTimeout(() => {
      saveSelected();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, selectedFunds, isInitialLoadFunds, isSelectingFunds]);

  const sortedCurrencies = React.useMemo(
    () => getSortedSelectedCurrencies(allCurrencies, selectedCurrencies),
    [allCurrencies, selectedCurrencies]
  );

  const sortedFunds = React.useMemo(
    () => getSortedSelectedFunds(allFunds, selectedFunds),
    [allFunds, selectedFunds]
  );

  const sortedStocks = React.useMemo(
    () => getSortedSelectedStocks(borsaData, selectedHisse),
    [borsaData, selectedHisse]
  );

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

  // Currency seç/çıkar (Converter ekranındaki gibi direkt Firestore'a kaydeder)
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

  // Hisse seç/çıkar (Converter ekranındaki gibi direkt Firestore'a kaydeder)
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

  // Fund seç/çıkar (Converter ekranındaki gibi direkt Firestore'a kaydeder)
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

  // Fonlar için fiyat kontrolü (cache'den okur, API'ye istek atmaz)
  useEffect(() => {
    const checkFundPrices = async () => {
      const fundInvestments = investments.filter(inv => {
        const fund = allFunds.find(f => f.key === inv.symbol);
        return fund !== undefined;
      });

      if (fundInvestments.length === 0) return;

      const today = new Date().toISOString().split('T')[0];
      const pricePromises = fundInvestments.map(async (inv) => {
        try {
          const response = await fundsAPI.checkFundPrice(inv.symbol, today);
          if (response.success && response.has_price && response.price) {
            return {
              symbol: inv.symbol,
              price: response.price,
              hasPrice: true
            };
          } else {
            return {
              symbol: inv.symbol,
              price: null,
              hasPrice: false
            };
          }
        } catch (error) {
          console.error(`Fon fiyat kontrolü hatası (${inv.symbol}):`, error);
          return {
            symbol: inv.symbol,
            price: null,
            hasPrice: false
          };
        }
      });

      const results = await Promise.all(pricePromises);
      const priceMap: Record<string, { price: number | null; hasPrice: boolean }> = {};
      results.forEach(result => {
        priceMap[result.symbol] = { price: result.price, hasPrice: result.hasPrice };
      });
      setFundPrices(priceMap);
    };

    if (investments.length > 0 && allFunds.length > 0) {
      checkFundPrices();
    }
  }, [investments, allFunds]);

  // Yatırımları güncel döviz kurlarıyla güncelle ve tip bilgisini belirle
  const getUpdatedInvestments = React.useMemo(() => {
    return investments.map(inv => {
      let updatedCurrentPrice = inv.currentPrice;
      let displayType: 'stock' | 'crypto' | 'forex' | 'gold' | 'currency' | 'preciousMetal' | 'fund' = inv.type as any;
      let hasValidPrice = true; // Hesaplamalara dahil edilsin mi?

      // Önce allCurrencies içinde kontrol et (altın, değerli metal, döviz, kripto için)
      const currency = allCurrencies.find(c => c.code === inv.symbol);
      if (currency) {
        // Alış fiyatını kullan (yatırım değerini hesaplarken)
        updatedCurrentPrice = currency.buy || currency.rate || 0;
        // Tip bilgisini currency'den al
        if (currency.type === 'gold') {
          displayType = 'gold';
        } else if (currency.type === 'crypto') {
          displayType = 'crypto';
        } else if (currency.type === 'metal') {
          displayType = 'preciousMetal';
        } else {
          displayType = 'currency';
        }
      } else if (inv.type === 'stock') {
        // Hisse senetleri için güncel fiyatı bul
        const stock = borsaData.find(s => s.code === inv.symbol);
        if (stock) {
          updatedCurrentPrice = stock.last_price || 0;
        }
        displayType = 'stock';
      } else if (inv.type === 'forex' || (inv as any).type === 'fund') {
        // Forex tipindeki yatırımlar için - fon kontrolü yap
        const fund = allFunds.find(f => f.key === inv.symbol);
        if (fund) {
          // Fon için önce borsaData'dan kontrol et
          const stock = borsaData.find(s => s.code === inv.symbol);
          if (stock && stock.last_price) {
            updatedCurrentPrice = stock.last_price;
            hasValidPrice = true;
          } else {
            // borsaData'da yoksa, fundPrices'tan kontrol et
            const fundPriceInfo = fundPrices[inv.symbol];
            if (fundPriceInfo && fundPriceInfo.hasPrice && fundPriceInfo.price !== null) {
              updatedCurrentPrice = fundPriceInfo.price;
              hasValidPrice = true;
            } else {
              // Fon için güncel fiyat bulunamadıysa null yap ve hesaplamalara dahil etme
              updatedCurrentPrice = null as any;
              hasValidPrice = false;
            }
          }
          displayType = 'fund';
        } else {
          // Forex ama fon değilse, döviz olarak işaretle
          displayType = 'currency';
        }
      } else if (inv.type === 'crypto') {
        // Kripto paralar için (zaten allCurrencies'de kontrol edildi ama yine de)
        displayType = 'crypto';
      }

      // Güncel değerleri hesapla (fiyat yoksa veya geçersizse 0 kullan ama hasValidPrice false olsun)
      const priceForCalculation = (hasValidPrice && updatedCurrentPrice != null && updatedCurrentPrice > 0)
        ? updatedCurrentPrice
        : 0;
      const updatedTotalValue = hasValidPrice ? (inv.quantity * priceForCalculation) : null as any;
      const totalCost = inv.quantity * inv.averagePrice;
      const updatedProfitLoss = hasValidPrice ? (updatedTotalValue - totalCost) : null as any;
      const updatedProfitLossPercentage = (hasValidPrice && totalCost > 0)
        ? ((updatedProfitLoss / totalCost) * 100)
        : null as any;

      return {
        ...inv,
        currentPrice: updatedCurrentPrice,
        totalValue: updatedTotalValue,
        profitLoss: updatedProfitLoss,
        profitLossPercentage: updatedProfitLossPercentage,
        displayType, // Yeni alan: gösterim için tip bilgisi
        hasValidPrice // Hesaplamalara dahil edilsin mi?
      };
    });
  }, [investments, allCurrencies, borsaData, allFunds, fundPrices]);

  // Gerçek investments verilerini kullan (FinanceContext'ten geliyor) - güncel fiyatlarla güncellenmiş
  // Detaylı Portföy tablosu için: Tüm investment'ları göster (quantity = 0 olsa bile, satış işlemlerini de görmek için)
  const allInvestmentsForTable = getUpdatedInvestments;
  
  // Sadece quantity > 0 olanları toplam hesaplamaları için kullan
  const activeInvestments = getUpdatedInvestments.filter(inv => inv.quantity > 0);

  const totalValue = activeInvestments.reduce((sum, inv) => {
    return sum + ((inv.totalValue && (inv as any).hasValidPrice !== false) ? inv.totalValue : 0);
  }, 0);
  const totalGain = activeInvestments.reduce((sum, inv) => {
    return sum + ((inv.profitLoss && (inv as any).hasValidPrice !== false) ? inv.profitLoss : 0);
  }, 0);
  const totalInvested = totalValue - totalGain; // Toplam yatırılan miktar
  const totalGainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // ROI = Toplam Kazanç / Toplam Yatırım × 100 (zaten totalGainPercentage ile aynı)
  const roi = totalGainPercentage;

  // Detaylı Portföy tablosu için: Tüm transaction'ları yükle ve her transaction'ı ayrı satır olarak göster
  const [allTransactionsForTable, setAllTransactionsForTable] = React.useState<Array<any>>([]);
  const [loadingTableTransactions, setLoadingTableTransactions] = React.useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  // Transaction'ları yükleme fonksiyonu - useCallback ile memoize edildi, hem useEffect hem de manuel çağrılabilir
  const loadAllTransactions = React.useCallback(async () => {
    if (allInvestmentsForTable.length === 0) {
      setAllTransactionsForTable([]);
      return;
    }

    setLoadingTableTransactions(true);
    try {
      const { getInvestmentTransactions } = await import('../../services/investmentService');
      
      // Tüm investment'lar için transaction'ları PARALEL yükle (Promise.allSettled ile)
      // Her investment için ayrı bir Promise oluştur
      const transactionPromises = allInvestmentsForTable.map(async (inv) => {
        try {
          const transactions = await getInvestmentTransactions(inv.id);
          
          // Her transaction'ı investment bilgileriyle birlikte döndür
          return transactions.map((transaction: any) => ({
            ...transaction,
            investment: {
              id: inv.id,
              symbol: inv.symbol,
              name: inv.name,
              type: inv.type,
              displayType: (inv as any).displayType || inv.type
            }
          }));
        } catch (error) {
          console.error(`Error loading transactions for investment ${inv.id}:`, error);
          return []; // Hata durumunda boş array döndür
        }
      });
      
      // Tüm Promise'leri paralel olarak çalıştır ve sonuçları bekle
      // Promise.allSettled kullanıyoruz çünkü:
      // - Bir investment'ın transaction'ları yüklenemezse diğerlerini de kaybetmek istemiyoruz
      // - Hata durumunda bile diğer investment'ların transaction'ları yüklensin
      const results = await Promise.allSettled(transactionPromises);
      
      // Başarılı olanları filtrele ve birleştir
      const allTransactions = results
        .filter((result): result is PromiseFulfilledResult<any[]> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)
        .flat();
      
      // Hatalı olanları logla (zaten yukarıda try-catch içinde loglanıyor)
      const failedResults = results.filter(result => result.status === 'rejected');
      if (failedResults.length > 0) {
        console.warn(`${failedResults.length} investment için transaction yüklenemedi`);
      }
      
      // Transaction'ları tarihe göre sırala (en yeni en üstte)
      // Önce date'e göre, aynı tarihte ise createdAt'e göre sırala
      allTransactions.sort((a, b) => {
        // Önce işlem tarihine göre karşılaştır
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (dateB !== dateA) {
          // Tarihler farklıysa tarihe göre sırala (en yeni en üstte)
          return dateB - dateA;
        }
        
        // Tarihler aynıysa createdAt'e göre sırala (en yeni en üstte)
        // createdAt varsa kullan, yoksa date'i kullan
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : dateA;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : dateB;
        return createdB - createdA;
      });
      
      setAllTransactionsForTable(allTransactions);
    } catch (error) {
      console.error('Error loading all transactions:', error);
      setAllTransactionsForTable([]);
    } finally {
      setLoadingTableTransactions(false);
    }
  }, [allInvestmentsForTable]);

  // Investment'lar değiştiğinde transaction'ları otomatik yükle
  React.useEffect(() => {
    loadAllTransactions();
  }, [loadAllTransactions]);

  // Pagination hesaplamaları
  const totalPages = Math.ceil(allTransactionsForTable.length / itemsPerPage);
  const paginatedTransactions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allTransactionsForTable.slice(startIndex, endIndex);
  }, [allTransactionsForTable, currentPage, itemsPerPage]);

  // Sayfa değiştiğinde scroll'u yukarı al
  React.useEffect(() => {
    if (currentPage > 1) {
      const tableElement = document.querySelector('[data-table-container]');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage]);

  // Hisse senetleri ve fonlar
  const stockInvestments = activeInvestments.filter(inv => {
    const displayType = (inv as any).displayType || inv.type;
    return displayType === 'stock' || displayType === 'fund';
  });
  // Döviz, altın, kripto ve değerli metaller
  const cryptoInvestments = activeInvestments.filter(inv => {
    const displayType = (inv as any).displayType || inv.type;
    return displayType === 'crypto' || displayType === 'forex' ||
      displayType === 'currency' || displayType === 'gold' ||
      displayType === 'preciousMetal';
  });

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
        <InvestmentsHeader onAddInvestment={() => setShowAddModal(true)} />

        <PortfolioSummaryCards
          totalInvested={totalInvested}
          totalValue={totalValue}
          totalGain={totalGain}
          totalGainPercentage={totalGainPercentage}
          activePositionCount={activeInvestments.length}
          roi={roi}
        />

        <CurrencyRatesPanel
          loadingRates={loadingRates}
          currenciesFetchTime={currenciesFetchTime}
          sortedCurrencies={sortedCurrencies}
          onOpenSelect={() => setIsSelectingCurrencies(true)}
          onDragEnd={handleCurrencyDragEnd}
          onToggleCurrency={toggleCurrencySelection}
        />

        <FundsRatesPanel
          loadingFunds={loadingFunds}
          sortedFunds={sortedFunds}
          onOpenSelect={() => setIsSelectingFunds(true)}
          onDragEnd={handleFundDragEnd}
          onRemoveFund={toggleFundSelection}
          onViewFundDetail={(code, name) => {
            setFundDetailModal({ isOpen: true, fundCode: code, fundName: name });
          }}
        />

        <BorsaStocksPanel
          loadingBorsa={loadingBorsa}
          borsaDataLength={borsaData.length}
          borsaFetchTime={borsaFetchTime}
          sortedStocks={sortedStocks}
          onOpenSelect={() => setIsSelectingHisse(true)}
          onDragEnd={handleDragEnd}
          onRemoveStock={toggleHisseSelection}
        />

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

        <InvestmentCategoryColumns
          stockInvestments={stockInvestments}
          cryptoInvestments={cryptoInvestments}
          onSelectInvestment={setSelectedInvestment}
        />

        <InvestmentsTransactionsTable
          loadingTableTransactions={loadingTableTransactions}
          totalRowCount={allTransactionsForTable.length}
          paginatedTransactions={paginatedTransactions as PortfolioTransactionRow[]}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
          allInvestmentsForLookup={allInvestmentsForTable}
          onViewInvestment={setSelectedInvestment}
          onEditTransaction={(p) =>
            setEditingTransaction({
              investmentId: p.investmentId,
              transactionId: p.transactionId,
              transaction: p.transaction
            })
          }
          onDeleteTransaction={(p) =>
            setTransactionToDelete({
              investmentId: p.investmentId,
              transactionId: p.transactionId,
              transaction: p.transaction
            })
          }
        />

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
          onUpdateTransaction={async (investmentId, transactionId, updates) => {
            const { updateInvestmentTransaction } = await import('../../services/investmentService');
            await updateInvestmentTransaction(investmentId, transactionId, updates);
            await refreshInvestments();
            // Transaction'ları da yeniden yükle
            setTimeout(() => {
              loadAllTransactions();
            }, 100);
          }}
          onDeleteTransaction={async (investmentId, transactionId) => {
            const { deleteInvestmentTransaction } = await import('../../services/investmentService');
            await deleteInvestmentTransaction(investmentId, transactionId);
            await refreshInvestments();
            // Transaction'ları da yeniden yükle
            setTimeout(() => {
              loadAllTransactions();
            }, 100);
          }}
          onRefresh={refreshInvestments}
        />

        {/* Add Investment Modal */}
        <AddInvestmentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (formData) => {
            if (isAddingInvestment) return;

            setIsAddingInvestment(true);
            try {
              const quantity = parseFloat(formData.quantity);
              const price = parseFloat(formData.price);
              const totalAmount = quantity * price;

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

              // Bu symbol için investment var mı kontrol et
              const existingInvestment = investments.find(
                inv => inv.symbol === formData.symbol && inv.type === investmentType
              );

              let investmentId: string;

              if (existingInvestment) {
                // Mevcut investment'a transaction ekle
                investmentId = existingInvestment.id;
              } else {
                // Yeni investment oluştur
                const newInvestment = {
                  symbol: formData.symbol,
                  name: formData.name,
                  type: investmentType,
                  quantity: formData.transactionType === 'buy' ? quantity : 0,
                  averagePrice: price,
                  currentPrice: price,
                  totalValue: formData.transactionType === 'buy' ? totalAmount : 0,
                  profitLoss: 0,
                  profitLossPercentage: 0
                };

                // Backend'e gönder
                const response = await investmentAPI.create(newInvestment);
                if (response.success && response.id) {
                  investmentId = response.id;
                } else {
                  throw new Error(t('toast.createFailed'));
                }
              }

              // Transaction ekle
              const transaction = {
                type: formData.transactionType,
                quantity: quantity,
                price: price,
                totalAmount: totalAmount,
                date: formData.date
              };

              await addInvestmentTransaction(investmentId, transaction);

              // Investments'ı yenile
              await refreshInvestments();
              
              // Transaction'ları da yeniden yükle (tablo güncellenmesi için)
              // refreshInvestments sonrası allInvestmentsForTable güncellenecek,
              // ama hemen güncellenmesi için kısa bir gecikme ekleyelim
              setTimeout(() => {
                loadAllTransactions();
              }, 100);

              setShowAddModal(false);
            } catch (error: any) {
              console.error('Yatırım ekleme hatası:', error);
              let errorMessage = error?.message || error?.error || t('toast.unknownError');

              if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('insufficient')) {
                errorMessage = t('toast.permissionError');
              }

              toast.error(t('toast.investmentError', { message: errorMessage }));
            } finally {
              setIsAddingInvestment(false);
            }
          }}
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

        {/* Edit Investment Modal */}
        <EditInvestmentModal
          investment={editingInvestment}
          isOpen={!!editingInvestment}
          onClose={() => setEditingInvestment(null)}
          onUpdate={async (id, updates) => {
            await updateInvestment(id, updates);
            await refreshInvestments();
            setEditingInvestment(null);
          }}
          allCurrencies={allCurrencies}
          allFunds={allFunds}
          allStocks={borsaData}
        />

        {/* Delete Investment Modal */}
        <DeleteInvestmentModal
          investment={investmentToDelete}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setInvestmentToDelete(null);
          }}
          onConfirm={async () => {
            if (!investmentToDelete) return;
            try {
              await deleteInvestment(investmentToDelete.id);
              await refreshInvestments();
              setShowDeleteModal(false);
              setInvestmentToDelete(null);
            } catch (error: any) {
              console.error('Yatırım silme hatası:', error);
              const errorMessage = error?.message || error?.error || t('toast.unknownError');
              toast.error(t('toast.deleteError', { message: errorMessage }));
            }
          }}
        />

        {/* Edit Investment Transaction Modal */}
        <EditInvestmentTransactionModal
          transaction={editingTransaction?.transaction || null}
          investmentId={editingTransaction?.investmentId || ''}
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onUpdate={async (investmentId, transactionId, updates) => {
            const { updateInvestmentTransaction } = await import('../../services/investmentService');
            await updateInvestmentTransaction(investmentId, transactionId, updates);
            await refreshInvestments();
            setEditingTransaction(null);
            // Transaction'ları da yeniden yükle
            setTimeout(() => {
              loadAllTransactions();
            }, 100);
          }}
        />

        {/* Delete Investment Transaction Modal */}
        <DeleteInvestmentTransactionModal
          transaction={transactionToDelete?.transaction || null}
          investmentId={transactionToDelete?.investmentId || ''}
          isOpen={!!transactionToDelete}
          onClose={() => setTransactionToDelete(null)}
          onDelete={async (investmentId, transactionId) => {
            const { deleteInvestmentTransaction } = await import('../../services/investmentService');
            await deleteInvestmentTransaction(investmentId, transactionId);
            await refreshInvestments();
            setTransactionToDelete(null);
            // Transaction'ları da yeniden yükle
            setTimeout(() => {
              loadAllTransactions();
            }, 100);
          }}
        />
      </div>
    </div>
  );
};

export default Investments;