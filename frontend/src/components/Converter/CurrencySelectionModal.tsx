import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { SelectedCurrency, addSelectedCurrency, removeSelectedCurrency } from '../../services/userSettingsService';

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}

interface CurrencySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCurrencies: CurrencyRate[];
  selectedCurrencies: SelectedCurrency[];
  onSelectionChange: (currencies: SelectedCurrency[]) => void;
  exchangeRates: Record<string, CurrencyRate>;
  goldPrices: Record<string, CurrencyRate>;
  cryptoCurrencies: Record<string, CurrencyRate>;
  preciousMetals: Record<string, CurrencyRate>;
  currentUserId?: string;
  onToggle?: (currencyCode: string) => void; // Optional: Eğer verilirse, modal kendi toggle fonksiyonunu kullanmak yerine bunu kullanır
}

const CurrencySelectionModal: React.FC<CurrencySelectionModalProps> = ({
  isOpen,
  onClose,
  allCurrencies,
  selectedCurrencies,
  onSelectionChange,
  exchangeRates,
  goldPrices,
  cryptoCurrencies,
  preciousMetals,
  currentUserId,
  onToggle
}) => {
  const [searchCurrencyQuery, setSearchCurrencyQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<{
    all: boolean;
    currency: boolean;
    gold: boolean;
    crypto: boolean;
    metal: boolean;
  }>({
    all: true,
    currency: true,
    gold: true,
    crypto: true,
    metal: true
  });

  // Currency seç/çıkar
  const toggleCurrencySelection = async (currencyCode: string) => {
    // Eğer onToggle prop'u verilmişse, onu kullan
    if (onToggle) {
      onToggle(currencyCode);
      return;
    }

    // Yoksa eski davranışı koru (backward compatibility)
    if (!currentUserId) return;

    const isSelected = selectedCurrencies.some(sc => sc.code === currencyCode);

    if (isSelected) {
      // Çıkar
      await removeSelectedCurrency(currentUserId, currencyCode);
      onSelectionChange(selectedCurrencies.filter(sc => sc.code !== currencyCode));
    } else {
      // Ekle (en sona)
      const maxOrder = selectedCurrencies.length > 0
        ? Math.max(...selectedCurrencies.map(sc => sc.order))
        : -1;
      await addSelectedCurrency(currentUserId, currencyCode, maxOrder + 1);
      onSelectionChange([...selectedCurrencies, { code: currencyCode, order: maxOrder + 1 }]);
    }
  };

  const handleClose = () => {
    setSearchCurrencyQuery('');
    setSelectedCategories({
      all: true,
      currency: true,
      gold: true,
      crypto: true,
      metal: true
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Döviz, Altın, Kripto ve Değerli Metaller Seç
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Görmek istediğiniz döviz kurlarını, altın fiyatlarını, kripto paraları ve değerli metalleri seçin.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seçili sayısı */}
        {selectedCurrencies.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">{selectedCurrencies.length}</span> öğe seçili
            </p>
          </div>
        )}

        {/* Kategori Filtreleri - Modern Tasarım */}
        <div className="mb-4 p-5 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-800/50 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 tracking-wide">Kategori Filtresi</p>
            <div className="flex items-center space-x-2">
              <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {Object.values(selectedCategories).filter(Boolean).length - (selectedCategories.all ? 1 : 0)} aktif
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {/* Hepsi */}
            <button
              onClick={() => {
                const checked = !selectedCategories.all;
                setSelectedCategories({
                  all: checked,
                  currency: checked,
                  gold: checked,
                  crypto: checked,
                  metal: checked
                });
              }}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategories.all
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              Hepsi
            </button>

            {/* Döviz */}
            <button
              onClick={() => {
                const checked = !selectedCategories.currency;
                setSelectedCategories(prev => {
                  const newState = { ...prev, currency: checked };
                  if (newState.currency && newState.gold && newState.crypto && newState.metal) {
                    newState.all = true;
                  } else {
                    newState.all = false;
                  }
                  return newState;
                });
              }}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategories.currency
                  ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
              }`}
            >
              💱 Döviz
            </button>

            {/* Altın */}
            <button
              onClick={() => {
                const checked = !selectedCategories.gold;
                setSelectedCategories(prev => {
                  const newState = { ...prev, gold: checked };
                  if (newState.currency && newState.gold && newState.crypto && newState.metal) {
                    newState.all = true;
                  } else {
                    newState.all = false;
                  }
                  return newState;
                });
              }}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategories.gold
                  ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
              }`}
            >
              🥇 Altın
            </button>

            {/* Kripto */}
            <button
              onClick={() => {
                const checked = !selectedCategories.crypto;
                setSelectedCategories(prev => {
                  const newState = { ...prev, crypto: checked };
                  if (newState.currency && newState.gold && newState.crypto && newState.metal) {
                    newState.all = true;
                  } else {
                    newState.all = false;
                  }
                  return newState;
                });
              }}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategories.crypto
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              ₿ Kripto
            </button>

            {/* Değerli Metal */}
            <button
              onClick={() => {
                const checked = !selectedCategories.metal;
                setSelectedCategories(prev => {
                  const newState = { ...prev, metal: checked };
                  if (newState.currency && newState.gold && newState.crypto && newState.metal) {
                    newState.all = true;
                  } else {
                    newState.all = false;
                  }
                  return newState;
                });
              }}
              className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                selectedCategories.metal
                  ? 'bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white shadow-lg shadow-teal-500/30 dark:shadow-teal-500/20'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
              }`}
            >
              💎 Değerli Metal
            </button>
          </div>
        </div>

        {/* Arama çubuğu */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Döviz kodu veya adı ile ara (örn: USD, Euro, Bitcoin)"
              value={searchCurrencyQuery}
              onChange={(e) => setSearchCurrencyQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-blue-900/20 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchCurrencyQuery && (
              <button
                onClick={() => setSearchCurrencyQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Kategorilere göre grupla */}
        {(() => {
          const currencies = allCurrencies.filter(c => c.code !== 'TRY');
          const currencyCodes = new Set(Object.keys(exchangeRates).filter(c => c !== 'TRY'));
          const goldCodes = new Set(Object.keys(goldPrices));
          const cryptoCodes = new Set(Object.keys(cryptoCurrencies));
          const metalCodes = new Set(Object.keys(preciousMetals));

          // Önce arama sorgusuna göre filtrele
          const filteredCurrencies = currencies.filter((c) => {
            if (!searchCurrencyQuery.trim()) return true;
            const query = searchCurrencyQuery.toLowerCase().trim();
            return (
              c.code.toLowerCase().includes(query) ||
              c.name.toLowerCase().includes(query)
            );
          });

          // Kategori filtrelerine göre filtrele
          let currencyList = filteredCurrencies.filter(c => currencyCodes.has(c.code));
          let goldList = filteredCurrencies.filter(c => goldCodes.has(c.code));
          let cryptoList = filteredCurrencies.filter(c => cryptoCodes.has(c.code));
          let metalList = filteredCurrencies.filter(c => metalCodes.has(c.code));

          // Eğer kategori filtresi varsa, seçili olmayan kategorileri gizle
          if (!selectedCategories.all) {
            if (!selectedCategories.currency) currencyList = [];
            if (!selectedCategories.gold) goldList = [];
            if (!selectedCategories.crypto) cryptoList = [];
            if (!selectedCategories.metal) metalList = [];
          }

          // Hiçbir kategoride sonuç yoksa
          if (currencyList.length === 0 && goldList.length === 0 && cryptoList.length === 0 && metalList.length === 0 && (searchCurrencyQuery.trim() || !selectedCategories.all)) {
            return (
              <div className="text-center py-8 mb-6">
                <p className="text-gray-500 dark:text-gray-400">
                  "{searchCurrencyQuery}" için sonuç bulunamadı
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-6 mb-6">
              {/* Döviz Kurları */}
              {currencyList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    💱 Döviz Kurları
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {currencyList.map((currency) => {
                      const isSelected = selectedCurrencies.some(sc => sc.code === currency.code);
                      return (
                        <label
                          key={currency.code}
                          className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="text-base font-bold text-gray-900 dark:text-white block">
                                {currency.code}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {currency.name}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCurrencySelection(currency.code)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                            />
                          </div>
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Alış: ₺{currency.buy.toFixed(4)}
                                </span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Satış: ₺{currency.sell.toFixed(4)}
                                </span>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Altın Fiyatları */}
              {goldList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    🥇 Altın Fiyatları
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {goldList.map((currency) => {
                      const isSelected = selectedCurrencies.some(sc => sc.code === currency.code);
                      return (
                        <label
                          key={currency.code}
                          className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 shadow-md'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="text-base font-bold text-gray-900 dark:text-white block">
                                {currency.code}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {currency.name}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCurrencySelection(currency.code)}
                              className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 mt-0.5 cursor-pointer"
                            />
                          </div>
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Alış: ₺{currency.buy.toFixed(2)}
                                </span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Satış: ₺{currency.sell.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kripto Paralar */}
              {cryptoList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    ₿ Kripto Paralar
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {cryptoList.map((currency) => {
                      const isSelected = selectedCurrencies.some(sc => sc.code === currency.code);
                      return (
                        <label
                          key={currency.code}
                          className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="text-base font-bold text-gray-900 dark:text-white block">
                                {currency.code}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {currency.name}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCurrencySelection(currency.code)}
                              className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mt-0.5 cursor-pointer"
                            />
                          </div>
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Fiyat: ₺{currency.buy.toFixed(2)}
                                </span>
                                <span className={`text-xs font-medium ${
                                  currency.change >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {currency.change >= 0 ? '+' : ''}{currency.change.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Değerli Metaller */}
              {metalList.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    💎 Değerli Metaller
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {metalList.map((currency) => {
                      const isSelected = selectedCurrencies.some(sc => sc.code === currency.code);
                      return (
                        <label
                          key={currency.code}
                          className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-gray-500 bg-gray-50 dark:bg-gray-900/30 shadow-md'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="text-base font-bold text-gray-900 dark:text-white block">
                                {currency.code}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {currency.name}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCurrencySelection(currency.code)}
                              className="w-5 h-5 text-gray-600 rounded focus:ring-gray-500 mt-0.5 cursor-pointer"
                            />
                          </div>
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Alış: ₺{currency.buy.toFixed(2)}
                                </span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Satış: ₺{currency.sell.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCurrencies.length > 0 ? (
              <span>{selectedCurrencies.length} öğe seçili</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">En az bir öğe seçmelisiniz</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={handleClose}
              disabled={selectedCurrencies.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySelectionModal;

