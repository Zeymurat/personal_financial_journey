import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Filter } from 'lucide-react';
import type { ComparisonItem, CurrencyRate } from './types';

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

interface AddToTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCurrencies: CurrencyRate[];
  borsaData: StockData[];
  allFunds: Array<{ key: string; value: string }>;
  allComparisonItems: ComparisonItem[];
  temporaryItems: ComparisonItem[];
  onAddItem: (item: ComparisonItem) => void;
  onRemoveItem: (itemId: string) => void;
}

const AddToTableModal: React.FC<AddToTableModalProps> = ({
  isOpen,
  onClose,
  allCurrencies,
  borsaData,
  allFunds,
  allComparisonItems,
  temporaryItems,
  onAddItem,
  onRemoveItem
}) => {
  const { t } = useTranslation('trackCompare');
  const [modalSearchTerm, setModalSearchTerm] = useState<string>('');
  const [modalTypeFilter, setModalTypeFilter] = useState<string>('all');

  // Tip badge rengi
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'currency':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'gold':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'crypto':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'metal':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
      case 'fund':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'stock':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleClose = () => {
    setModalSearchTerm('');
    setModalTypeFilter('all');
    onClose();
  };

  const handleCurrencyClick = (currency: CurrencyRate) => {
    const isInTable = allComparisonItems.some(item =>
      (item.type === 'currency' || item.type === 'gold' || item.type === 'crypto' || item.type === 'metal') &&
      item.code === currency.code
    );

    if (isInTable) {
      // Tabloda varsa kaldır (geçici ise)
      const tempItem = temporaryItems.find(t =>
        t.code === currency.code &&
        (t.type === 'currency' || t.type === 'gold' || t.type === 'crypto' || t.type === 'metal')
      );
      if (tempItem) {
        onRemoveItem(tempItem.id);
      }
    } else {
      // Tabloda yoksa ekle
      const newItem: ComparisonItem = {
        id: `temp-currency-${currency.code}-${Date.now()}`,
        name: currency.name,
        code: currency.code,
        type: currency.type || 'currency',
        price: currency.rate,
        change: currency.change,
        buy: currency.buy,
        sell: currency.sell,
        order: 0
      };
      onAddItem(newItem);
    }
  };

  const handleStockClick = (stock: StockData) => {
    const isInTable = allComparisonItems.some(item =>
      item.type === 'stock' && item.code === stock.code
    );

    if (isInTable) {
      // Tabloda varsa kaldır (geçici ise)
      const tempItem = temporaryItems.find(t =>
        t.code === stock.code && t.type === 'stock'
      );
      if (tempItem) {
        onRemoveItem(tempItem.id);
      }
    } else {
      // Tabloda yoksa ekle
      const newItem: ComparisonItem = {
        id: `temp-stock-${stock.code}-${Date.now()}`,
        name: stock.name,
        code: stock.code,
        type: 'stock',
        price: stock.last_price || stock.rate || 0,
        change: stock.rate || 0,
        order: 0
      };
      onAddItem(newItem);
    }
  };

  const handleFundClick = (fund: { key: string; value: string }) => {
    const isInTable = allComparisonItems.some(item =>
      item.type === 'fund' && item.code === fund.key
    );

    if (isInTable) {
      // Tabloda varsa kaldır (geçici ise)
      const tempItem = temporaryItems.find(t =>
        t.code === fund.key && t.type === 'fund'
      );
      if (tempItem) {
        onRemoveItem(tempItem.id);
      }
    } else {
      // Tabloda yoksa ekle
      const newItem: ComparisonItem = {
        id: `temp-fund-${fund.key}-${Date.now()}`,
        name: fund.value,
        code: fund.key,
        type: 'fund',
        price: 0,
        change: 0,
        order: 0
      };
      onAddItem(newItem);
    }
  };

  // Filtrelenmiş varlıklar
  const filteredCurrencies = useMemo(() => {
    return allCurrencies
      .filter(c => c.code !== 'TRY')
      .filter(c => {
        // Tip filtresi
        if (modalTypeFilter !== 'all') {
          const typeMap: Record<string, string> = {
            'currency': 'currency',
            'gold': 'gold',
            'crypto': 'crypto',
            'metal': 'metal'
          };
          if (typeMap[modalTypeFilter] && c.type !== typeMap[modalTypeFilter]) {
            return false;
          }
        }

        // Arama filtresi
        if (modalSearchTerm) {
          const searchLower = modalSearchTerm.toLowerCase();
          if (!c.name.toLowerCase().includes(searchLower) && !c.code.toLowerCase().includes(searchLower)) {
            return false;
          }
        }

        return true;
      });
  }, [allCurrencies, modalTypeFilter, modalSearchTerm]);

  const filteredStocks = useMemo(() => {
    return borsaData.filter(stock => {
      // Tip filtresi
      if (modalTypeFilter !== 'all' && modalTypeFilter !== 'stock') {
        return false;
      }

      // Arama filtresi
      if (modalSearchTerm) {
        const searchLower = modalSearchTerm.toLowerCase();
        if (!stock.name.toLowerCase().includes(searchLower) && !stock.code.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [borsaData, modalTypeFilter, modalSearchTerm]);

  const filteredFunds = useMemo(() => {
    return allFunds.filter(fund => {
      // Tip filtresi
      if (modalTypeFilter !== 'all' && modalTypeFilter !== 'fund') {
        return false;
      }

      // Arama filtresi
      if (modalSearchTerm) {
        const searchLower = modalSearchTerm.toLowerCase();
        if (!fund.value.toLowerCase().includes(searchLower) && !fund.key.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [allFunds, modalTypeFilter, modalSearchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addModal.title')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('addModal.subtitle')}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Arama ve Filtreleme */}
        <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('addModal.searchPlaceholder')}
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={modalTypeFilter}
                onChange={(e) => setModalTypeFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">{t('addModal.filterAll')}</option>
                <option value="currency">{t('addModal.currency')}</option>
                <option value="gold">{t('addModal.gold')}</option>
                <option value="crypto">{t('addModal.crypto')}</option>
                <option value="metal">{t('addModal.metal')}</option>
                <option value="fund">{t('addModal.fund')}</option>
                <option value="stock">{t('addModal.stock')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Döviz/Kripto/Altın/Metal */}
            {(modalTypeFilter === 'all' || modalTypeFilter === 'currency' || modalTypeFilter === 'gold' || modalTypeFilter === 'crypto' || modalTypeFilter === 'metal') && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('addModal.sectionMixed')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredCurrencies.map((currency) => {
                    const isInTable = allComparisonItems.some(item =>
                      (item.type === 'currency' || item.type === 'gold' || item.type === 'crypto' || item.type === 'metal') &&
                      item.code === currency.code
                    );

                    return (
                      <button
                        key={currency.code}
                        onClick={() => handleCurrencyClick(currency)}
                        className={`p-3 border rounded-lg transition-all text-left group ${isInTable
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">{currency.code}</div>
                          {isInTable && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{currency.name}</div>
                        {!isInTable && (
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Ekle →</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hisse Senetleri */}
            {borsaData.length > 0 && (modalTypeFilter === 'all' || modalTypeFilter === 'stock') && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('addModal.sectionStocks')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredStocks.map((stock) => {
                    const isInTable = allComparisonItems.some(item =>
                      item.type === 'stock' && item.code === stock.code
                    );

                    return (
                      <button
                        key={stock.code}
                        onClick={() => handleStockClick(stock)}
                        className={`p-3 border rounded-lg transition-all text-left group ${isInTable
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">{stock.code}</div>
                          {isInTable && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{stock.name}</div>
                        {!isInTable && (
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Ekle →</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Yatırım Fonları */}
            {allFunds.length > 0 && (modalTypeFilter === 'all' || modalTypeFilter === 'fund') && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Yatırım Fonları
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredFunds.map((fund) => {
                    const isInTable = allComparisonItems.some(item =>
                      item.type === 'fund' && item.code === fund.key
                    );

                    return (
                      <button
                        key={fund.key}
                        onClick={() => handleFundClick(fund)}
                        className={`p-3 border rounded-lg transition-all text-left group ${isInTable
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">{fund.key}</div>
                          {isInTable && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{fund.value}</div>
                        {!isInTable && (
                          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Ekle →</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {temporaryItems.length > 0 && t('addModal.addedCount', { count: temporaryItems.length })}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
            >
              {t('addModal.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToTableModal;

