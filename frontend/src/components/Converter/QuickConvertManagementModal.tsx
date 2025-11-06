import React from 'react';
import { X } from 'lucide-react';
import { QuickConvert, addQuickConvert, removeQuickConvert, getQuickConverts } from '../../services/userSettingsService';

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}

interface QuickConvertManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCurrencies: CurrencyRate[];
  quickConverts: QuickConvert[];
  onConvertsChange: (converts: QuickConvert[]) => void;
  currentUserId?: string;
}

const QuickConvertManagementModal: React.FC<QuickConvertManagementModalProps> = ({
  isOpen,
  onClose,
  allCurrencies,
  quickConverts,
  onConvertsChange,
  currentUserId
}) => {
  const handleAddConvert = async () => {
    if (!currentUserId) return;

    const fromSelect = document.getElementById('newConvertFrom') as HTMLSelectElement;
    const toSelect = document.getElementById('newConvertTo') as HTMLSelectElement;
    const amountInput = document.getElementById('newConvertAmount') as HTMLInputElement;

    const from = fromSelect.value;
    const to = toSelect.value;
    const amount = parseFloat(amountInput.value);

    if (!from || !to || isNaN(amount) || amount <= 0) {
      alert('Lütfen geçerli bir çevirim girin.');
      return;
    }

    if (from === to) {
      alert('Kaynak ve hedef para birimi aynı olamaz.');
      return;
    }

    // Aynı çevirim zaten var mı kontrol et
    const exists = quickConverts.some(c =>
      c.from === from && c.to === to && c.amount === amount
    );

    if (exists) {
      alert('Bu çevirim zaten mevcut.');
      return;
    }

    try {
      await addQuickConvert(currentUserId, from, to, amount);
      const updated = await getQuickConverts(currentUserId);
      onConvertsChange(updated);

      // Formu sıfırla
      amountInput.value = '100';
    } catch (error) {
      console.error('❌ Çevirim eklenirken hata:', error);
      alert('Çevirim eklenirken bir hata oluştu.');
    }
  };

  const handleRemoveConvert = async (convert: QuickConvert) => {
    if (!currentUserId) return;
    try {
      await removeQuickConvert(currentUserId, convert.from, convert.to, convert.amount);
      onConvertsChange(quickConverts.filter(c =>
        !(c.from === convert.from && c.to === convert.to && c.amount === convert.amount)
      ));
    } catch (error) {
      console.error('❌ Çevirim çıkarılırken hata:', error);
      alert('Çevirim çıkarılırken bir hata oluştu.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Hızlı Çevirimleri Yönet
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Yeni çevirim ekleyin veya mevcut çevirimleri düzenleyin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Yeni Çevirim Ekleme Formu */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yeni Çevirim Ekle</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kaynak Para Birimi
              </label>
              <select
                id="newConvertFrom"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hedef Para Birimi
              </label>
              <select
                id="newConvertTo"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allCurrencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Miktar
              </label>
              <input
                type="number"
                id="newConvertAmount"
                defaultValue="100"
                min="0.01"
                step="0.01"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={handleAddConvert}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Çevirim Ekle
          </button>
        </div>

        {/* Mevcut Çevirimler Listesi */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mevcut Çevirimler</h3>
          {quickConverts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Henüz çevirim eklenmemiş.
            </p>
          ) : (
            <div className="space-y-2">
              {quickConverts.map((convert) => (
                <div
                  key={`${convert.from}_${convert.to}_${convert.amount}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {convert.amount} {convert.from} → {convert.to}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveConvert(convert)}
                    className="p-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-red-600 dark:text-red-400 transition-colors"
                    title="Çevirimi sil"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickConvertManagementModal;

