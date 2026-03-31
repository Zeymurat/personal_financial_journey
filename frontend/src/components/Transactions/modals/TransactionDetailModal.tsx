import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, Edit, Trash2 } from 'lucide-react';
import { Transaction } from '../../../types';

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'CHF ',
    'AUD': 'A$',
    'CAD': 'C$',
    'CNY': '¥'
  };
  return symbols[currency] || currency;
};

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onEdit,
  onDelete
}) => {
  const { t, i18n } = useTranslation('transactions');

  if (!transaction) return null;

  const locale = i18n.language;
  const currencyLong =
    t(`currencyLong.${transaction.currency}`, { defaultValue: transaction.currency }) || transaction.currency;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 !mt-0 !mb-0"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-200/50 dark:border-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t('detail.title')}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('detail.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center space-x-4 px-6 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
            <div className={`p-4 rounded-2xl shadow-lg ${
              transaction.type === 'income' 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                : 'bg-gradient-to-r from-rose-500 to-red-600'
            }`}>
              {transaction.type === 'income' ? (
                <ArrowUpRight className="w-5 h-5 text-white" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white text-lg">
                {transaction.description}
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-semibold">
                {transaction.type === 'income' ? t('detail.incomeLabel') : t('detail.expenseLabel')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-6 py-3">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-2">{t('detail.amount')}</p>
                <p className={`text-xl font-black ${
                  transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {getCurrencySymbol(transaction.currency)}
                  {transaction.amount.toLocaleString()}
                </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-6 py-3">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400  tracking-wide mb-2">{t('detail.category')}</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {transaction.category}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-6 py-3">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-2">{t('detail.date')}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {new Date(transaction.date).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl px-6 py-3">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wide mb-2">{t('detail.currency')}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {transaction.currency} - {currencyLong}
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              onClick={() => {
                onEdit(transaction);
                onClose();
              }}
              className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <Edit className="w-5 h-5" />
              <span>{t('detail.edit')}</span>
            </button>
            <button
              onClick={() => {
                onDelete(transaction);
                onClose();
              }}
              className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-5 h-5" />
              <span>{t('detail.delete')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
