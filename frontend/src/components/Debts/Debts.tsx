import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useFinance } from '../../contexts/FinanceContext';
import { debtAPI } from '../../services/apiService';
import type { Debt, DebtKind, DebtScheduleItem, DebtStatementSummary } from '../../types';
import { TRANSACTION_CURRENCIES } from '../Transactions/constants';
import { formatTrMoneyInput, parseTrMoneyString } from '../../utils/trNumberInput';
import {
  DEFAULT_LOAN_TYPE,
  LOAN_TYPES,
  normalizeLoanType,
  type LoanType,
} from '../../utils/loanInstallment';
import AddDebtModal from './modals/AddDebtModal';
import DebtPaymentModal from './modals/DebtPaymentModal';
import DebtListCard, { debtProgress } from './cards/DebtListCard';
import ConfirmModal from '../common/ConfirmModal';

type FilterKind = 'all' | DebtKind;

const Debts: React.FC = () => {
  const { t } = useTranslation('debts');
  useTokenValidation();
  const { exchangeRates, refreshTransactions, refreshDebts } = useFinance();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Debt | null>(null);
  const [schedule, setSchedule] = useState<DebtScheduleItem[]>([]);
  const [allSchedules, setAllSchedules] = useState<Record<string, DebtScheduleItem[]>>({});
  const [summary, setSummary] = useState<DebtStatementSummary | null>(null);
  const [showPay, setShowPay] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editInstallment, setEditInstallment] = useState('');
  const [editLoanType, setEditLoanType] = useState<LoanType>(DEFAULT_LOAN_TYPE);
  const [savingInstallment, setSavingInstallment] = useState(false);
  const [savingLoanType, setSavingLoanType] = useState(false);

  const toTry = useCallback(
    (amount: number, currency: string) => {
      if (!currency || currency === 'TRY') return amount;
      const rate = exchangeRates[currency]?.rate || exchangeRates[currency]?.buy || 0;
      return rate > 0 ? amount * rate : amount;
    },
    [exchangeRates]
  );

  const loadDebts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await debtAPI.getAll();
      const list: Debt[] = Array.isArray(res?.data) ? res.data : [];
      setDebts(list);
      const active = list.filter((d) => d.status === 'active');
      const entries = await Promise.all(
        active.map(async (d) => {
          try {
            const sched = await debtAPI.getSchedule(d.id);
            return [d.id, Array.isArray(sched?.data) ? sched.data : []] as const;
          } catch {
            return [d.id, []] as const;
          }
        })
      );
      setAllSchedules(Object.fromEntries(entries));
    } catch (e) {
      console.error(e);
      toast.error(t('toast.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDebts();
  }, [loadDebts]);

  const openDetail = async (debt: Debt) => {
    setSelected(debt);
    setSummary(null);
    setSchedule([]);
    const seed =
      debt.installmentAmount ??
      (debt.originalAmount && debt.installmentCount
        ? debt.originalAmount / debt.installmentCount
        : 0);
    setEditInstallment(
      seed
        ? seed.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ''
    );
    setEditLoanType(normalizeLoanType(debt.loanType));
    try {
      const sched = await debtAPI.getSchedule(debt.id);
      const items = Array.isArray(sched?.data) ? sched.data : [];
      setSchedule(items);
      setAllSchedules((prev) => ({ ...prev, [debt.id]: items }));
      const pendingItem = items.find((i) => i.status === 'pending');
      if (pendingItem?.amount) {
        setEditInstallment(
          pendingItem.amount.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else if (debt.installmentAmount) {
        setEditInstallment(
          debt.installmentAmount.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      }
      if (debt.kind === 'credit_card') {
        const sum = await debtAPI.getStatementSummary(debt.id);
        setSummary(sum?.data || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveInstallmentAmount = async () => {
    if (!selected || selected.kind === 'credit_card') return;
    const value = parseTrMoneyString(editInstallment);
    if (!(value > 0)) {
      toast.error(t('toast.error'));
      return;
    }
    setSavingInstallment(true);
    try {
      await debtAPI.update(selected.id, { installmentAmount: value });
      toast.success(t('toast.updated'));
      await loadDebts();
      const refreshed = await debtAPI.get(selected.id);
      await openDetail(refreshed?.data || selected);
      await refreshDebts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setSavingInstallment(false);
    }
  };

  const saveLoanTypeAndRecalc = async () => {
    if (!selected || selected.kind !== 'loan') return;
    setSavingLoanType(true);
    try {
      await debtAPI.update(selected.id, {
        loanType: editLoanType,
        recalcSchedule: true,
      });
      toast.success(t('toast.updated'));
      await loadDebts();
      const refreshed = await debtAPI.get(selected.id);
      await openDetail(refreshed?.data || selected);
      await refreshDebts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('toast.error'));
    } finally {
      setSavingLoanType(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return debts;
    return debts.filter((d) => d.kind === filter);
  }, [debts, filter]);

  const totals = useMemo(() => {
    let payable = 0;
    let receivable = 0;
    let dueThisMonth = 0;
    let totalPaid = 0;
    let remainingDebt = 0;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    for (const d of debts) {
      if (d.status !== 'active') continue;
      const remaining = Math.max(0, d.remainingAmount || 0);
      const remTry = toTry(remaining, d.currency);
      const items = allSchedules[d.id] || [];

      if (d.kind === 'receivable') {
        receivable += remTry;
      } else {
        remainingDebt += remTry;

        let paidLocal = 0;
        let originalLocal = Math.max(0, d.originalAmount || 0);
        if (items.length > 0) {
          const paidSched = items
            .filter((item) => item.status === 'paid')
            .reduce((sum, item) => sum + (item.amount || 0), 0);
          const pendingSched = items
            .filter((item) => item.status === 'pending')
            .reduce((sum, item) => sum + (item.amount || 0), 0);
          paidLocal = paidSched;
          originalLocal = Math.max(originalLocal, paidSched + pendingSched, remaining);
        } else if (d.kind === 'credit_card') {
          // Kartta ana tutar harcamayla büyür; ödenen = max(0, bilinen ana − kalan)
          originalLocal = Math.max(originalLocal, remaining);
          paidLocal = Math.max(0, originalLocal - remaining);
        } else {
          originalLocal = Math.max(originalLocal, remaining);
          paidLocal = Math.max(0, originalLocal - remaining);
        }

        payable += toTry(originalLocal, d.currency);
        totalPaid += toTry(paidLocal, d.currency);
      }

      for (const item of items) {
        if (item.status === 'pending' && item.dueDate?.startsWith(ym)) {
          dueThisMonth += toTry(item.amount || 0, d.currency);
        }
      }
    }
    return { payable, receivable, dueThisMonth, totalPaid, remainingDebt };
  }, [debts, allSchedules, toTry]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await debtAPI.delete(pendingDelete.id);
      toast.success(t('toast.deleted'));
      if (selected?.id === pendingDelete.id) {
        setSelected(null);
        setSchedule([]);
        setSummary(null);
      }
      setPendingDelete(null);
      await loadDebts();
    } catch {
      toast.error(t('toast.error'));
    } finally {
      setDeleting(false);
    }
  };

  const detailProgress = selected
    ? debtProgress(selected, schedule.length ? schedule : allSchedules[selected.id])
    : null;

  return (
    <div className="p-8 min-h-screen space-y-8 bg-[radial-gradient(ellipse_at_top,_rgba(196,165,116,0.08),_transparent_55%)]">
      <PageHeader
        title={t('meta.title')}
        subtitle={t('meta.subtitle')}
        actions={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center space-x-2 bg-brand-gradient text-brand-champagne px-6 py-3 rounded-xl hover:shadow-gold ring-1 ring-gold/30 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>{t('actions.add')}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-rose-200/60 dark:border-rose-900/40 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-rose-500/10" />
          <p className="text-sm font-medium text-slate-500">{t('summary.totalPayable')}</p>
          <p className="text-2xl font-black text-rose-600 tabular-nums mt-1">
            ₺{totals.payable.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">{t('summary.tryNote')}</p>
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-emerald-200/60 dark:border-emerald-900/40 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-500/10" />
          <p className="text-sm font-medium text-slate-500">{t('summary.totalReceivable')}</p>
          <p className="text-2xl font-black text-emerald-600 tabular-nums mt-1">
            ₺{totals.receivable.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-brand-champagne-dark/40 dark:border-brand-ink-light/40 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-brand-champagne/30" />
          <p className="text-sm font-medium text-slate-500">{t('summary.dueThisMonth')}</p>
          <p className="text-2xl font-black text-brand-ink dark:text-brand-champagne tabular-nums mt-1">
            ₺{totals.dueThisMonth.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-sky-200/60 dark:border-sky-900/40 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sky-500/10" />
          <p className="text-sm font-medium text-slate-500">{t('summary.totalPaid')}</p>
          <p className="text-2xl font-black text-sky-700 dark:text-sky-300 tabular-nums mt-1">
            ₺{totals.totalPaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-amber-200/60 dark:border-amber-900/40 shadow-sm">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-500/10" />
          <p className="text-sm font-medium text-slate-500">{t('summary.remainingDebt')}</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums mt-1">
            ₺{totals.remainingDebt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/50 w-fit max-w-full">
        {(['all', 'payable', 'receivable', 'loan', 'credit_card'] as FilterKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === k
                ? 'bg-brand-ink text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
            }`}
          >
            {t(`filters.${k}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white/50 dark:bg-brand-surface-dark/50">
              <p className="text-slate-500 font-medium">{t('detail.empty')}</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-4 text-sm font-semibold text-brand-ink dark:text-brand-champagne underline-offset-2 hover:underline"
              >
                {t('actions.add')}
              </button>
            </div>
          ) : (
            filtered.map((debt) => (
              <DebtListCard
                key={debt.id}
                debt={debt}
                schedule={allSchedules[debt.id]}
                selected={selected?.id === debt.id}
                onSelect={() => void openDetail(debt)}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-brand-surface-dark shadow-sm min-h-[360px] sticky top-6">
          {!selected || !detailProgress ? (
            <div className="h-full min-h-[280px] flex items-center justify-center">
              <p className="text-slate-400 text-center max-w-xs">{t('detail.selectHint')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {selected.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {t(`kinds.${selected.kind}`)}
                    {selected.counterparty ? ` · ${selected.counterparty}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDelete(selected)}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                  title={t('actions.delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const remaining = detailProgress.remaining;
                const total = detailProgress.total;
                const paid = detailProgress.paid;
                const pct = detailProgress.pct;
                return (
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {t('detail.remainingOfTotal')}
                    </p>
                    <p className="font-black text-xl tabular-nums text-slate-900 dark:text-white">
                      {remaining.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                      <span className="text-slate-400 font-semibold text-base"> / </span>
                      {total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
                      <span className="text-sm font-semibold text-slate-400">{selected.currency}</span>
                    </p>
                    {selected.interestRate !== undefined && selected.interestRate !== null && (
                      <p className="text-xs text-slate-400 mt-1">
                        {t('detail.interestRate')}: %{selected.interestRate}
                        {selected.kind === 'loan' && selected.loanType
                          ? ` · ${t(`loanTypes.${normalizeLoanType(selected.loanType)}`)}`
                          : ''}
                      </p>
                    )}
                    {selected.kind === 'loan' && schedule.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-600/50 space-y-2">
                        <label className="text-xs font-semibold text-slate-500 block">
                          {t('form.loanType')}
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={editLoanType}
                            onChange={(e) => setEditLoanType(e.target.value as LoanType)}
                            className="flex-1 p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600"
                          >
                            {LOAN_TYPES.map((lt) => (
                              <option key={lt} value={lt}>
                                {t(`loanTypes.${lt}`)}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={savingLoanType}
                            onClick={() => void saveLoanTypeAndRecalc()}
                            className="px-3 py-2 rounded-lg border text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
                          >
                            {t('actions.recalcInstallment')}
                          </button>
                        </div>
                      </div>
                    )}
                    {selected.kind !== 'credit_card' && schedule.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-600/50">
                        <label className="text-xs font-semibold text-slate-500 block mb-1">
                          {t('detail.installmentAmount')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={editInstallment}
                            onChange={(e) => setEditInstallment(formatTrMoneyInput(e.target.value))}
                            className="flex-1 p-2 rounded-lg border text-sm dark:bg-slate-700 dark:border-slate-600 tabular-nums"
                          />
                          <button
                            type="button"
                            disabled={savingInstallment}
                            onClick={() => void saveInstallmentAmount()}
                            className="px-3 py-2 rounded-lg bg-brand-ink text-white text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
                          >
                            {t('actions.save')}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{t('form.installmentAmountHint')}</p>
                      </div>
                    )}
                    {total > 0 && selected.kind !== 'credit_card' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                          <span>{t('detail.progress')}</span>
                          <span>
                            {t('detail.paidAmount')}:{' '}
                            {paid.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} · %{pct}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {summary && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-brand-ink/15 bg-brand-champagne/20 dark:bg-brand-ink/20">
                    <p className="text-xs text-slate-500">{t('detail.periodBalance')}</p>
                    <p className="font-bold tabular-nums">
                      {summary.periodBalance.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
                      {summary.currency}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('detail.statementDate')}: {summary.statementDate}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-brand-ink/15 bg-brand-champagne/20 dark:bg-brand-ink/20">
                    <p className="text-xs text-slate-500">{t('detail.minPayment')}</p>
                    <p className="font-bold tabular-nums">
                      {summary.minPayment.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
                      {summary.currency}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">%{summary.minPaymentRatePercent}</p>
                  </div>
                </div>
              )}

              {selected.status === 'active' && (
                <button
                  type="button"
                  onClick={() => setShowPay(true)}
                  className="w-full py-3.5 rounded-xl bg-brand-ink text-white font-semibold hover:bg-brand-ink-light shadow-sm transition"
                >
                  {selected.kind === 'receivable'
                    ? t('actions.collect')
                    : selected.kind === 'credit_card'
                      ? t('actions.payCard')
                      : t('actions.pay')}
                </button>
              )}

              <div>
                <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">
                  {t('detail.schedule')}
                </h3>
                {schedule.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('detail.noSchedule')}</p>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {schedule.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-sm p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40"
                      >
                        <span className="text-slate-600 dark:text-slate-300">
                          #{item.sequence} · {item.dueDate}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {item.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
                          <span
                            className={
                              item.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                            }
                          >
                            {item.status === 'paid' ? t('detail.paid') : t('detail.pending')}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddDebtModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        currencies={TRANSACTION_CURRENCIES}
        onCreated={async () => {
          setShowAdd(false);
          toast.success(t('toast.created'));
          await loadDebts();
        }}
      />

      {selected && (
        <DebtPaymentModal
          isOpen={showPay}
          debt={selected}
          schedule={schedule}
          onClose={() => setShowPay(false)}
          onPaid={async () => {
            setShowPay(false);
            toast.success(t('toast.paid'));
            await loadDebts();
            const refreshed = await debtAPI.get(selected.id);
            const debt = refreshed?.data || selected;
            await openDetail(debt);
            await refreshTransactions();
            await refreshDebts();
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title={t('confirm.deleteTitle')}
        message={t('confirm.deleteMessage', { name: pendingDelete?.name || '' })}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('actions.cancel')}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
};

export default Debts;
