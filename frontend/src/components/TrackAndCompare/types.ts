export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  buy: number;
  sell: number;
  change: number;
  type?: 'currency' | 'gold' | 'crypto' | 'metal';
}

export interface ComparisonItem {
  id: string;
  name: string;
  code: string;
  type: 'currency' | 'gold' | 'crypto' | 'metal' | 'fund' | 'stock';
  price: number;
  change: number;
  buy?: number;
  sell?: number;
  order: number;
}
