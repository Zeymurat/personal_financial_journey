import { Transaction, Investment, Currency, MonthlyReport, InvestmentTransaction } from '../types';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 15000,
    category: 'Maaş',
    description: 'Aylık maaş',
    date: '2024-01-15',
    currency: 'TRY'
  },
  {
    id: '2',
    type: 'expense',
    amount: 3500,
    category: 'Kira',
    description: 'Aylık kira ödemesi',
    date: '2024-01-05',
    currency: 'TRY'
  },
  {
    id: '3',
    type: 'expense',
    amount: 1200,
    category: 'Market',
    description: 'Aylık market alışverişi',
    date: '2024-01-10',
    currency: 'TRY'
  },
  {
    id: '4',
    type: 'income',
    amount: 2500,
    category: 'Freelance',
    description: 'Web projesi ödemesi',
    date: '2024-01-20',
    currency: 'TRY'
  },
  {
    id: '5',
    type: 'expense',
    amount: 850,
    category: 'Ulaşım',
    description: 'Aylık ulaşım gideri',
    date: '2024-01-08',
    currency: 'TRY'
  }
];

export const mockInvestmentTransactions: InvestmentTransaction[] = [
  // Apple transactions
  { id: '1', type: 'buy', quantity: 5, price: 140, totalAmount: 700, date: '2023-10-15', fees: 5 },
  { id: '2', type: 'buy', quantity: 3, price: 155, totalAmount: 465, date: '2023-11-20', fees: 3 },
  { id: '3', type: 'buy', quantity: 2, price: 160, totalAmount: 320, date: '2023-12-10', fees: 2 },
  
  // Bitcoin transactions
  { id: '4', type: 'buy', quantity: 0.2, price: 42000, totalAmount: 8400, date: '2023-09-05', fees: 25 },
  { id: '5', type: 'buy', quantity: 0.3, price: 48000, totalAmount: 14400, date: '2023-11-15', fees: 35 },
  
  // Google transactions
  { id: '6', type: 'buy', quantity: 3, price: 2750, totalAmount: 8250, date: '2023-10-25', fees: 15 },
  { id: '7', type: 'buy', quantity: 2, price: 2850, totalAmount: 5700, date: '2023-12-05', fees: 10 },
  
  // Ethereum transactions
  { id: '8', type: 'buy', quantity: 4, price: 2100, totalAmount: 8400, date: '2023-09-20', fees: 20 },
  { id: '9', type: 'buy', quantity: 4, price: 2300, totalAmount: 9200, date: '2023-11-30', fees: 22 }
];

export const mockInvestments: Investment[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    quantity: 10,
    averagePrice: 150,
    currentPrice: 175,
    totalValue: 1750,
    profitLoss: 250,
    profitLossPercentage: 16.67,
    transactions: mockInvestmentTransactions.filter(t => ['1', '2', '3'].includes(t.id))
  },
  {
    id: '2',
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    quantity: 0.5,
    averagePrice: 45000,
    currentPrice: 52000,
    totalValue: 26000,
    profitLoss: 3500,
    profitLossPercentage: 15.56,
    transactions: mockInvestmentTransactions.filter(t => ['4', '5'].includes(t.id))
  },
  {
    id: '3',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    quantity: 5,
    averagePrice: 2800,
    currentPrice: 2950,
    totalValue: 14750,
    profitLoss: 750,
    profitLossPercentage: 5.36,
    transactions: mockInvestmentTransactions.filter(t => ['6', '7'].includes(t.id))
  },
  {
    id: '4',
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    quantity: 8,
    averagePrice: 2200,
    currentPrice: 2500,
    totalValue: 20000,
    profitLoss: 2400,
    profitLossPercentage: 13.64,
    transactions: mockInvestmentTransactions.filter(t => ['8', '9'].includes(t.id))
  }
];

export const mockCurrencies: Currency[] = [
  { code: 'USD', name: 'Amerikan Doları', rate: 30.25, change: 0.35 },
  { code: 'EUR', name: 'Euro', rate: 32.80, change: -0.15 },
  { code: 'GBP', name: 'İngiliz Sterlini', rate: 38.45, change: 0.25 },
  { code: 'JPY', name: 'Japon Yeni', rate: 0.21, change: -0.02 },
  { code: 'CHF', name: 'İsviçre Frangı', rate: 33.15, change: 0.18 }
];

export const mockMonthlyReports: MonthlyReport[] = [
  { month: 'Ocak 2024', income: 17500, expenses: 6350, netIncome: 11150, investmentGain: 1250 },
  { month: 'Aralık 2023', income: 15000, expenses: 5800, netIncome: 9200, investmentGain: -850 },
  { month: 'Kasım 2023', income: 16200, expenses: 6100, netIncome: 10100, investmentGain: 2100 },
  { month: 'Ekim 2023', income: 15000, expenses: 5900, netIncome: 9100, investmentGain: 750 },
  { month: 'Eylül 2023', income: 15500, expenses: 6200, netIncome: 9300, investmentGain: 1850 },
  { month: 'Ağustos 2023', income: 14800, expenses: 5750, netIncome: 9050, investmentGain: -420 }
];