/** Piyasa kartlarında kullanılan birleşik kur / emtia satırı */
export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}
