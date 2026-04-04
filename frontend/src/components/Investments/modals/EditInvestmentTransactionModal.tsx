import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ModalPortal } from '../../common/ModalPortal';
import { X, Save, TrendingUp, TrendingDown } from 'lucide-react';
import { InvestmentTransaction } from '../../../types';
import { formatTrMoneyInput, formatTrMoneyFromNumber, parseTrMoneyString } from '../../../utils/trNumberInput';

const INV_AMOUNT_FRAC = 8;

interface EditInvestmentTransactionModalProps {
  transaction: InvestmentTransaction | null;
  investmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (investmentId: string, transactionId: string, updates: Partial<InvestmentTransaction>) => Promise<void>;
}

const EditInvestmentTransactionModal: React.FC<EditInvestmentTransactionModalProps> = ({
  transaction,
  investmentId,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { t } = useTranslation('investments');
  const [formData, setFormData] = useState({
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    date: '',
    fees: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        type: transaction.type || 'buy',
        quantity: formatTrMoneyFromNumber(Number(transaction.quantity) || 0, INV_AMOUNT_FRAC),
        price: formatTrMoneyFromNumber(Number(transaction.price) || 0, INV_AMOUNT_FRAC),
        date: transaction.date || new Date().toISOString().split('T')[0],
        fees: formatTrMoneyFromNumber(Number(transaction.fees ?? 0) || 0, INV_AMOUNT_FRAC)
      });
    }
  }, [transaction, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseTrMoneyString(formData.quantity);
    const price = parseTrMoneyString(formData.price);
    const feesParsed = parseTrMoneyString(formData.fees);
    const fees = Number.isNaN(feesParsed) ? 0 : Math.max(0, feesParsed);
    const totalAmount = quantity * price;

    if (Number.isNaN(quantity) || quantity <= 0) {
      toast.error(t('addModal.validQuantity'));
      return;
    }

    if (Number.isNaN(price) || price <= 0) {
      toast.error(t('addModal.validPrice'));
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate(investmentId, transaction!.id, {
        type: formData.type,
        quantity: quantity,
        price: price,
        totalAmount: totalAmount,
        date: formData.date,
        fees: fees
      });
      toast.success(t('editTransactionModal.success'));
      onClose();
    } catch (error: any) {
      console.error('İşlem güncelleme hatası:', error);
      const errorMessage = error?.message || error?.error || t('toast.unknownError');
      toast.error(t('editTransactionModal.error', { message: errorMessage }));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <ModalPortal>
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] !mt-0 !mb-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('editTransactionModal.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('editTransactionModal.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              {t('form.transactionType')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'buy'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.type === 'buy'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                  formData.type === 'buy'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-slate-200 dark:text-slate-600 hover:text-slate-300 dark:hover:text-slate-500'
                }`} />
                <span className={`font-semibold ${formData.type === 'buy'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-slate-200 dark:text-slate-600 hover:text-slate-300 dark:hover:text-slate-500'
                }`}>{t('types.buy')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, type: 'sell'})}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.type === 'sell'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${
                  formData.type === 'sell'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-slate-200 dark:text-slate-600 hover:text-slate-300 dark:hover:text-slate-500'
                }`} />
                <span className={`font-semibold ${formData.type === 'sell'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-slate-200 dark:text-slate-600 hover:text-slate-300 dark:hover:text-slate-500'
                }`}>{t('types.sell')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('form.quantity')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: formatTrMoneyInput(e.target.value, INV_AMOUNT_FRAC)
                  })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('form.unitPrice')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: formatTrMoneyInput(e.target.value, INV_AMOUNT_FRAC)
                  })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('form.transactionDate')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('form.fees')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={formData.fees}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fees: formatTrMoneyInput(e.target.value, INV_AMOUNT_FRAC)
                  })
                }
                className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
              disabled={isUpdating}
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdating}
            >
              <Save className="w-5 h-5" />
              <span>{isUpdating ? t('form.saving') : t('form.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

export default EditInvestmentTransactionModal;
