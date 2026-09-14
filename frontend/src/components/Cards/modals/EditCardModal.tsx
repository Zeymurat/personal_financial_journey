import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import type { Debt } from '../../../types';
import { debtAPI } from '../../../services/apiService';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';

interface Props {
  isOpen: boolean;
  card: Debt;
  onClose: () => void;
  onSaved: () => void;
  currencies: { code: string; name: string }[];
}

const EditCardModal: React.FC<Props> = ({ isOpen, card, onClose, onSaved, currencies }) => {
  const { t } = useTranslation('cards');
  const [name, setName] = useState(card.name || '');
  const [bank, setBank] = useState(card.counterparty || '');
  const [currency, setCurrency] = useState(card.currency || 'TRY');
  const [cutoffDay, setCutoffDay] = useState(String(card.statementCutoffDay || 1));
  const [creditLimit, setCreditLimit] = useState(
    card.creditLimit
      ? card.creditLimit.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
      : ''
  );
  const [notes, setNotes] = useState(card.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(card.name || '');
    setBank(card.counterparty || '');
    setCurrency(card.currency || 'TRY');
    setCutoffDay(String(card.statementCutoffDay || 1));
    setCreditLimit(
      card.creditLimit
        ? card.creditLimit.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
        : ''
    );
    setNotes(card.notes || '');
  }, [isOpen, card]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('toast.error'));
      return;
    }
    setSaving(true);
    try {
      await debtAPI.update(card.id, {
        name: name.trim(),
        counterparty: bank.trim(),
        currency,
        notes,
        statementCutoffDay: Math.max(1, Math.min(28, parseInt(cutoffDay, 10) || 1)),
        creditLimit: parseTrMoneyString(creditLimit || '0') || 0,
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
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-brand-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-4">{t('form.editCardTitle')}</h3>
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
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.creditLimit')}</label>
            <input
              value={creditLimit}
              onChange={(e) => setCreditLimit(formatTrMoneyInput(e.target.value))}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            />
            <p className="text-xs text-slate-400 mt-1">{t('form.editCardHint')}</p>
          </div>
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

export default EditCardModal;
