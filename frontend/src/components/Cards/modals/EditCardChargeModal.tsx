import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { debtAPI } from '../../../services/apiService';
import { TRANSACTION_CATEGORIES } from '../../Transactions/constants';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import { CARD_INSTALLMENT_OPTIONS } from '../../../utils/cardInstallments';
import { buildDueDatesFromFirstPending } from '../../../utils/creditCardCycle';
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
  const [paidInstallmentCount, setPaidInstallmentCount] = useState('0');
  const [firstPendingDueDate, setFirstPendingDueDate] = useState('');
  const [dueById, setDueById] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const categoryOptions = useMemo(() => {
    const base = TRANSACTION_CATEGORIES.expense;
    if (charge?.category && !base.includes(charge.category)) {
      return [charge.category, ...base];
    }
    return base;
  }, [charge?.category]);

  const paidExisting = useMemo(
    () => (charge ? charge.items.filter((i) => i.status === 'paid').length : 0),
    [charge]
  );

  useEffect(() => {
    if (!charge || !isOpen) return;
    setAmount(formatTrMoneyInput(String(charge.total).replace('.', ',')));
    setDate(charge.purchaseDate || '');
    setCategory(charge.category || '');
    setDescription(charge.description || '');
    setInstallmentCount(String(charge.installmentCount || charge.items.length || 1));
    const paid = charge.items.filter((i) => i.status === 'paid').length;
    setPaidInstallmentCount(String(paid));
    const firstPending = charge.items.find((i) => i.status === 'pending');
    setFirstPendingDueDate(firstPending?.dueDate || '');
    const map: Record<string, string> = {};
    charge.items.forEach((item) => {
      map[item.id] = item.dueDate || '';
    });
    setDueById(map);
  }, [charge, isOpen]);

  const countNum = Math.max(1, parseInt(installmentCount, 10) || 1);
  const paidNum = Math.min(countNum, Math.max(0, parseInt(paidInstallmentCount, 10) || 0));

  const alignedPreview = useMemo(() => {
    if (!firstPendingDueDate || paidNum <= 0 || paidNum >= countNum) return [];
    return buildDueDatesFromFirstPending(firstPendingDueDate, countNum, paidNum);
  }, [firstPendingDueDate, countNum, paidNum]);

  if (!isOpen || !charge) return null;

  const handleAlignFromPending = () => {
    if (!firstPendingDueDate || alignedPreview.length === 0) return;
    const next: Record<string, string> = { ...dueById };
    charge.items.forEach((item, idx) => {
      if (alignedPreview[idx]) next[item.id] = alignedPreview[idx];
    });
    setDueById(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTrMoneyString(amount);
    if (!(parsed > 0) || !category) {
      toast.error(t('toast.amountInvalid'));
      return;
    }
    setSaving(true);
    try {
      const structureChanged =
        Math.abs(parsed - charge.total) > 0.009 ||
        (date || '') !== (charge.purchaseDate || '') ||
        countNum !== (charge.installmentCount || charge.items.length) ||
        paidNum !== paidExisting;

      if (structureChanged) {
        await debtAPI.updateCharge(debtId, charge.chargeId, {
          amount: parsed,
          date: date || charge.purchaseDate,
          installmentCount: countNum,
          paidInstallmentCount: paidNum,
          firstPendingDueDate:
            paidNum > 0 && paidNum < countNum && firstPendingDueDate
              ? firstPendingDueDate
              : undefined,
          category,
          description,
        });
      } else {
        await debtAPI.updateCharge(debtId, charge.chargeId, {
          category,
          description,
          scheduleItems: charge.items.map((item) => ({
            id: item.id,
            dueDate: dueById[item.id] || item.dueDate,
          })),
        });
      }
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
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-brand-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-4">{t('form.editChargeTitle')}</h3>
        {paidExisting > 0 && (
          <p className="text-sm text-slate-500 mb-3">{t('form.editChargeHint')}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.amount')}</label>
              <input
                value={amount}
                onChange={(e) => setAmount(formatTrMoneyInput(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
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
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.installments')}</label>
              <select
                value={installmentCount}
                onChange={(e) => {
                  setInstallmentCount(e.target.value);
                  const next = Math.max(1, parseInt(e.target.value, 10) || 1);
                  if ((parseInt(paidInstallmentCount, 10) || 0) > next) {
                    setPaidInstallmentCount(String(next));
                  }
                }}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              >
                {CARD_INSTALLMENT_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n === 1 ? t('form.singlePayment') : t('form.nInstallments', { count: n })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.paidInstallments')}</label>
              <select
                value={String(paidNum)}
                onChange={(e) => setPaidInstallmentCount(e.target.value)}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                disabled={countNum <= 1}
              >
                {Array.from({ length: countNum + 1 }, (_, i) => i).map((n) => (
                  <option key={n} value={String(n)}>
                    {n === 0
                      ? t('form.paidInstallmentsNone')
                      : t('form.paidInstallmentsN', { count: n })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {paidNum > 0 && paidNum < countNum && (
            <div>
              <label className="block text-sm font-semibold mb-1">
                {t('form.firstPendingDueDate')}
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={firstPendingDueDate}
                  onChange={(e) => setFirstPendingDueDate(e.target.value)}
                  className="flex-1 p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={handleAlignFromPending}
                  className="px-3 rounded-xl border text-sm font-semibold whitespace-nowrap"
                >
                  {t('form.alignDueDates')}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('form.firstPendingDueDateHint')}</p>
              {alignedPreview.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">{alignedPreview.join(' · ')}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">{t('form.installmentDueDates')}</label>
            <ul className="space-y-2">
              {charge.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-8 shrink-0">
                    #{item.sequence || '?'}
                  </span>
                  <input
                    type="date"
                    value={dueById[item.id] || ''}
                    onChange={(e) =>
                      setDueById((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="flex-1 p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                  />
                  <span
                    className={`text-xs font-semibold w-16 text-right ${
                      item.status === 'paid'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {item.status === 'paid' ? t('detail.paid') : t('detail.pending')}
                  </span>
                </li>
              ))}
            </ul>
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
