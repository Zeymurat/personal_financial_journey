import React, { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { mockCurrencies } from '../data/mockData';

const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('TRY');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  const allCurrencies = [
    { code: 'TRY', name: 'Türk Lirası', rate: 1 },
    ...mockCurrencies
  ];

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
    if (amount) {
      handleConvert();
    }
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Döviz Çevirici</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Güncel kurlarla döviz çevirisi yapın</p>
        </div>
        <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200">
          <RefreshCw className="w-5 h-5" />
          <span>Kurları Güncelle</span>
        </button>
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

      {/* Currency Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Güncel Döviz Kurları</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">TRY bazında güncel kurlar</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {mockCurrencies.map((currency) => (
            <div key={currency.code} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{currency.code}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currency.name}</p>
                </div>
                <div className={`p-2 rounded-full ${
                  currency.change >= 0 
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
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ₺{currency.rate.toFixed(4)}
                </span>
                <span className={`text-sm font-medium ${
                  currency.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {currency.change >= 0 ? '+' : ''}{currency.change.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Conversions */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popüler Çevirimler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { from: 'USD', to: 'TRY', amount: 100 },
            { from: 'EUR', to: 'TRY', amount: 100 },
            { from: 'TRY', to: 'USD', amount: 1000 },
            { from: 'TRY', to: 'EUR', amount: 1000 }
          ].map((conversion, index) => {
            const fromRate = allCurrencies.find(c => c.code === conversion.from)?.rate || 1;
            const toRate = allCurrencies.find(c => c.code === conversion.to)?.rate || 1;
            
            let result: number;
            if (conversion.from === 'TRY') {
              result = conversion.amount / toRate;
            } else if (conversion.to === 'TRY') {
              result = conversion.amount * fromRate;
            } else {
              const inTRY = conversion.amount * fromRate;
              result = inTRY / toRate;
            }

            return (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {conversion.amount} {conversion.from}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.toFixed(2)} {conversion.to}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;