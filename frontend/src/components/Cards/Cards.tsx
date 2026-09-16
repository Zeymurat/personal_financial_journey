import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronRight, CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useFinance } from '../../contexts/FinanceContext';
import { debtAPI } from '../../services/apiService';
import type { Debt, DebtScheduleItem, DebtStatementSummary } from '../../types';
import { TRANSACTION_CURRENCIES } from '../Transactions/constants';
import { debtProgress } from '../Debts/cards/DebtListCard';
import DebtPaymentModal from '../Debts/modals/DebtPaymentModal';
import AddCardModal from './modals/AddCardModal';
import AddCardExpenseModal from './modals/AddCardExpenseModal';
import EditCardModal from './modals/EditCardModal';
import BulkAddCardExpensesModal from './modals/BulkAddCardExpensesModal';
import EditCardChargeModal from './modals/EditCardChargeModal';
import ConfirmModal from '../common/ConfirmModal';
import { groupCharges, type ChargeGroup } from '../../utils/groupCardCharges';
import { addDaysToDateString, formatDisplayDate } from '../../utils/localDate';

type DetailTab = 'charges' | 'period' | 'pending';

function monthKey(dueDate: string): string {
  return (dueDate || '').slice(0, 7);
}

function formatMonthLabel(ym: string, locale: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  try {
    return new Date(y, m - 1, 1).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return ym;
  }
}

