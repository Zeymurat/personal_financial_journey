import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import type { Debt } from '../../../types';
import { debtAPI } from '../../../services/apiService';
import { TRANSACTION_CATEGORIES } from '../../Transactions/constants';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import { toLocalDateString } from '../../../utils/localDate';

interface Props {
  isOpen: boolean;
  card: Debt;
  onClose: () => void;
  onCreated: () => void;
}

type DraftRow = {
  id: string;
  amount: string;
  date: string;
  category: string;
  description: string;
  installmentCount: string;
  paidInstallmentCount: string;
};

function newRow(defaults?: Partial<DraftRow>): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount: '',
    date: toLocalDateString(),
    category: '',
    description: '',
    installmentCount: '1',
    paidInstallmentCount: '0',
    ...defaults,
  };
}

const BulkAddCardExpensesModal: React.FC<Props> = ({ isOpen, card, onClose, onCreated }) => {
  const { t } = useTranslation('cards');
  const [rows, setRows] = useState<DraftRow[]>([newRow(), newRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRows([newRow(), newRow()]);
    }
  }, [isOpen, card.id]);

  if (!isOpen) return null;

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prepared = rows
      .map((r) => {
        const count = Math.max(1, parseInt(r.installmentCount, 10) || 1);
        const paid = Math.min(count, Math.max(0, parseInt(r.paidInstallmentCount, 10) || 0));
        return {
          ...r,
          parsed: parseTrMoneyString(r.amount),
          count,
          paid,
        };
      })
      .filter((r) => r.parsed > 0);

    if (prepared.length === 0) {
      toast.error(t('toast.amountInvalid'));
      return;
    }
    const missingCategory = prepared.find((r) => !r.category);
    if (missingCategory) {
      toast.error(t('toast.categoryRequired'));
      return;
    }

    setSaving(true);
    let ok = 0;
    try {
      for (const r of prepared) {
        await debtAPI.addCharge(card.id, {
          amount: r.parsed,
          date: r.date,
          currency: card.currency || 'TRY',
          category: r.category,
          description: r.description,
          installmentCount: r.count,
          paidInstallmentCount: r.paid > 0 ? r.paid : undefined,
        });
        ok += 1;
      }
      toast.success(t('toast.bulkAdded', { count: ok }));
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error(
        ok > 0
          ? t('toast.bulkPartial', { ok, fail: prepared.length - ok })
          : t('toast.error')
      );
      if (ok > 0) onCreated();
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
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-3xl shadow-brand-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-1">{t('form.bulkExpenseTitle')}</h3>
        <p className="text-sm text-slate-500 mb-2">{card.name}</p>
        <p className="text-xs text-slate-400 mb-4">{t('form.bulkExpenseHint')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-200 dark:border-slate-600 p-3 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                    title={t('actions.removeRow')}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('form.amount')}</label>
                    <input
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(row.id, { amount: formatTrMoneyInput(e.target.value) })
                      }
                      className="w-full p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('form.date')}</label>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, { date: e.target.value })}
                      className="w-full p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('form.installments')}</label>
                    <select
                      value={row.installmentCount}
                      onChange={(e) => {
                        const next = Math.max(1, parseInt(e.target.value, 10) || 1);
                        const paid = Math.min(
                          next,
                          Math.max(0, parseInt(row.paidInstallmentCount, 10) || 0)
                        );
                        updateRow(row.id, {
                          installmentCount: e.target.value,
                          paidInstallmentCount: String(paid),
                        });
                      }}
                      className="w-full p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                    >
                      {[1, 2, 3, 4, 6, 9, 12].map((n) => (
                        <option key={n} value={String(n)}>
                          {n === 1
                            ? t('form.singlePayment')
                            : t('form.nInstallments', { count: n })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('form.paidShort')}</label>
                    <select
                      value={row.paidInstallmentCount}
                      onChange={(e) => updateRow(row.id, { paidInstallmentCount: e.target.value })}
                      disabled={(parseInt(row.installmentCount, 10) || 1) <= 1}
                      className="w-full p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600 disabled:opacity-50"
                    >
                      {Array.from(
                        { length: (parseInt(row.installmentCount, 10) || 1) + 1 },
                        (_, i) => i
                      ).map((n) => (
                        <option key={n} value={String(n)}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t('form.category')}</label>
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(row.id, { category: e.target.value })}
                      className="w-full p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="">{t('form.selectCategory')}</option>
                      {TRANSACTION_CATEGORIES.expense.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('form.description')}</label>
                  <input
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                    className="w-full p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                newRow({
                  date: prev[prev.length - 1]?.date || toLocalDateString(),
                  category: prev[prev.length - 1]?.category || '',
                }),
              ])
            }
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            {t('actions.addRow')}
          </button>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border font-semibold">
              {t('actions.close')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-brand-ink text-white font-semibold disabled:opacity-50"
            >
              {saving ? t('actions.saving') : t('actions.saveAll')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAddCardExpensesModal;
