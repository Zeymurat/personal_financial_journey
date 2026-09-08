import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { debtAPI } from '../../../services/apiService';
import { TRANSACTION_CATEGORIES } from '../../Transactions/constants';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import type { ChargeGroup } from '../../../utils/groupCardCharges';

interface Props {
  isOpen: boolean;
  debtId: string;
  charge: ChargeGroup | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditCardChargeModal: React.FC<Props> = ({ isOpen, debtId, charge, onClose, onSaved }) => {
  const { t } = useTranslation('cards');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(() => {
    const base = TRANSACTION_CATEGORIES.expense;
    if (charge?.category && !base.includes(charge.category)) {
      return [charge.category, ...base];
    }
    return base;
  }, [charge?.category]);

  useEffect(() => {
    if (!charge || !isOpen) return;
    setAmount(formatTrMoneyInput(String(charge.total).replace('.', ',')));
    setDate(charge.purchaseDate || '');
    setCategory(charge.category || '');
    setDescription(charge.description || '');
    setInstallmentCount(String(charge.installmentCount || charge.items.length || 1));
  }, [charge, isOpen]);

  if (!isOpen || !charge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTrMoneyString(amount);
    if (!(parsed > 0) || !category) {
      toast.error(t('toast.amountInvalid'));
      return;
    }
    setSaving(true);
    try {
      await debtAPI.updateCharge(debtId, charge.chargeId, {
        amount: parsed,
        date: date || charge.purchaseDate,
        installmentCount: Math.max(1, parseInt(installmentCount, 10) || 1),
        category,
        description,
      });
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t('toast.error'));
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
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-brand-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-4">{t('form.editChargeTitle')}</h3>
        {!charge.allPending && (
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">{t('form.editPaidBlocked')}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.amount')}</label>
              <input
                value={amount}
                onChange={(e) => setAmount(formatTrMoneyInput(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                disabled={!charge.allPending}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                disabled={!charge.allPending}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.installments')}</label>
            <select
              value={installmentCount}
              onChange={(e) => setInstallmentCount(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              disabled={!charge.allPending}
            >
              {[1, 2, 3, 4, 6, 9, 12].map((n) => (
                <option key={n} value={String(n)}>
                  {n === 1 ? t('form.singlePayment') : t('form.nInstallments', { count: n })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              required
            >
              <option value="">{t('form.selectCategory')}</option>
              {categoryOptions.map((cat) => (
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

export default EditCardChargeModal;
