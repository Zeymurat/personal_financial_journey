import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { QuickTransaction } from '../../../types';
import { TRANSACTION_CURRENCIES } from '../constants';
import { formatTrMoneyInput, formatTrMoneyFromNumber, parseTrMoneyString } from '../../../utils/trNumberInput';

export interface QuickActionSetupModalProps {
  isOpen: boolean;
  action: QuickTransaction | null;
  onClose: () => void;
  onSave: (data: Omit<QuickTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: {
    income: string[];
    expense: string[];
  };
}

const QuickActionSetupModal: React.FC<QuickActionSetupModalProps> = ({
  isOpen,
  action,
  onClose,
  onSave,
  categories
}) => {
  const { t } = useTranslation('transactions');
  const { t: tCommon } = useTranslation('common');
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    currency: 'TRY'
  });

  useEffect(() => {
    if (action) {
      setFormData({
        name: action.name,
        type: action.type,
        amount: formatTrMoneyFromNumber(action.amount, 2),
        category: action.category,
        description: action.description,
        currency: action.currency || 'TRY'
      });
    } else {
      setFormData({
        name: '',
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        currency: 'TRY'
      });
    }
  }, [action]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.category || !formData.description) {
      toast.error(t('quickActions.setup.fillAllFields'));
      return;
    }
    const amount = parseTrMoneyString(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(t('form.amountInvalid'));
      return;
    }
    onSave({
      name: formData.name,
      type: formData.type,
      amount,
      category: formData.category,
      description: formData.description,
      currency: formData.currency
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 !mt-0 !mb-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {action ? t('quickActions.setup.titleEdit') : t('quickActions.setup.titleCreate')}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t('quickActions.setup.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t('quickActions.setup.nameLabel')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder={t('quickActions.setup.namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t('quickActions.setup.descriptionLabel')}
            </label>
            <input
              type="text"
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              placeholder={t('quickActions.setup.descriptionPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t('quickActions.setup.transactionType')}
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'income' | 'expense',
                  category: ''
                })
              }
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="income">{t('labels.income')}</option>
              <option value="expense">{t('labels.expense')}</option>
            </select>
          </div>

          <div className="grid grid-cols-[2fr_1.3fr] gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('quickActions.setup.amount')}
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: formatTrMoneyInput(e.target.value) })
                }
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t('quickActions.setup.currency')}
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                required
              >
                {TRANSACTION_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t('quickActions.setup.category')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              required
            >
              <option value="">{t('quickActions.setup.selectCategory')}</option>
              {categories[formData.type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-semibold"
            >
              {tCommon('actions.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
            >
              {action ? t('quickActions.setup.update') : tCommon('actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickActionSetupModal;
