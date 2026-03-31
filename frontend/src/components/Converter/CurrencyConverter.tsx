import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, Plus } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import {
  getSelectedCurrencies,
  saveSelectedCurrencies,
  SelectedCurrency,
  removeQuickConvert,
  QuickConvert
} from '../../services/userSettingsService';
import QuickConvertManagementModal from './modals/QuickConvertManagementModal';
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
  rectSortingStrategy
} from '@dnd-kit/sortable';
import SortableQuickConvertCard from './cards/SortableQuickConvertCard';
import type { CurrencyRate } from './types';

const CurrencyConverter: React.FC = () => {
  const { t } = useTranslation('converter');
  const { exchangeRates, goldPrices, cryptoCurrencies, preciousMetals } = useFinance();
  const { currentUser } = useAuth();

  useTokenValidation();
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('TRY');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [selectedCurrencies, setSelectedCurrencies] = useState<SelectedCurrency[]>([]);
  const [isSelectingCurrencies, setIsSelectingCurrencies] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  const [quickConverts, setQuickConverts] = useState<QuickConvert[]>([]);
  const [isManagingConversions, setIsManagingConversions] = useState<boolean>(false);
  const [isInitialLoadConversions, setIsInitialLoadConversions] = useState<boolean>(true);

  const allCurrencies: CurrencyRate[] = React.useMemo(() => {
    const currencies: CurrencyRate[] = [
      { code: 'TRY', name: t('tryName'), rate: 1, buy: 1, sell: 1, change: 0 }
    ];

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
  }, [exchangeRates, goldPrices, cryptoCurrencies, preciousMetals, t]);

  useEffect(() => {
    let isMounted = true;

    const loadSelectedCurrencies = async () => {
      if (currentUser?.id && allCurrencies.length > 1) {
        const saved = await getSelectedCurrencies(currentUser.id);

        if (!isMounted) return;

        if (saved && saved.length > 0) {
          setSelectedCurrencies(saved);
          console.log('✅ Seçili döviz kurları yüklendi:', saved);
        } else {
          const defaultCodes = ['USD', 'EUR', 'GBP'];
          const initialSelected = defaultCodes
            .filter((code) => allCurrencies.some((c) => c.code === code))
            .map((code, index) => ({ code, order: index }));

          if (initialSelected.length > 0 && isMounted) {
            setSelectedCurrencies(initialSelected);
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

  useEffect(() => {
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

    const timeoutId = setTimeout(() => {
      saveSelected();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, selectedCurrencies, isInitialLoad]);

  useEffect(() => {
    let isMounted = true;

    const loadQuickConverts = async () => {
      if (currentUser?.id) {
        try {
          const { getQuickConverts } = await import('../../services/userSettingsService');
          const saved = await getQuickConverts(currentUser.id);

          if (!isMounted) return;

          if (saved && saved.length > 0) {
            setQuickConverts(saved);
            console.log('✅ Hızlı çevirimler yüklendi:', saved);
          } else {
            const defaultConverts: QuickConvert[] = [
              { from: 'USD', to: 'TRY', amount: 100, order: 0 },
              { from: 'EUR', to: 'TRY', amount: 100, order: 1 },
              { from: 'TRY', to: 'USD', amount: 1000, order: 2 },
              { from: 'TRY', to: 'EUR', amount: 1000, order: 3 }
            ];

            if (isMounted) {
              setQuickConverts(defaultConverts);
              try {
                const { saveQuickConverts } = await import('../../services/userSettingsService');
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

  useEffect(() => {
    if (isInitialLoadConversions || !currentUser?.id || quickConverts.length === 0 || isManagingConversions) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { saveQuickConverts } = await import('../../services/userSettingsService');
        await saveQuickConverts(currentUser.id, quickConverts);
        console.log('💾 Hızlı çevirimler sıralaması kaydedildi');
      } catch (error) {
        console.error('❌ Hızlı çevirimler kaydedilirken hata:', error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [quickConverts, currentUser?.id, isInitialLoadConversions, isManagingConversions]);

  const sortedCurrencies = React.useMemo(() => {
    if (selectedCurrencies.length === 0) {
      return [];
    }

    return selectedCurrencies
      .sort((a, b) => a.order - b.order)
      .map((selected) => allCurrencies.find((c) => c.code === selected.code))
      .filter((c): c is CurrencyRate => c !== undefined && c.code !== 'TRY');
  }, [allCurrencies, selectedCurrencies]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedCurrencies((items) => {
        const oldIndex = items.findIndex((item) => item.code === active.id);
        const newIndex = items.findIndex((item) => item.code === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  const handleQuickConvertDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuickConverts((items) => {
        const oldIndex = items.findIndex(
          (item) => `${item.from}_${item.to}_${item.amount}` === active.id
        );
        const newIndex = items.findIndex(
          (item) => `${item.from}_${item.to}_${item.amount}` === over.id
        );

        if (oldIndex === -1 || newIndex === -1) return items;

        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  const handleCurrencySelectionChange = (currencies: SelectedCurrency[]) => {
    setSelectedCurrencies(currencies);
  };

  const toggleCurrencySelection = async (currencyCode: string) => {
    if (!currentUser?.id) return;

    const isSelected = selectedCurrencies.some((sc) => sc.code === currencyCode);

    if (isSelected) {
      const { removeSelectedCurrency } = await import('../../services/userSettingsService');
      await removeSelectedCurrency(currentUser.id, currencyCode);
      setSelectedCurrencies((prev) => prev.filter((sc) => sc.code !== currencyCode));
    }
  };

  const handleConvert = () => {
    const fromRate = allCurrencies.find((c) => c.code === fromCurrency)?.rate || 1;
    const toRate = allCurrencies.find((c) => c.code === toCurrency)?.rate || 1;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('meta.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('meta.subtitle')}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-100">{t('meta.disclaimer')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('form.amountToConvert')}
            </label>
            <div className="space-y-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('form.amountPlaceholder')}
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
            >
              <ArrowUpDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('form.convertedAmount')}
            </label>
            <div className="space-y-3">
              <div className="w-full p-4 text-2xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                {convertedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {(() => {
              const fromRate = allCurrencies.find((c) => c.code === fromCurrency)?.rate || 1;
              const toRate = allCurrencies.find((c) => c.code === toCurrency)?.rate || 1;
              const rateStr =
                fromCurrency === 'TRY'
                  ? (1 / toRate).toFixed(4)
                  : toCurrency === 'TRY'
                    ? fromRate.toFixed(4)
                    : (fromRate / toRate).toFixed(4);
              return t('form.rateLine', { from: fromCurrency, rate: rateStr, to: toCurrency });
            })()}
          </p>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('quick.title')}</h3>
          <button
            onClick={() => setIsManagingConversions(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 text-sm"
            title={t('quick.manageTitle')}
          >
            <Plus className="w-4 h-4" />
            <span>{t('quick.add')}</span>
          </button>
        </div>

        {quickConverts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('quick.empty')}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleQuickConvertDragEnd}
          >
            <SortableContext
              items={quickConverts.map((c) => `${c.from}_${c.to}_${c.amount}`)}
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
                        await removeQuickConvert(
                          currentUser.id,
                          convertToRemove.from,
                          convertToRemove.to,
                          convertToRemove.amount
                        );
                        setQuickConverts((prev) =>
                          prev.filter(
                            (c) =>
                              !(
                                c.from === convertToRemove.from &&
                                c.to === convertToRemove.to &&
                                c.amount === convertToRemove.amount
                              )
                          )
                        );
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
