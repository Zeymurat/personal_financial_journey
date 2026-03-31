import type { Transaction } from '../../../types';

export function mapTransactionFromApi(item: any): Transaction {
  let date = item.date;
  if (date && typeof date === 'object' && date.toDate) {
    date = date.toDate().toISOString().split('T')[0];
  } else if (!date || typeof date !== 'string') {
    date = new Date().toISOString().split('T')[0];
  }

  return {
    id: item.id || item._id,
    type: item.type || 'expense',
    amount: item.amount || 0,
    category: item.category || '',
    description: item.description || '',
    date,
    currency: item.currency || 'TRY',
    amountInTRY: item.amountInTRY || item.amount || 0
  };
}
