import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { debtAPI } from '../../../services/apiService';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  currencies: { code: string; name: string }[];
}

const AddCardModal: React.FC<Props> = ({ isOpen, onClose, onCreated, currencies }) => {
  const { t } = useTranslation('cards');
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [cutoffDay, setCutoffDay] = useState('5');
  const [creditLimit, setCreditLimit] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('toast.error'));
      return;
    }
    const balance = parseTrMoneyString(openingBalance || '0') || 0;
    setSaving(true);
    try {
      await debtAPI.create({
        kind: 'credit_card',
        name: name.trim(),
        counterparty: bank.trim(),
        currency,
        notes,
        status: 'active',
        originalAmount: balance,
        remainingAmount: balance,
        statementCutoffDay: Math.max(1, Math.min(28, parseInt(cutoffDay, 10) || 1)),
        creditLimit: parseTrMoneyString(creditLimit || '0') || 0,
      } as never);
      setName('');
      setBank('');
      setOpeningBalance('');
      setCreditLimit('');
      setNotes('');
      onCreated();
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
        <h3 className="text-xl font-black mb-4">{t('form.addCardTitle')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.bank')}</label>
            <input
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.cutoffDay')}</label>
              <input
                type="number"
                min={1}
                max={28}
                value={cutoffDay}
                onChange={(e) => setCutoffDay(e.target.value)}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
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
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.creditLimit')}</label>
              <input
                value={creditLimit}
                onChange={(e) => setCreditLimit(formatTrMoneyInput(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.openingBalance')}</label>
              <input
                value={openingBalance}
                onChange={(e) => setOpeningBalance(formatTrMoneyInput(e.target.value))}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                placeholder="0,00"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">{t('form.openingBalanceHint')}</p>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              rows={2}
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

export default AddCardModal;
