import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Debt } from '../../../types';
import { debtAPI } from '../../../services/apiService';
import { TRANSACTION_CURRENCIES, TRANSACTION_CATEGORIES } from '../../Transactions/constants';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import { toLocalDateString } from '../../../utils/localDate';
import { buildInstallmentDueDates, nextStatementDate, parseDateOnly } from '../../../utils/creditCardCycle';

interface Props {
  isOpen: boolean;
  card: Debt;
  onClose: () => void;
  onCreated: () => void;
}

const AddCardExpenseModal: React.FC<Props> = ({ isOpen, card, onClose, onCreated }) => {
  const { t } = useTranslation('cards');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toLocalDateString());
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState(card.currency || 'TRY');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [saving, setSaving] = useState(false);

  const previewDates = useMemo(() => {
    const cutoff = card.statementCutoffDay || 1;
    return buildInstallmentDueDates(date, cutoff, parseInt(installmentCount, 10) || 1);
  }, [card.statementCutoffDay, date, installmentCount]);

  const previewEffective = useMemo(() => {
    const cutoff = card.statementCutoffDay || 1;
    return toLocalDateString(nextStatementDate(parseDateOnly(date), cutoff));
  }, [card.statementCutoffDay, date]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTrMoneyString(amount);
    if (!(parsed > 0) || !category) {
      toast.error(t('toast.amountInvalid'));
      return;
    }
    setSaving(true);
    try {
      const count = Math.max(1, parseInt(installmentCount, 10) || 1);
      await debtAPI.addCharge(card.id, {
        amount: parsed,
        date,
        currency,
        category,
        description,
        installmentCount: count,
      });
      setAmount('');
      setDescription('');
      setCategory('');
      setInstallmentCount('1');
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error(t('toast.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-brand-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-1">{t('form.addExpenseTitle')}</h3>
        <p className="text-sm text-slate-500 mb-4">{card.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-[2fr_1.2fr] gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.amount')}</label>
              <input
                value={amount}
                onChange={(e) => setAmount(formatTrMoneyInput(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              >
                {TRANSACTION_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.installments')}</label>
              <select
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              >
                {[1, 2, 3, 4, 6, 9, 12].map((n) => (
                  <option key={n} value={String(n)}>
                    {n === 1 ? t('form.singlePayment') : t('form.nInstallments', { count: n })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            {t('form.effectivePreview', { date: previewEffective })}
            {previewDates.length > 1 ? ` · ${previewDates.join(', ')}` : ''}
          </p>
          <p className="text-xs text-slate-400">{t('form.chargeHint')}</p>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              required
            >
              <option value="">{t('form.selectCategory')}</option>
              {TRANSACTION_CATEGORIES.expense.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.description')}</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border font-semibold">
              {t('actions.close')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-brand-ink text-white font-semibold disabled:opacity-50"
            >
              {t('actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCardExpenseModal;
