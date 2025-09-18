export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  currency: string;
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  transactions: InvestmentTransaction[];
}

export interface InvestmentTransaction {
  id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  date: string;
  fees?: number;
  createdAt?: Date | string | { toDate: () => Date };
  updatedAt?: Date | string | { toDate: () => Date };
}

export interface Currency {
  code: string;
  name: string;
  rate: number;
  change: number;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  netIncome: number;
  investmentGain: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}