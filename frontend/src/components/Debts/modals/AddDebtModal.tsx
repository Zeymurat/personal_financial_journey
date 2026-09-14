import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { debtAPI } from '../../../services/apiService';
import type { DebtKind } from '../../../types';
import { formatTrMoneyInput, parseTrMoneyString } from '../../../utils/trNumberInput';
import { toLocalDateString } from '../../../utils/localDate';
import {
  computeLoanInstallmentAmount,
  loanEffectiveMonthlyRate,
  loanTaxRates,
  LOAN_TYPES,
  DEFAULT_LOAN_TYPE,
  type LoanType,
} from '../../../utils/loanInstallment';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  currencies: { code: string; name: string }[];
}

type DebtFormKind = Exclude<DebtKind, 'credit_card'>;

const AddDebtModal: React.FC<Props> = ({ isOpen, onClose, onCreated, currencies }) => {
  const { t } = useTranslation('debts');
  const [kind, setKind] = useState<DebtFormKind>('loan');
  const [name, setName] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [interestRate, setInterestRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState(toLocalDateString());
  const [installments, setInstallments] = useState('12');
  const [loanType, setLoanType] = useState<LoanType>(DEFAULT_LOAN_TYPE);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentTouched, setInstallmentTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameLabel = useMemo(() => {
    if (kind === 'loan') return t('form.nameLoan');
    if (kind === 'payable') return t('form.namePayable');
    if (kind === 'receivable') return t('form.nameReceivable');
    return t('form.name');
  }, [kind, t]);

  const counterpartyLabel = useMemo(() => {
    if (kind === 'loan') return t('form.counterpartyLoan');
    if (kind === 'payable') return t('form.counterpartyPayable');
    if (kind === 'receivable') return t('form.counterpartyReceivable');
    return t('form.counterparty');
  }, [kind, t]);

  const parsedAmount = parseTrMoneyString(amount);
  const rate = Number.parseFloat(interestRate.replace(',', '.')) || 0;
  const installmentCount = Math.max(
    kind === 'loan' ? 2 : 1,
    parseInt(installments, 10) || 1
  );

  const suggestedInstallment = useMemo(() => {
    if (!(parsedAmount > 0)) return 0;
    if (kind === 'loan' || rate > 0) {
      return computeLoanInstallmentAmount({
        principal: parsedAmount,
        monthlyInterestPercent: rate,
        installmentCount,
        loanType: kind === 'loan' ? loanType : DEFAULT_LOAN_TYPE,
      });
    }
    return Math.round((parsedAmount / installmentCount) * 100) / 100;
  }, [parsedAmount, rate, installmentCount, kind, loanType]);

  const effectiveRatePct = useMemo(() => {
    if (kind !== 'loan' && rate <= 0) return 0;
    return Math.round(loanEffectiveMonthlyRate(rate, loanType) * 10000) / 100;
  }, [kind, rate, loanType]);

  const taxProfile = useMemo(() => loanTaxRates(loanType), [loanType]);

  useEffect(() => {
    if (!isOpen) return;
    if (!installmentTouched && suggestedInstallment > 0) {
      setInstallmentAmount(
        suggestedInstallment.toLocaleString('tr-TR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  }, [suggestedInstallment, installmentTouched, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setInstallmentTouched(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(parsedAmount > 0) || !name.trim()) {
      toast.error(t('toast.error'));
      return;
    }
    if (Number.isNaN(rate) || rate < 0) {
      toast.error(t('toast.error'));
      return;
    }

    const manualInstallment = parseTrMoneyString(installmentAmount);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        kind,
        name: name.trim(),
        counterparty: counterparty.trim(),
        currency,
        notes,
        status: 'active',
        originalAmount: parsedAmount,
        remainingAmount: parsedAmount,
        interestRate: rate,
      };

      if (kind === 'loan' || installmentCount > 1) {
        payload.installmentCount = kind === 'loan' ? Math.max(2, installmentCount) : installmentCount;
        payload.startDate = startDate;
        if (kind === 'loan') {
          payload.loanType = loanType;
        }
        if (manualInstallment > 0) {
          payload.installmentAmount = manualInstallment;
        }
      }

      await debtAPI.create(payload as never);
      setName('');
      setAmount('');
      setCounterparty('');
      setNotes('');
      setInterestRate('0');
      setInstallmentAmount('');
      setInstallmentTouched(false);
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t('toast.error'));
    } finally {
      setSaving(false);
    }
  };

  const showInstallmentPlan = kind === 'loan' || parseInt(installments, 10) > 1;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-surface dark:bg-brand-surface-dark rounded-2xl p-6 w-full max-w-lg shadow-brand-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black mb-4">{t('form.addTitle')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.kind')}</label>
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as DebtFormKind);
                setInstallmentTouched(false);
              }}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="loan">{t('kinds.loan')}</option>
              <option value="payable">{t('kinds.payable')}</option>
              <option value="receivable">{t('kinds.receivable')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{nameLabel}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{counterpartyLabel}</label>
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">
                {kind === 'loan' ? t('form.amountLoan') : t('form.amount')}
              </label>
              <input
                value={amount}
                onChange={(e) => {
                  setAmount(formatTrMoneyInput(e.target.value));
                  setInstallmentTouched(false);
                }}
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

          {kind === 'loan' && (
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.loanType')}</label>
              <select
                value={loanType}
                onChange={(e) => {
                  setLoanType(e.target.value as LoanType);
                  setInstallmentTouched(false);
                }}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              >
                {LOAN_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {t(`loanTypes.${lt}`)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {t('form.loanTypeTaxHint', {
                  kkdf: Math.round(taxProfile.kkdf * 100),
                  bsmv: Math.round(taxProfile.bsmv * 100),
                })}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">{t('form.interestRate')}</label>
            <input
              type="text"
              inputMode="decimal"
              value={interestRate}
              onChange={(e) => {
                setInterestRate(e.target.value);
                setInstallmentTouched(false);
              }}
              className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
            />
            <p className="text-xs text-slate-400 mt-1">{t('form.interestRateHint')}</p>
            {kind === 'loan' && rate > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {t('form.effectiveRate', { rate: effectiveRatePct.toLocaleString('tr-TR') })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.installments')}</label>
              <input
                type="number"
                min={kind === 'loan' ? 2 : 1}
                value={installments}
                onChange={(e) => {
                  setInstallments(e.target.value);
                  setInstallmentTouched(false);
                }}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            {showInstallmentPlan && (
              <div>
                <label className="block text-sm font-semibold mb-1">{t('form.startDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
                  required
                />
              </div>
            )}
          </div>

          {showInstallmentPlan && (
            <div>
              <label className="block text-sm font-semibold mb-1">{t('form.installmentAmount')}</label>
              <input
                value={installmentAmount}
                onChange={(e) => {
                  setInstallmentTouched(true);
                  setInstallmentAmount(formatTrMoneyInput(e.target.value));
                }}
                className="w-full p-3 rounded-xl border dark:bg-slate-700 dark:border-slate-600"
              />
              <p className="text-xs text-slate-400 mt-1">{t('form.installmentAmountHint')}</p>
              {suggestedInstallment > 0 && (
                <button
                  type="button"
                  className="text-xs text-brand-ink dark:text-brand-champagne underline mt-1"
                  onClick={() => {
                    setInstallmentTouched(false);
                    setInstallmentAmount(
                      suggestedInstallment.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    );
                  }}
                >
                  {t('form.useSuggested', {
                    amount: suggestedInstallment.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  })}
                </button>
              )}
            </div>
          )}

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

export default AddDebtModal;
