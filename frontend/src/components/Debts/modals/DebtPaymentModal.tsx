import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { debtAPI } from '../../../services/apiService';
import type { Debt, DebtScheduleItem, DebtStatementSummary } from '../../../types';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import { toLocalDateString } from '../../../utils/localDate';
import { previewCardPayment } from '../../../utils/cardStatement';
import { quoteLoanPayment } from '../../../utils/loanInstallment';

interface Props {
  isOpen: boolean;
  debt: Debt;
  schedule: DebtScheduleItem[];
  summary?: DebtStatementSummary | null;
  onClose: () => void;
  onPaid: () => void;
}

const money = (value: number) =>
  value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DebtPaymentModal: React.FC<Props> = ({ isOpen, debt, schedule, summary, onClose, onPaid }) => {
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

  const loanQuote = useMemo(() => {
    if (debt.kind !== 'loan') return null;
    return quoteLoanPayment({
      originalAmount: debt.originalAmount || 0,
      monthlyInterestPercent: debt.interestRate,
      installmentCount: debt.installmentCount || schedule.length,
      installmentAmount: debt.installmentAmount || pending[0]?.amount,
      loanType: debt.loanType,
      schedule,
      payCount,
      asOf: date,
    });
  }, [debt, schedule, pending, payCount, date]);

  useEffect(() => {
    if (!isOpen) return;
    setPayCount(1);
    setDate(toLocalDateString());
    setNote('');
    if (isScheduled && debt.kind !== 'loan') {
      setAmount(formatTrMoneyInput(String(pending[0]?.amount ?? 0).replace('.', ',')));
    } else if (debt.kind === 'credit_card' && summary) {
      const suggested = summary.minPayment > 0 ? summary.minPayment : summary.periodBalance;
      setAmount(formatTrMoneyInput(String(suggested || 0).replace('.', ',')));
    } else {
      setAmount(formatTrMoneyInput(String(debt.remainingAmount || 0).replace('.', ',')));
    }
  }, [isOpen, debt.id, debt.kind, debt.remainingAmount, isScheduled, pending, summary]);

  useEffect(() => {
    if (!isScheduled || debt.kind === 'loan') return;
    setAmount(formatTrMoneyInput(String(scheduledTotal).replace('.', ',')));
  }, [scheduledTotal, isScheduled, debt.kind]);

  useEffect(() => {
    if (!isOpen || debt.kind !== 'loan' || !loanQuote) return;
    setAmount(formatTrMoneyInput(String(loanQuote.payTotal).replace('.', ',')));
  }, [isOpen, debt.kind, loanQuote, payCount, date]);

  const cardPreview = useMemo(() => {
    if (debt.kind !== 'credit_card' || !summary) return null;
    const parsed = parseTrMoneyString(amount);
    if (!(parsed > 0)) return null;
    return previewCardPayment({
      remainingAmount: summary.remainingAmount ?? debt.remainingAmount ?? 0,
      periodBalance: summary.periodBalance || 0,
      minPayment: summary.minPayment || 0,
      cyclePaidAmount: summary.cyclePaidAmount || 0,
      grossPeriodBalance: summary.grossPeriodBalance || summary.periodBalance || 0,
      amount: parsed,
    });
  }, [amount, debt.kind, debt.remainingAmount, summary]);

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
      if (isScheduled && debt.kind !== 'loan') {
        await debtAPI.pay(debt.id, {
          amount: scheduledTotal,
          date,
          currency: debt.currency,
          note,
          payInstallmentCount: payCount,
        });
      } else if (debt.kind === 'loan' && loanQuote) {
        const parsed = parseTrMoneyString(amount);
        if (parsed + 0.02 < loanQuote.minimum || parsed > loanQuote.fullTotal + 0.02) {
          toast.error(t('form.loanPayRange', {
            min: money(loanQuote.minimum),
            full: money(loanQuote.fullTotal),
          }));
          setSaving(false);
          return;
        }
        await debtAPI.pay(debt.id, {
          amount: parsed,
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
                <p className="text-xs text-slate-400 mt-1">
                  {debt.kind === 'loan' ? t('form.earlyHintLoan') : t('form.earlyHint')}
                </p>
                {debt.kind === 'loan' && loanQuote && loanQuote.rows.some((row) => row.discount > 0) && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {loanQuote.rows.map((row) => (
                      <li key={row.dueDate}>
                        {row.dueDate}: {money(row.pay)}
                        {row.discount > 0 ? ` (${t('form.earlyDiscount', { amount: money(row.discount) })})` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.paymentAmount')}</label>
            <input
              value={amount}
              onChange={(e) => {
                if (isScheduled && debt.kind !== 'loan') return;
                setAmount(formatTrMoneyInput(e.target.value));
              }}
              readOnly={isScheduled && debt.kind !== 'loan'}
              className={`w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600 ${
                isScheduled && debt.kind !== 'loan' ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed' : ''
              }`}
              required
            />
            <p className="text-xs text-slate-400 mt-1">{debt.currency}</p>
            {debt.kind === 'credit_card' && summary && (
              <div className="flex gap-2 mt-2">
                {summary.minPayment > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(formatTrMoneyInput(String(summary.minPayment).replace('.', ',')))
                    }
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                  >
                    {t('form.payMinimum')}
                  </button>
                )}
                {summary.periodBalance > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(formatTrMoneyInput(String(summary.periodBalance).replace('.', ',')))
                    }
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold"
                  >
                    {t('form.payStatement')}
                  </button>
                )}
              </div>
            )}
            {cardPreview && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {cardPreview.tooMuch ? (
                  <p>{t('form.cardPayTooMuch')}</p>
                ) : cardPreview.closesStatement ? (
                  <p>
                    {t('form.cardPayFull', {
                      debt: money(cardPreview.remaining),
                      excess: money(cardPreview.excess),
                    })}
                  </p>
                ) : (
                  <p>
                    {t('form.cardPayPartial', {
                      debt: money(cardPreview.remaining),
                      period: money(cardPreview.period),
                      min: money(cardPreview.minimum),
                      interest: money(cardPreview.interest),
                      rate: cardPreview.rate.toLocaleString('tr-TR', { maximumFractionDigits: 2 }),
                    })}
                  </p>
                )}
              </div>
            )}
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
              disabled={saving || (isScheduled && pending.length === 0) || Boolean(cardPreview?.tooMuch)}
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
