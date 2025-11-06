import React from 'react';
import { X, Search } from 'lucide-react';
import { SelectedFund } from '../../services/userSettingsService';

interface FundsSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allFunds: Array<{ key: string; value: string }>;
  selectedFunds: SelectedFund[];
  onSelectionChange: (selectedFunds: SelectedFund[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  toggleFundSelection: (key: string) => void;
}

const FundsSelectionModal: React.FC<FundsSelectionModalProps> = ({
  isOpen,
  onClose,
  allFunds,
  selectedFunds,
  searchQuery,
  onSearchChange,
  toggleFundSelection
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Yatırım Fonları Seç
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Görmek istediğiniz yatırım fonlarını seçin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seçili sayısı */}
        {selectedFunds.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">{selectedFunds.length}</span> fon seçili
            </p>
          </div>
        )}

        {/* Arama çubuğu */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Fon adı veya key ile ara (örn: AKBNK, Garanti)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Funds listesi */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {(() => {
            // Arama sorgusuna göre filtrele
            const filteredFunds = allFunds.filter((fund) => {
              if (!searchQuery.trim()) return true;
              const query = searchQuery.toLowerCase().trim();
              return (
                fund.key.toLowerCase().includes(query) ||
                fund.value.toLowerCase().includes(query)
              );
            });

            if (filteredFunds.length === 0) {
              return (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    "{searchQuery}" için sonuç bulunamadı
                  </p>
                </div>
              );
            }

            return filteredFunds.map((fund) => {
              const isSelected = selectedFunds.some(sf => sf.key === fund.key);
              return (
                <label
                  key={fund.key}
                  className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <span className="text-base font-bold text-gray-900 dark:text-white block">
                        {fund.key}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {fund.value}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFundSelection(fund.key)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                    />
                  </div>
                </label>
              );
            });
          })()}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedFunds.length > 0 ? (
              <span>{selectedFunds.length} fon seçili</span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">En az bir fon seçmelisiniz</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={onClose}
              disabled={selectedFunds.length === 0}
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

export default FundsSelectionModal;

