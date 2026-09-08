import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, HandCoins, Landmark, Wallet } from 'lucide-react';
import type { Debt, DebtKind } from '../../../types';

function kindIcon(kind: DebtKind) {
  if (kind === 'credit_card') return CreditCard;
  if (kind === 'loan') return Landmark;
  if (kind === 'receivable') return HandCoins;
  return Wallet;
}

function kindAccent(kind: DebtKind) {
  if (kind === 'receivable') {
    return {
      iconWrap: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      bar: 'bg-emerald-500',
      chip: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    };
  }
  if (kind === 'credit_card') {
    return {
      iconWrap: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
      bar: 'bg-amber-500',
      chip: 'bg-amber-500/10 text-amber-900 dark:text-amber-100',
    };
  }
  if (kind === 'loan') {
    return {
      iconWrap: 'bg-brand-ink/10 text-brand-ink dark:text-brand-champagne',
      bar: 'bg-brand-ink dark:bg-brand-champagne',
      chip: 'bg-brand-champagne/40 text-brand-ink dark:bg-brand-ink/50 dark:text-brand-champagne',
    };
  }
  return {
    iconWrap: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-500',
    chip: 'bg-rose-500/10 text-rose-800 dark:text-rose-200',
  };
}

export function debtProgress(debt: Debt): {
  remaining: number;
  total: number;
  paid: number;
  pct: number;
  showBar: boolean;
} {
  const remaining = Math.max(0, debt.remainingAmount || 0);
  if (debt.kind === 'credit_card') {
    const total = Math.max(remaining, debt.creditLimit || 0);
    const usedPct =
      total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
    return {
      remaining,
      total: debt.creditLimit || remaining,
      paid: Math.max(0, (debt.creditLimit || 0) - remaining),
      pct: usedPct,
      showBar: (debt.creditLimit || 0) > 0,
    };
  }
  const total = Math.max(remaining, debt.originalAmount || 0);
  const paid = Math.max(0, total - remaining);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return { remaining, total, paid, pct, showBar: total > 0 };
}

interface DebtListCardProps {
  debt: Debt;
  selected: boolean;
  onSelect: () => void;
}

const DebtListCard: React.FC<DebtListCardProps> = ({ debt, selected, onSelect }) => {
  const { t } = useTranslation('debts');
  const Icon = kindIcon(debt.kind);
  const accent = kindAccent(debt.kind);
  const { remaining, total, paid, pct, showBar } = debtProgress(debt);
  const isCard = debt.kind === 'credit_card';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
        selected
          ? 'border-brand-ink/50 bg-gradient-to-br from-brand-champagne/50 to-white dark:from-brand-ink/50 dark:to-brand-surface-dark shadow-sm ring-1 ring-brand-ink/20'
          : 'border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-brand-surface-dark hover:border-brand-ink/30 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl shrink-0 ${accent.iconWrap}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white truncate tracking-tight">
              {debt.name}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${accent.chip}`}>
                {t(`kinds.${debt.kind}`)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {t(`status.${debt.status}`)}
              </span>
              {debt.counterparty ? (
                <span className="text-[10px] text-slate-400 truncate max-w-[9rem]">
                  · {debt.counterparty}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t('detail.remaining')}
          </p>
          <p className="font-black text-slate-900 dark:text-white tabular-nums">
            {remaining.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-xs font-semibold text-slate-400 ml-1">{debt.currency}</span>
          </p>
        </div>
      </div>

      {showBar && (
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {t('detail.remainingOfTotal')}
            </span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {remaining.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
              {' / '}
              {total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
              style={{ width: `${isCard ? pct : pct}%` }}
              title={isCard ? `${pct}% limit` : `${pct}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>
              {isCard
                ? t('detail.limitUsed', { defaultValue: 'Limit kullanımı' })
                : t('detail.paidAmount')}
              {!isCard && (
                <>
                  :{' '}
                  {paid.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                </>
              )}
            </span>
            <span className="font-bold text-slate-600 dark:text-slate-300">%{pct}</span>
          </div>
        </div>
      )}
    </button>
  );
};

export default DebtListCard;