const Cards: React.FC = () => {
  const { t, i18n } = useTranslation('cards');
  useTokenValidation();
  const { exchangeRates, refreshTransactions, refreshDebts } = useFinance();

  const [cards, setCards] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showBulkExpense, setShowBulkExpense] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [selected, setSelected] = useState<Debt | null>(null);
  const [schedule, setSchedule] = useState<DebtScheduleItem[]>([]);
  const [summary, setSummary] = useState<DebtStatementSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingCharge, setEditingCharge] = useState<ChargeGroup | null>(null);
  const [pendingChargeDelete, setPendingChargeDelete] = useState<ChargeGroup | null>(null);
  const [deletingCharge, setDeletingCharge] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('charges');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pendingMonth, setPendingMonth] = useState<string>('all');
  const [focusChargeId, setFocusChargeId] = useState<string | null>(null);

  const chargeGroups = useMemo(() => groupCharges(schedule), [schedule]);

  const availableLimit = useMemo(() => {
    if (!selected) return null;
    const limit = selected.creditLimit || 0;
    if (limit <= 0) return null;
    return Math.max(0, limit - (selected.remainingAmount || 0));
  }, [selected]);

  const pendingItems = useMemo(
    () =>
      schedule
        .filter((s) => s.status === 'pending')
        .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')),
    [schedule]
  );

  const pendingMonths = useMemo(() => {
    const keys = new Set<string>();
    for (const item of pendingItems) {
      const mk = monthKey(item.dueDate);
      if (mk.length === 7) keys.add(mk);
    }
    return Array.from(keys).sort();
  }, [pendingItems]);

  const filteredPending = useMemo(() => {
    if (pendingMonth === 'all') return pendingItems;
    return pendingItems.filter((s) => monthKey(s.dueDate) === pendingMonth);
  }, [pendingItems, pendingMonth]);

  const pendingMonthTotal = useMemo(
    () => filteredPending.reduce((sum, s) => sum + (s.amount || 0), 0),
    [filteredPending]
  );

  const periodItems = summary?.items || [];

  const toTry = useCallback(
    (amount: number, currency: string) => {
      if (!currency || currency === 'TRY') return amount;
      const rate = exchangeRates[currency]?.rate || exchangeRates[currency]?.buy || 0;
      return rate > 0 ? amount * rate : amount;
    },
    [exchangeRates]
  );

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await debtAPI.getAll({ kind: 'credit_card' });
      const list = (Array.isArray(res?.data) ? res.data : []).filter(
        (d: Debt) => d.kind === 'credit_card'
      );
      setCards(list);
    } catch (e) {
      console.error(e);
      toast.error(t('toast.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (!focusChargeId) return;
    const el = document.querySelector(
      `[data-charge-id="${CSS.escape(focusChargeId)}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    const timer = window.setTimeout(() => setFocusChargeId(null), 400);
    return () => window.clearTimeout(timer);
  }, [focusChargeId, chargeGroups]);

  const openDetail = async (card: Debt) => {
    setSelected(card);
    setSummary(null);
    setSchedule([]);
    setDetailTab('charges');
    setExpandedIds(new Set());
    setPendingMonth('all');
    try {
      const sched = await debtAPI.getSchedule(card.id);
      setSchedule(Array.isArray(sched?.data) ? sched.data : []);
      const sum = await debtAPI.getStatementSummary(card.id);
      setSummary(sum?.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshSelected = async (cardId: string, preferCard?: Debt) => {
    await loadCards();
    const refreshed = await debtAPI.get(cardId);
    const next = refreshed?.data || preferCard;
    if (!next) return;
    setSelected(next);
    try {
      const sched = await debtAPI.getSchedule(cardId);
      setSchedule(Array.isArray(sched?.data) ? sched.data : []);
      const sum = await debtAPI.getStatementSummary(cardId);
      setSummary(sum?.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  const totals = useMemo(() => {
    let debt = 0;
    let active = 0;
    for (const c of cards) {
      if (c.status !== 'active') continue;
      active += 1;
      debt += toTry(c.remainingAmount || 0, c.currency);
    }
    return { debt, active };
  }, [cards, toTry]);

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
      await loadCards();
      await refreshDebts();
    } catch {
      toast.error(t('toast.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCharge = async () => {
    if (!selected || !pendingChargeDelete) return;
    setDeletingCharge(true);
    try {
      await debtAPI.deleteCharge(selected.id, pendingChargeDelete.chargeId);
      toast.success(t('toast.chargeDeleted'));
      setPendingChargeDelete(null);
      await refreshSelected(selected.id, selected);
      await refreshDebts();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t('toast.error'));
    } finally {
      setDeletingCharge(false);
    }
  };

  const toggleExpanded = (chargeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(chargeId)) next.delete(chargeId);
      else next.add(chargeId);
      return next;
    });
  };

  const progress = selected ? debtProgress(selected) : null;
  const locale = i18n.language || 'tr';

  const tabBtn = (id: DetailTab, label: string) => (
    <button
      type="button"
      onClick={() => setDetailTab(id)}
      className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
        detailTab === id
          ? 'bg-brand-ink text-white dark:bg-brand-champagne dark:text-brand-ink'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  const renderScheduleRow = (item: DebtScheduleItem) => (
    <li
      key={item.id}
      className="flex justify-between gap-2 text-sm text-slate-600 dark:text-slate-300 py-1.5 border-b border-slate-100 dark:border-slate-700/40 last:border-0"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">
          {item.description?.trim() || item.category || t('detail.chargeFallback')}
        </p>
        <p className="text-xs text-slate-400">
          {formatDisplayDate(item.dueDate)}
          {item.sequence ? ` · #${item.sequence}` : ''}
          {item.installmentCount && item.installmentCount > 1
            ? ` / ${item.installmentCount}`
            : ''}
        </p>
      </div>
      <span className="tabular-nums font-semibold shrink-0">
        {(item.amount || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
        {selected?.currency}
      </span>
    </li>
  );

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
            <span>{t('actions.addCard')}</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-amber-200/60 dark:border-amber-900/40 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t('summary.totalDebt')}</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums mt-1">
            ₺{totals.debt.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">{t('summary.tryNote')}</p>
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white/90 dark:bg-brand-surface-dark border border-slate-200/60 dark:border-slate-700 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t('summary.cardCount')}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
            {totals.active}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-10 text-center bg-white/50 dark:bg-brand-surface-dark/50">
              <p className="text-slate-500 font-medium">{t('detail.empty')}</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-4 text-sm font-semibold text-brand-ink dark:text-brand-champagne underline-offset-2 hover:underline"
              >
                {t('actions.addCard')}
              </button>
            </div>
          ) : (
            cards.map((card) => {
              const p = debtProgress(card);
              const active = selected?.id === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => void openDetail(card)}
                  className={`w-full text-left p-4 rounded-2xl border transition shadow-sm ${
                    active
                      ? 'border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/30 ring-1 ring-amber-400/30'
                      : 'border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-brand-surface-dark hover:border-amber-300/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-200">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{card.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {card.counterparty ? `${card.counterparty} · ` : ''}
                        {t('detail.cutoff')}: {card.statementCutoffDay}
                      </p>
                      <p className="mt-2 font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                        {(card.remainingAmount || 0).toLocaleString('tr-TR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        {card.currency}
                      </p>
                      {p.showBar && (
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-3 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-brand-surface-dark shadow-sm min-h-[520px] lg:min-h-[calc(100vh-12rem)] flex flex-col">
          {!selected || !progress ? (
            <div className="flex-1 min-h-[280px] flex items-center justify-center">
              <p className="text-slate-400 text-center max-w-xs">{t('detail.selectHint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[1200px]:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] gap-4 flex-1 min-h-0">
              {/* Sol: kart özeti + aksiyonlar */}
              <aside className="flex flex-col gap-3 min-[1200px]:overflow-y-auto min-[1200px]:pr-1 min-h-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                      {selected.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selected.counterparty ? `${selected.counterparty} · ` : ''}
                      {t('detail.cutoff')}: {selected.statementCutoffDay}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowEditCard(true)}
                      className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                      title={t('actions.editCard')}
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(selected)}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                      title={t('actions.delete')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {t('detail.remaining')}
                  </p>
                  <p className="font-black text-xl tabular-nums">
                    {(selected.remainingAmount || 0).toLocaleString('tr-TR', {
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-sm font-semibold text-slate-400">{selected.currency}</span>
                  </p>
                  {(selected.creditLimit || 0) > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {t('detail.limit')}:{' '}
                      {selected.creditLimit!.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}{' '}
                      {selected.currency}
                    </p>
                  )}
                </div>

                {availableLimit != null && (
                  <div className="rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 p-4 border border-emerald-500/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70 mb-1">
                      {t('detail.availableLimit')}
                    </p>
                    <p className="font-black text-xl tabular-nums text-emerald-800 dark:text-emerald-200">
                      {availableLimit.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}{' '}
                      <span className="text-sm font-semibold opacity-70">{selected.currency}</span>
                    </p>
                    {/* <p className="text-xs text-slate-400 mt-1">{t('detail.availableLimitHint')}</p> */}
                  </div>
                )}

                {summary && (
                  <>
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                      <p className="text-xs text-slate-500">{t('detail.periodBalance')}</p>
                      <p className="font-bold tabular-nums">
                        {summary.periodBalance.toLocaleString('tr-TR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        {summary.currency}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t('detail.statementDate')}: {formatDisplayDate(summary.statementDate)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                      <p className="text-xs text-slate-500">{t('detail.minPayment')}</p>
                      <p className="font-bold tabular-nums">
                        {summary.minPayment.toLocaleString('tr-TR', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        {summary.currency}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t('detail.paymentDueDate')}:{' '}
                        {formatDisplayDate(addDaysToDateString(summary.statementDate, 10))}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowExpense(true)}
                    className="w-full py-3 rounded-xl bg-brand-ink text-white font-semibold hover:bg-brand-ink-light shadow-sm transition"
                  >
                    {t('actions.addExpense')}
                  </button>
                  {selected.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => setShowPay(true)}
                      className="w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      {t('actions.payCard')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowBulkExpense(true)}
                    className="w-full py-3 rounded-xl border border-dashed border-brand-ink/30 dark:border-brand-champagne/30 text-sm font-semibold hover:bg-brand-champagne/20 dark:hover:bg-brand-ink/30 transition"
                  >
                    {t('actions.bulkExpense')}
                  </button>
                </div>
              </aside>

              {/* Sağ: sekmeler + liste (viewport yüksekliği) */}
              <section className="flex flex-col min-h-[28rem] min-[1200px]:min-h-0 flex-1 gap-3">
                <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 shrink-0">
                  {tabBtn('charges', t('detail.tabCharges'))}
                  {tabBtn('period', t('detail.tabPeriod'))}
                  {tabBtn('pending', t('detail.tabPending'))}
                </div>

                <div className="flex-1 min-h-0 flex flex-col border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
                  {detailTab === 'charges' && (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between shrink-0">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                          {t('detail.charges')}
                        </h3>
                        <span className="text-xs text-slate-400">
                          {chargeGroups.length} · {t('detail.chargesCollapsedHint')}
                        </span>
                      </div>
                      {chargeGroups.length === 0 ? (
                        <p className="text-sm text-slate-500 p-4">{t('detail.noSchedule')}</p>
                      ) : (
                        <ul className="flex-1 overflow-y-auto p-3 space-y-2">
                          {chargeGroups.map((group) => {
                            const expanded = expandedIds.has(group.chargeId);
                            const paidN = group.items.filter((i) => i.status === 'paid').length;
                            return (
                              <li
                                key={group.chargeId}
                                data-charge-id={group.chargeId}
                                className="rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40"
                              >
                                <div className="flex items-start gap-1 p-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(group.chargeId)}
                                    className="p-1.5 mt-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shrink-0"
                                    aria-expanded={expanded}
                                  >
                                    {expanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(group.chargeId)}
                                    className="flex-1 min-w-0 text-left"
                                  >
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                                      {group.description?.trim() || t('detail.chargeFallback')}
                                    </p>
                                    {group.category ? (
                                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                                        {group.category}
                                      </p>
                                    ) : null}
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {formatDisplayDate(group.purchaseDate)}
                                      {group.installmentCount > 1
                                        ? ` · ${t('form.nInstallments', {
                                            count: group.installmentCount,
                                          })}`
                                        : ` · ${t('form.singlePayment')}`}
                                      {group.installmentCount > 1
                                        ? ` · ${t('detail.paidOfTotal', {
                                            paid: paidN,
                                            total: group.items.length,
                                          })}`
                                        : ''}
                                    </p>
                                    <p className="text-sm font-bold tabular-nums mt-1">
                                      {group.total.toLocaleString('tr-TR', {
                                        maximumFractionDigits: 2,
                                      })}{' '}
                                      {selected.currency}
                                    </p>
                                  </button>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCharge(group)}
                                      className="p-2 text-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg"
                                      title={t('actions.editCharge')}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {group.allPending && (
                                      <button
                                        type="button"
                                        onClick={() => setPendingChargeDelete(group)}
                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                        title={t('actions.deleteCharge')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {expanded && (
                                  <ul className="px-3 pb-3 space-y-1 border-t border-slate-200/70 dark:border-slate-700/50 pt-2 ml-8">
                                    {group.items.map((item) => (
                                      <li
                                        key={item.id}
                                        className="flex justify-between text-xs text-slate-600 dark:text-slate-300"
                                      >
                                        <span>
                                          #{item.sequence} · {formatDisplayDate(item.dueDate)}
                                        </span>
                                        <span className="tabular-nums font-semibold">
                                          {item.amount.toLocaleString('tr-TR', {
                                            maximumFractionDigits: 2,
                                          })}{' '}
                                          <span
                                            className={
                                              item.status === 'paid'
                                                ? 'text-emerald-600'
                                                : 'text-amber-600'
                                            }
                                          >
                                            {item.status === 'paid'
                                              ? t('detail.paid')
                                              : t('detail.pending')}
                                          </span>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )}

                  {detailTab === 'period' && (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-200/70 dark:border-slate-700/50 shrink-0">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                          {t('detail.tabPeriod')}
                        </h3>
                        {summary && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatDisplayDate(summary.periodStart)} →{' '}
                            {formatDisplayDate(summary.statementDate)} ·{' '}
                            {t('detail.periodBalance')}:{' '}
                            {summary.periodBalance.toLocaleString('tr-TR', {
                              maximumFractionDigits: 2,
                            })}{' '}
                            {summary.currency}
                          </p>
                        )}
                      </div>
                      {periodItems.length === 0 ? (
                        <p className="text-sm text-slate-500 p-4">{t('detail.noPeriodItems')}</p>
                      ) : (
                        <ul className="flex-1 overflow-y-auto px-4 py-2">
                          {periodItems.map(renderScheduleRow)}
                        </ul>
                      )}
                    </>
                  )}

                  {detailTab === 'pending' && (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-200/70 dark:border-slate-700/50 space-y-2 shrink-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                            {t('detail.tabPending')}
                          </h3>
                          <span className="text-xs font-semibold tabular-nums text-slate-500">
                            {pendingMonthTotal.toLocaleString('tr-TR', {
                              maximumFractionDigits: 2,
                            })}{' '}
                            {selected.currency}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPendingMonth('all')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              pendingMonth === 'all'
                                ? 'bg-brand-ink text-white'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            {t('detail.monthAll')}
                          </button>
                          {pendingMonths.map((ym) => (
                            <button
                              key={ym}
                              type="button"
                              onClick={() => setPendingMonth(ym)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                pendingMonth === ym
                                  ? 'bg-brand-ink text-white'
                                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600'
                              }`}
                            >
                              {formatMonthLabel(ym, locale)}
                            </button>
                          ))}
                        </div>
                      </div>
                      {filteredPending.length === 0 ? (
                        <p className="text-sm text-slate-500 p-4">{t('detail.noPendingItems')}</p>
                      ) : (
                        <ul className="flex-1 overflow-y-auto px-4 py-2">
                          {filteredPending.map(renderScheduleRow)}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      <AddCardModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        currencies={TRANSACTION_CURRENCIES}
        onCreated={async () => {
          setShowAdd(false);
          toast.success(t('toast.created'));
          await loadCards();
          await refreshDebts();
        }}
      />

      {selected && (
        <AddCardExpenseModal
          isOpen={showExpense}
          card={selected}
          onClose={() => setShowExpense(false)}
          onCreated={async () => {
            setShowExpense(false);
            toast.success(t('toast.expenseAdded'));
            await refreshSelected(selected.id, selected);
            await refreshTransactions();
            await refreshDebts();
          }}
        />
      )}

      {selected && (
        <BulkAddCardExpensesModal
          isOpen={showBulkExpense}
          card={selected}
          onClose={() => setShowBulkExpense(false)}
          onCreated={async () => {
            setShowBulkExpense(false);
            await refreshSelected(selected.id, selected);
            await refreshTransactions();
            await refreshDebts();
          }}
        />
      )}

      {selected && (
        <EditCardModal
          isOpen={showEditCard}
          card={selected}
          currencies={TRANSACTION_CURRENCIES}
          onClose={() => setShowEditCard(false)}
          onSaved={async () => {
            setShowEditCard(false);
            toast.success(t('toast.cardUpdated'));
            await refreshSelected(selected.id, selected);
            await refreshDebts();
          }}
        />
      )}

      {selected && (
        <DebtPaymentModal
          isOpen={showPay}
          debt={selected}
          schedule={schedule}
          onClose={() => setShowPay(false)}
          onPaid={async () => {
            setShowPay(false);
            toast.success(t('toast.paid'));
            await refreshSelected(selected.id, selected);
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

      {selected && (
        <EditCardChargeModal
          isOpen={Boolean(editingCharge)}
          debtId={selected.id}
          charge={editingCharge}
          onClose={() => setEditingCharge(null)}
          onSaved={async () => {
            const keepId = editingCharge?.chargeId || null;
            setEditingCharge(null);
            toast.success(t('toast.chargeUpdated'));
            if (keepId) {
              setDetailTab('charges');
              setExpandedIds((prev) => new Set(prev).add(keepId));
              setFocusChargeId(keepId);
            }
            await refreshSelected(selected.id, selected);
            await refreshDebts();
          }}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(pendingChargeDelete)}
        title={t('confirm.deleteChargeTitle')}
        message={t('confirm.deleteChargeMessage', {
          name: pendingChargeDelete?.category || pendingChargeDelete?.description || '',
          amount: pendingChargeDelete
            ? pendingChargeDelete.total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
            : '',
        })}
        confirmLabel={t('actions.deleteCharge')}
        cancelLabel={t('actions.cancel')}
        busy={deletingCharge}
        onCancel={() => {
          if (!deletingCharge) setPendingChargeDelete(null);
        }}
        onConfirm={() => void handleDeleteCharge()}
      />
    </div>
  );
};

export default Cards;
