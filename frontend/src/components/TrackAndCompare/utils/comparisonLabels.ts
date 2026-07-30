export function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'currency':
      return 'bg-brand-champagne text-brand-ink dark:bg-brand-surface-dark dark:text-brand-champagne';
    case 'gold':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'crypto':
      return 'bg-brand-champagne text-brand-ink dark:bg-brand-surface-dark dark:text-brand-champagne';
    case 'metal':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    case 'fund':
      return 'bg-brand-champagne text-brand-ink dark:bg-brand-surface-dark dark:text-brand-champagne';
    case 'stock':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

