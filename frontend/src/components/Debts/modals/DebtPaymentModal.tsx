import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { debtAPI } from '../../../services/apiService';
import type { Debt, DebtScheduleItem } from '../../../types';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import { toLocalDateString } from '../../../utils/localDate';

interface Props {
  isOpen: boolean;
  debt: Debt;
  schedule: DebtScheduleItem[];
  onClose: () => void;
  onPaid: () => void;
}

const DebtPaymentModal: React.FC<Props> = ({ isOpen, debt, schedule, onClose, onPaid }) => {
  const { t } = useTranslation('debts');
  const pending = useMemo(
    () => schedule.filter((s) => s.status === 'pending').sort((a, b) => a.sequence - b.sequence),
    [schedule]
  );
  const isScheduled = pending.length > 0 && (debt.kind === 'loan' || debt.kind === 'payable' || debt.kind === 'receivable');
  const [payCount, setPayCount] = useState(1);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toLocalDateString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const scheduledTotal = useMemo(() => {
    return pending.slice(0, payCount).reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [pending, payCount]);

  useEffect(() => {
    if (!isOpen) return;
    setPayCount(1);
    setDate(toLocalDateString());
    setNote('');
    if (isScheduled) {
      setAmount(formatTrMoneyInput(String(pending[0]?.amount ?? 0).replace('.', ',')));
    } else {
      setAmount(formatTrMoneyInput(String(debt.remainingAmount || 0).replace('.', ',')));
    }
  }, [isOpen, debt.id, debt.remainingAmount, isScheduled, pending]);

  useEffect(() => {
    if (!isScheduled) return;
    setAmount(formatTrMoneyInput(String(scheduledTotal).replace('.', ',')));
  }, [scheduledTotal, isScheduled]);

  if (!isOpen) return null;

  const title =
    debt.kind === 'receivable'
      ? t('form.collectTitle')
      : debt.kind === 'credit_card'
        ? t('form.cardPayTitle')
        : t('form.payTitle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isScheduled) {
        await debtAPI.pay(debt.id, {
          amount: scheduledTotal,
          date,
          currency: debt.currency,
          note,
          payInstallmentCount: payCount,
        });
      } else {
        const parsed = parseTrMoneyString(amount);
        if (!(parsed > 0)) {
          toast.error(t('toast.error'));
          setSaving(false);
          return;
        }
        await debtAPI.pay(debt.id, {
          amount: parsed,
          date,
          currency: debt.currency,
          note,
        });
      }
      onPaid();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t('toast.error'));
    } finally {
      setSaving(false);
    }
  };

  const next = pending[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-md shadow-brand-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{debt.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isScheduled && next && (
            <>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
                <p className="font-semibold">{t('form.nextInstallment')}</p>
                <p>
                  #{next.sequence} · {next.dueDate} ·{' '}
                  {next.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {debt.currency}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">{t('form.payInstallmentCount')}</label>
                <select
                  value={payCount}
                  onChange={(e) => setPayCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                >
                  {pending.map((_, idx) => {
                    const n = idx + 1;
                    return (
                      <option key={n} value={n}>
                        {n === 1 ? t('actions.payNext') : `${t('actions.payEarly')}: ${n}`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-slate-400 mt-1">{t('form.earlyHint')}</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.paymentAmount')}</label>
            <input
              value={amount}
              onChange={(e) => {
                if (isScheduled) return;
                setAmount(formatTrMoneyInput(e.target.value));
              }}
              readOnly={isScheduled}
              className={`w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600 ${
                isScheduled ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''
              }`}
              required
            />
            <p className="text-xs text-slate-400 mt-1">{debt.currency}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.paymentDate')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.notes')}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border font-semibold">
              {t('actions.close')}
            </button>
            <button
              type="submit"
              disabled={saving || (isScheduled && pending.length === 0)}
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

export default DebtPaymentModal;
