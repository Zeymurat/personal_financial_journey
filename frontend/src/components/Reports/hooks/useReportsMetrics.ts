import { useMemo } from 'react';
import type { Transaction } from '../../../types';
import { getMonthStart, getMonthEnd, formatMonthYear } from '../utils/monthHelpers';

export function useReportsMetrics(
  transactions: Transaction[],
  investments: any[],
  investmentTransactions: any[]
) {

  // Bu ay ve önceki ay için verileri hesapla
  const currentDate = new Date();
  const currentMonthStart = getMonthStart(currentDate);
  const currentMonthEnd = getMonthEnd(currentDate);

  const previousMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthStart = getMonthStart(previousMonthDate);
  const previousMonthEnd = getMonthEnd(previousMonthDate);

  // Bu ay transaction'ları
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });
  }, [transactions, currentMonthStart, currentMonthEnd]);

  // Önceki ay transaction'ları
  const previousMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd;
    });
  }, [transactions, previousMonthStart, previousMonthEnd]);

  // Bu ay hesaplamaları
  const currentMonthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);
  }, [currentMonthTransactions]);

  const currentMonthExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);
  }, [currentMonthTransactions]);

  const currentMonthNetIncome = currentMonthIncome - currentMonthExpenses;

  // Önceki ay hesaplamaları
  const previousMonthIncome = useMemo(() => {
    return previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);
  }, [previousMonthTransactions]);

  const previousMonthExpenses = useMemo(() => {
    return previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);
  }, [previousMonthTransactions]);

  const previousMonthNetIncome = previousMonthIncome - previousMonthExpenses;

  // Son 4 ay için gelir/gider verileri
  const monthlyIncomeExpenseData = useMemo(() => {
    const months: Array<{ month: Date; monthStart: Date; monthEnd: Date; label: string }> = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = getMonthStart(date);
      const monthEnd = getMonthEnd(date);
      months.push({
        month: date,
        monthStart,
        monthEnd,
        label: formatMonthYear(date)
      });
    }

    return months.map(({ monthStart, monthEnd, label }) => {
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);

      const netIncome = income - expenses;

      return {
        month: label,
        income,
        expenses,
        netIncome
      };
    });
  }, [transactions, currentDate]);

  // Son 12 ay için detaylı rapor verileri (Gelir, Gider, Net Gelir, Yatırım Kazancı, Tasarruf Oranı)
  const monthlyDetailedReportData = useMemo(() => {
    const months: Array<{ month: Date; monthStart: Date; monthEnd: Date; label: string }> = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = getMonthStart(date);
      const monthEnd = getMonthEnd(date);
      months.push({
        month: date,
        monthStart,
        monthEnd,
        label: formatMonthYear(date)
      });
    }

    // Tarih parse helper
    const parseDate = (date: any): Date | null => {
      if (!date) return null;
      if (date && typeof date === 'object' && 'toDate' in date) {
        return date.toDate();
      } else if (typeof date === 'string') {
        return new Date(date);
      }
      return null;
    };

    return months.map(({ monthStart, monthEnd, label }) => {
      // Gelir/Gider hesaplamaları
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amountInTRY || t.amount || 0), 0);

      const netIncome = income - expenses;

      // O ay için yatırım kazancı: O ay sonundaki investment durumunu hesapla
      // Ancak bu ayki işlemlere göre değil, o ayın sonundaki duruma göre hesaplamak daha doğru
      // Basit yaklaşım: O ay içindeki yatırım işlemlerinden kazanç hesapla
      let investmentGain = 0;
      
      // O ay sonundaki investment değerlerini hesaplamak için, o ay ve öncesindeki tüm işlemleri dikkate al
      const transactionsUpToMonthEnd = investmentTransactions.filter((trans: any) => {
        const transDate = parseDate(trans.date);
        if (!transDate) return false;
        return transDate <= monthEnd;
      });

      // Her investment için o ay sonundaki durumu hesapla
      const investmentStateAtMonthEnd: Record<string, { quantity: number; totalCost: number; avgCost: number }> = {};
      
      transactionsUpToMonthEnd.forEach((trans: any) => {
        const investmentId = trans.investmentId || trans.investment?._id;
        if (!investmentId) return;

        if (!investmentStateAtMonthEnd[investmentId]) {
          investmentStateAtMonthEnd[investmentId] = { quantity: 0, totalCost: 0, avgCost: 0 };
        }

        const state = investmentStateAtMonthEnd[investmentId];

        if (trans.type === 'buy') {
          const totalCost = (trans.price || 0) * (trans.quantity || 0) + (trans.fees || 0);
          const newQuantity = state.quantity + (trans.quantity || 0);
          const newTotalCost = state.totalCost + totalCost;
          state.quantity = newQuantity;
          state.totalCost = newTotalCost;
          state.avgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
        } else if (trans.type === 'sell') {
          if (state.quantity <= 0) return;
          const sellCostBasis = (trans.quantity || 0) * state.avgCost;
          state.quantity -= (trans.quantity || 0);
          state.totalCost -= sellCostBasis;
          state.avgCost = state.quantity > 0 ? state.totalCost / state.quantity : 0;
        }
      });

      // O ay sonundaki investment değerlerini hesapla
      Object.entries(investmentStateAtMonthEnd).forEach(([id, state]) => {
        if (state.quantity > 0) {
          const investment = investments.find(inv => (inv.id || inv._id) === id);
          if (investment) {
            const currentPrice = investment.currentPrice || 0;
            const totalValue = state.quantity * currentPrice;
            const profitLoss = totalValue - state.totalCost;
            investmentGain += profitLoss;
          }
        }
      });

      const savingsRate = income > 0 ? ((netIncome / income) * 100) : 0;

      return {
        month: label,
        income,
        expenses,
        netIncome,
        investmentGain,
        savingsRate
      };
    });
  }, [transactions, investmentTransactions, investments, currentDate]);

  // Aylık yatırım performansı hesaplama
  const monthlyInvestmentData = useMemo(() => {
    // Son 6 ay için veri hesapla
    const months: Array<{ month: Date; monthStart: Date; monthEnd: Date; label: string }> = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = getMonthStart(date);
      const monthEnd = getMonthEnd(date);
      months.push({
        month: date,
        monthStart,
        monthEnd,
        label: formatMonthYear(date)
      });
    }

    // Tarih parse helper
    const parseDate = (date: any): Date | null => {
      if (!date) return null;
      if (date && typeof date === 'object' && 'toDate' in date) {
        return date.toDate();
      } else if (typeof date === 'string') {
        return new Date(date);
      }
      return null;
    };

    // Yatırım maliyetini doğru hesaplamak için tüm alım/satım işlemlerini tarih sırasına göre alalım
    const allTransactions = [...investmentTransactions]
      .map(trans => ({
        ...trans,
        date: parseDate(trans.date),
        // Toplam maliyeti hesapla (fiyat * miktar + komisyon)
        totalCost: trans.type === 'buy' 
          ? (trans.price * trans.quantity + (trans.fees || 0))
          : (trans.price * trans.quantity - (trans.fees || 0))
      }))
      .filter(trans => trans.date) // Geçerli tarihi olmayanları filtrele
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Ayları ters çevir (en yeni en üstte olacak şekilde)
    const reversedMonths = [...months].reverse();

    // Yatırım durumunu takip etmek için tipler
    interface InvestmentState {
      quantity: number;
      totalCost: number;
      avgCost: number;
      realizedGain: number;
    }

    const investmentState: Record<string, InvestmentState> = {};

    return reversedMonths.reduce((acc, { monthStart, monthEnd, label }, index) => {
      // Önceki ayın değerini al veya sıfırla başla
      const prevMonth = index > 0 ? acc[acc.length - 1] : {
        buyTotal: 0,
        sellTotal: 0,
        value: 0,
        costBasis: 0,
        realizedGain: 0
      };

      // Bu ayın başlangıç durumu
      let monthBuys = 0;
      let monthSells = 0;
      let monthRealizedGain = 0;

      // Bu ayın işlemlerini filtrele
      const monthTransactions = allTransactions.filter(trans => 
        trans.date >= monthStart && trans.date <= monthEnd
      );


      // Bu ayın işlemlerini işle
      monthTransactions.forEach(trans => {
        const investmentId = trans.investmentId || trans.investment?._id;
        if (!investmentId || !trans.quantity) return;

        if (!investmentState[investmentId]) {
          investmentState[investmentId] = { 
            quantity: 0, 
            totalCost: 0, 
            avgCost: 0, 
            realizedGain: 0 
          };
        }

        const investment = investmentState[investmentId];

        if (trans.type === 'buy') {
          const totalCost = trans.price * trans.quantity + (trans.fees || 0);
          monthBuys += totalCost;
          
          // Yatırım durumunu güncelle
          const newQuantity = investment.quantity + trans.quantity;
          const newTotalCost = investment.totalCost + totalCost;
          
          investment.quantity = newQuantity;
          investment.totalCost = newTotalCost;
          investment.avgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
          
          // Debug log for buy transactions
          if (label === 'Kasım 2025') {
            console.log('Kasım Ayı Alım Detayı:', {
              tarih: trans.date.toLocaleDateString('tr-TR'),
              miktar: trans.quantity,
              birimFiyat: trans.price,
              toplamMaliyet: totalCost,
              yatırım: investments.find(inv => inv._id === investmentId)?.name || 'Bilinmeyen'
            });
          }
        } 
        else if (trans.type === 'sell') {
          if (investment.quantity <= 0) return;
          
          // İşlem tutarını doğrudan kullan
          const sellAmount = trans.totalCost || (trans.price * trans.quantity);
          const sellCostBasis = trans.quantity * investment.avgCost;
          const realizedGain = sellAmount - sellCostBasis;

          monthSells += sellAmount;
          monthRealizedGain += realizedGain;

          // Yatırım durumunu güncelle
          investment.quantity -= trans.quantity;
          investment.totalCost -= sellCostBasis;
          investment.avgCost = investment.quantity > 0 ? investment.totalCost / investment.quantity : 0;
          investment.realizedGain += realizedGain;
          
          // Debug log for sell transactions
          if (label === 'Kasım 2025') {
            console.log('Kasım Ayı Satış Detayı:', {
              tarih: trans.date.toLocaleDateString('tr-TR'),
              miktar: trans.quantity,
              birimFiyat: trans.price,
              işlemTutarı: sellAmount,
              maliyetBazı: sellCostBasis,
              kazanç: realizedGain,
              yatırım: investments.find(inv => inv._id === investmentId)?.name || 'Bilinmeyen'
            });
          }
        }
      });

      // Mevcut yatırımların değerini hesapla
      const currentValue = Object.entries(investmentState).reduce((sum, [id, inv]) => {
        if (inv.quantity <= 0) return sum;
        const investment = investments.find(i => (i._id === id) || (i.id === id));
        const currentPrice = investment?.currentPrice || 0;
        return sum + (inv.quantity * currentPrice);
      }, 0);

      // Toplam maliyet bazı
      const costBasis = Object.values(investmentState).reduce(
        (sum, inv) => sum + inv.totalCost, 0
      );

      // Net getiri hesapla: Bu Ayın Değeri - (Önceki Ayın Değeri + Bu Ayın Alım Maliyeti)
      const netReturn = currentValue - (prevMonth.value + monthBuys);

      // Getiri yüzdesi
      const returnPercentage = (prevMonth.value + monthBuys) > 0 
        ? ((currentValue - (prevMonth.value + monthBuys)) / (prevMonth.value + monthBuys)) * 100 
        : 0;

      const result = {
        month: label,
        buyTotal: monthBuys,
        sellTotal: monthSells,
        gain: netReturn,
        value: currentValue,
        costBasis: costBasis,
        realizedGain: monthRealizedGain,
        returnPercentage: returnPercentage
      };

      // Debug çıktıları
      console.log(`\n--- ${label} Ayı Özeti ---`);
      console.log('Önceki Ay Değeri:', prevMonth.value.toFixed(2), 'TL');
      console.log('Bu Ay Alımlar:', monthBuys.toFixed(2), 'TL');
      console.log('Bu Ay Satışlar:', monthSells.toFixed(2), 'TL');
      console.log('Net Getiri:', netReturn.toFixed(2), 'TL');
      console.log('Mevcut Değer:', currentValue.toFixed(2), 'TL');
      console.log('Maliyet Bazı:', costBasis.toFixed(2), 'TL');
      console.log('Gerçekleşen Kazanç:', monthRealizedGain.toFixed(2), 'TL');

      acc.push(result);
      return acc;
    }, [] as Array<{ month: string; buyTotal: number; sellTotal: number; gain: number; value: number }>).reverse(); // Tekrar ters çevir ki en yeni ay üstte olsun
  }, [investmentTransactions, investments, currentDate]);

  // Yatırım hesaplamaları (bu ay için)
  const investmentData = useMemo(() => {
    // Bu ay içindeki tüm transaction'ları filtrele (hem alım hem satış)
    const filteredTransactions = investmentTransactions.filter((trans: any) => {
      let transDate: Date | null = null;
      if (trans.date && typeof trans.date === 'object' && trans.date.toDate) {
        transDate = trans.date.toDate();
      } else if (typeof trans.date === 'string') {
        // String tarih formatı: "YYYY-MM-DD" veya "YYYY-MM-DDTHH:mm:ss"
        const dateStr = trans.date.split('T')[0]; // Sadece tarih kısmını al
        const [year, month, day] = dateStr.split('-').map(Number);
        transDate = new Date(year, month - 1, day); // Month 0-indexed
      } else {
        return false;
      }

      if (!transDate || isNaN(transDate.getTime())) {
        return false;
      }

      // Tarih karşılaştırması için saat bilgisini normalize et (local timezone)
      const normalizedTransDate = new Date(transDate.getFullYear(), transDate.getMonth(), transDate.getDate());
      normalizedTransDate.setHours(0, 0, 0, 0);

      // Ay başı ve ay sonu zaten normalize edilmiş olmalı
      const normalizedMonthStart = new Date(currentMonthStart);
      normalizedMonthStart.setHours(0, 0, 0, 0);
      const normalizedMonthEnd = new Date(currentMonthEnd);
      normalizedMonthEnd.setHours(23, 59, 59, 999);

      return normalizedTransDate >= normalizedMonthStart &&
        normalizedTransDate <= normalizedMonthEnd;
    });

    const calculateSellCost = (trans: any) => {
      const investment = investments.find(inv => (inv.id || inv._id) === trans.investmentId);
      if (!investment) return 0;

      const buysBeforeThisSell = investmentTransactions.filter((buyTrans: any) => {
        let buyDate: Date | null = null;
        if (buyTrans.date && typeof buyTrans.date === 'object' && buyTrans.date.toDate) {
          buyDate = buyTrans.date.toDate();
        } else if (typeof buyTrans.date === 'string') {
          const dateStr = buyTrans.date.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          buyDate = new Date(year, month - 1, day);
        }

        let sellDate: Date | null = null;
        if (trans.date && typeof trans.date === 'object' && trans.date.toDate) {
          sellDate = trans.date.toDate();
        } else if (typeof trans.date === 'string') {
          const dateStr = trans.date.split('T')[0];
          const [year, month, day] = dateStr.split('-').map(Number);
          sellDate = new Date(year, month - 1, day);
        }

        if (!buyDate || !sellDate) return false;

        return buyDate < sellDate &&
          buyTrans.type === 'buy' &&
          (buyTrans.investmentId === trans.investmentId);
      });

      const buyQty = buysBeforeThisSell.reduce((s: number, t: any) => s + (t.quantity || 0), 0);
      const buyCost = buysBeforeThisSell.reduce((s: number, t: any) => {
        return s + (t.totalAmount || ((t.price || 0) * (t.quantity || 0) + (t.fees || 0)));
      }, 0);

      const avgCost = buyQty > 0 ? buyCost / buyQty : (investment.averagePrice || 0);
      return avgCost * (trans.quantity || 0);
    };

    let buyTotal = 0;
    let sellTotal = 0;

    filteredTransactions.forEach((trans: any) => {
      if (trans.type === 'buy') {
        const amount = trans.totalAmount || ((trans.price || 0) * (trans.quantity || 0) + (trans.fees || 0));
        buyTotal += amount;
      } else if (trans.type === 'sell') {
        const sellCost = calculateSellCost(trans);
        sellTotal += sellCost;
      }
    });

    const currentMonthInvestmentPrincipal = buyTotal - sellTotal;

    // Debug: Sadece development'ta
    if (process.env.NODE_ENV === 'development') {
      const buyTransactions = filteredTransactions.filter((t: any) => t.type === 'buy');
      const sellTransactions = filteredTransactions.filter((t: any) => t.type === 'sell');

      console.log('Yatırım Anapara Hesaplama:', {
        totalTransactions: investmentTransactions.length,
        filteredCount: filteredTransactions.length,
        buyCount: buyTransactions.length,
        sellCount: sellTransactions.length,
        currentMonthStart: currentMonthStart.toISOString(),
        currentMonthEnd: currentMonthEnd.toISOString(),
        buyTotal,
        sellTotal,
        principal: currentMonthInvestmentPrincipal,
        buyTransactions: buyTransactions.map((t: any) => ({
          date: t.date,
          type: t.type,
          amount: t.totalAmount || ((t.price || 0) * (t.quantity || 0) + (t.fees || 0))
        })),
        sellTransactions: sellTransactions.map((t: any) => {
          const investment = investments.find(inv => (inv.id || inv._id) === t.investmentId);
          const avgCost = investment?.averagePrice || 0;
          const sellCost = calculateSellCost(t);
          return {
            date: t.date,
            type: t.type,
            quantity: t.quantity,
            avgCost,
            sellCost: -sellCost // Negatif olarak göster
          };
        })
      });
    }

    // Yatırım kazancı: Toplam kar/zarar (profitLoss)
    const totalGain = investments.reduce((sum, inv) => {
      return sum + (inv.profitLoss || 0);
    }, 0);

    // Debug log for investment data
    console.log('--- Yatırım Hesaplama Detayları ---');
    console.log('Bu Ay Alımlar:', buyTotal.toFixed(2), 'TL');
    console.log('Bu Ay Satışlar:', sellTotal.toFixed(2), 'TL');
    console.log('Toplam Kar/Zarar:', totalGain.toFixed(2), 'TL');
    console.log('Mevcut Anapara:', currentMonthInvestmentPrincipal.toFixed(2), 'TL');

    // Log all investment transactions for the current month
    const currentMonthTransactions = investmentTransactions.filter(trans => {
      const transDate = trans.date?.toDate ? trans.date.toDate() : new Date(trans.date);
      return transDate >= currentMonthStart && transDate <= currentMonthEnd;
    });

    console.log('\n--- Bu Ayki Yatırım İşlemleri ---');
    currentMonthTransactions.forEach(trans => {
      const transDate = trans.date?.toDate ? trans.date.toDate() : new Date(trans.date);
      console.log({
        tarih: transDate.toLocaleDateString('tr-TR'),
        tür: trans.type,
        miktar: trans.quantity,
        birimFiyat: trans.price,
        toplamTutar: trans.totalCost || (trans.price * trans.quantity),
        komisyon: trans.fees || 0,
        yatırım: investments.find(inv => inv._id === trans.investmentId)?.name || 'Bilinmeyen'
      });
    });

    return {
      totalInvested: currentMonthInvestmentPrincipal,
      buyTotal,
      sellTotal,
      totalGain
    };
  }, [investments, investmentTransactions, currentMonthStart, currentMonthEnd]);

  // Değişim yüzdeleri
  const incomeChange = previousMonthIncome > 0
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
    : 0;
  const expenseChange = previousMonthExpenses > 0
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100
    : 0;
  const netIncomeChange = previousMonthNetIncome !== 0
    ? ((currentMonthNetIncome - previousMonthNetIncome) / Math.abs(previousMonthNetIncome)) * 100
    : 0;

  // Genel trend (i18n anahtarı için)
  const generalTrend = currentMonthNetIncome > previousMonthNetIncome ? 'positive' : 'negative';
  const trendColor = generalTrend === 'positive' ? 'text-green-600' : 'text-red-600';

  return {
    currentDate,
    currentMonthStart,
    currentMonthEnd,
    currentMonthIncome,
    currentMonthExpenses,
    currentMonthNetIncome,
    previousMonthIncome,
    previousMonthExpenses,
    previousMonthNetIncome,
    monthlyIncomeExpenseData,
    monthlyDetailedReportData,
    monthlyInvestmentData,
    investmentData,
    incomeChange,
    expenseChange,
    netIncomeChange,
    generalTrend,
    trendColor,
    formatMonthYear
  };
}
