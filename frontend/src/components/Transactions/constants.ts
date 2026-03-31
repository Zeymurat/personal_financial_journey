/** Sabit kategori listesi — modallar ve QuickActions ile uyumlu kalmalı */
export const TRANSACTION_CATEGORIES: { income: string[]; expense: string[] } = {
  income: ['Maaş', 'Freelance', 'Yatırım', 'Bonus', 'Kira', 'Diğer'],
  expense: ['Kira', 'Market', 'Ulaşım', 'Eğlence', 'Sağlık', 'Eğitim', 'Teknoloji', 'Giyim', 'Yatırım', 'Diğer']
};

/** Veritabanında saklanan yatırım kategorisi değeri (dil değişse de aynı kalır) */
export const INVESTMENT_CATEGORY_VALUE = 'Yatırım';
