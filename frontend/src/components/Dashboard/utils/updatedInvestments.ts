import type { CurrencyRate } from '../../Investments/types';

type FundRow = { key: string; value: string };

type StockRow = {
  code: string;
  last_price?: number;
};

/**
 * FinanceContext yatırımlarını güncel kurlar / borsa / fon listesi ile zenginleştirir (Dashboard & Investments ile uyumlu mantık).
 */
export function computeUpdatedInvestments(
  financeInvestments: any[],
  allCurrencies: CurrencyRate[],
  borsaData: StockRow[] | undefined,
  allFunds: FundRow[]
) {
  return financeInvestments.map((inv: any) => {
    let updatedCurrentPrice = inv.currentPrice;
    let displayType: 'stock' | 'crypto' | 'forex' | 'gold' | 'currency' | 'preciousMetal' | 'fund' = inv.type;
    let hasValidPrice = true;

    const currency = allCurrencies.find((c) => c.code === inv.symbol);
    if (currency) {
      updatedCurrentPrice = currency.buy || currency.rate || 0;
      if (currency.type === 'gold') {
        displayType = 'gold';
      } else if (currency.type === 'crypto') {
        displayType = 'crypto';
      } else if (currency.type === 'metal') {
        displayType = 'preciousMetal';
      } else {
        displayType = 'currency';
      }
    } else if (inv.type === 'stock') {
      const stock = borsaData?.find((s) => s.code === inv.symbol);
      if (stock) {
        updatedCurrentPrice = stock.last_price || 0;
      }
      displayType = 'stock';
    } else if (inv.type === 'forex' || (inv as { type?: string }).type === 'fund') {
      const fund = allFunds.find((f) => f.key === inv.symbol);
      if (fund) {
        const stock = borsaData?.find((s) => s.code === inv.symbol);
        if (stock && stock.last_price) {
          updatedCurrentPrice = stock.last_price;
          hasValidPrice = true;
        } else {
          updatedCurrentPrice = inv.currentPrice || 0;
          hasValidPrice = updatedCurrentPrice > 0;
        }
        displayType = 'fund';
      } else {
        displayType = 'currency';
      }
    } else if (inv.type === 'crypto') {
      displayType = 'crypto';
    }

    const priceForCalculation =
      hasValidPrice && updatedCurrentPrice != null && updatedCurrentPrice > 0 ? updatedCurrentPrice : 0;
    const updatedTotalValue = hasValidPrice ? inv.quantity * priceForCalculation : null;
    const totalCost = inv.quantity * inv.averagePrice;
    const updatedProfitLoss = hasValidPrice ? updatedTotalValue! - totalCost : null;
    const updatedProfitLossPercentage =
      hasValidPrice && totalCost > 0 ? (updatedProfitLoss! / totalCost) * 100 : null;

    return {
      ...inv,
      currentPrice: updatedCurrentPrice,
      totalValue: updatedTotalValue,
      profitLoss: updatedProfitLoss,
      profitLossPercentage: updatedProfitLossPercentage,
      displayType,
      hasValidPrice
    };
  });
}
