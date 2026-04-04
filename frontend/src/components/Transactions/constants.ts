/** Hızlı işlem ve işlem modallarında ortak döviz listesi */
export const TRANSACTION_CURRENCIES: { code: string; name: string }[] = [
  { code: 'TRY', name: 'TRY (₺)' },
  { code: 'USD', name: 'USD ($)' },
  { code: 'EUR', name: 'EUR (€)' },
  { code: 'GBP', name: 'GBP (£)' },
  { code: 'JPY', name: 'JPY (¥)' },
  { code: 'CHF', name: 'CHF' },
  { code: 'AUD', name: 'AUD' },
  { code: 'CAD', name: 'CAD' },
  { code: 'CNY', name: 'CNY' }
];

/** Sabit kategori listesi — modallar ve QuickActions ile uyumlu kalmalı */
export const TRANSACTION_CATEGORIES: { income: string[]; expense: string[] } = {
  income: ['Maaş', 'Freelance', 'Yatırım', 'Bonus', 'Kira', 'Diğer'],
  expense: ['Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Teknoloji', 'Giyim', 'Yatırım', 'Diğer']
};

/** Veritabanında saklanan yatırım kategorisi değeri (dil değişse de aynı kalır) */
export const INVESTMENT_CATEGORY_VALUE = 'Yatırım';
