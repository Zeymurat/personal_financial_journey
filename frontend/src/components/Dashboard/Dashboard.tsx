import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useFinance } from '../../contexts/FinanceContext';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, DollarSign } from 'lucide-react';
import { transactionAPI, investmentAPI, fundsAPI, settingsAPI } from '../../services/apiService';
import type { Currency, Transaction } from '../../types';
import AddTransactionModal from '../Transactions/modals/AddTransactionModal';
import AddInvestmentModal from '../Investments/modals/AddInvestmentModal';
import { buildAllCurrencies } from '../Investments/utils/buildAllCurrencies';
import { TRANSACTION_CATEGORIES } from './constants';
import { getLastMonthBounds, getThisMonthBounds, isDateInRange } from './utils/dateRange';
import { calculatePercentageChange } from './utils/metrics';
import { mapTransactionFromApi } from './utils/mapTransactionFromApi';
import { computeUpdatedInvestments } from './utils/updatedInvestments';
import type { DashboardStatItem } from './types';
import DashboardHeader from './sections/DashboardHeader';
import DashboardStatsGrid from './sections/DashboardStatsGrid';
import DashboardPerformanceSection from './sections/DashboardPerformanceSection';
import DashboardRecentTransactions from './sections/DashboardRecentTransactions';
import DashboardInvestmentOverview from './sections/DashboardInvestmentOverview';
import DashboardQuickActions from './sections/DashboardQuickActions';
import DashboardTargetModal from './sections/DashboardTargetModal';

const Dashboard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { currentUser, loading: authLoading, authenticating } = useAuth();

  const {
    exchangeRates: contextExchangeRates,
    goldPrices,
    cryptoCurrencies,
    preciousMetals,
    borsaData,
    investments: financeInvestments,
    addInvestmentTransaction,
    refreshInvestments
  } = useFinance();

  useTokenValidation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, { rate: number }>>({});
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<'income' | 'expense'>('expense');
  const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [allFunds, setAllFunds] = useState<Array<{ key: string; value: string }>>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetModalType, setTargetModalType] = useState<'monthly' | 'savings'>('monthly');
  const [targetInputValue, setTargetInputValue] = useState('');

  const [monthlyTarget, setMonthlyTarget] = useState<number | null>(null);
  const [totalSavingsTarget, setTotalSavingsTarget] = useState<number | null>(null);
  const [targetsLoaded, setTargetsLoaded] = useState(false);

  useEffect(() => {
    if (Object.keys(contextExchangeRates).length > 0) {
      const rateMap: Record<string, { rate: number }> = {};
      Object.entries(contextExchangeRates).forEach(([code, currency]) => {
        rateMap[code] = { rate: currency.rate || 0 };
      });
      rateMap['TRY'] = { rate: 1 };
      setExchangeRates(rateMap);
    }
  }, [contextExchangeRates]);

  const loadData = useCallback(async () => {
    if (authLoading || authenticating) return;
    if (!currentUser?.id) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const transactionsResponse = await transactionAPI.getAll();
      if (transactionsResponse?.success && Array.isArray(transactionsResponse.data)) {
        const transactionsData = transactionsResponse.data.map(mapTransactionFromApi);
        setTransactions(transactionsData);
      }
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, authLoading, authenticating]);

  useEffect(() => {
    const run = async () => {
      if (authLoading || authenticating) return;
      if (!currentUser?.id) return;

      const token = localStorage.getItem('access_token');
      if (!token) {
        const retryTimeout = setTimeout(() => {
          void run();
        }, 500);
        return () => clearTimeout(retryTimeout);
      }

      await loadData();
    };

    void run();
  }, [currentUser, authLoading, authenticating, loadData]);

  const convertToTRY = useMemo(() => {
    return (transaction: Transaction): number => {
      if (transaction.amountInTRY !== undefined && transaction.amountInTRY !== null) {
        return transaction.amountInTRY;
      }
      const currency = transaction.currency || 'TRY';
      if (currency === 'TRY') return transaction.amount;
      const rate = exchangeRates[currency]?.rate;
      if (!rate || rate === 0) {
        return transaction.amount;
      }
      return transaction.amount * rate;
    };
  }, [exchangeRates]);

  const now = new Date();
  const { start: thisMonthStart, end: thisMonthEnd } = getThisMonthBounds(now);
  const { start: lastMonthStart, end: lastMonthEnd } = getLastMonthBounds(now);

  const thisMonthIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && isDateInRange(t.date, thisMonthStart, thisMonthEnd))
      .reduce((sum, t) => sum + convertToTRY(t), 0);
  }, [transactions, thisMonthStart, thisMonthEnd, convertToTRY]);

  const thisMonthExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && isDateInRange(t.date, thisMonthStart, thisMonthEnd))
      .reduce((sum, t) => sum + convertToTRY(t), 0);
  }, [transactions, thisMonthStart, thisMonthEnd, convertToTRY]);

  const netIncome = thisMonthIncome - thisMonthExpense;

  const lastMonthIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income' && isDateInRange(t.date, lastMonthStart, lastMonthEnd))
      .reduce((sum, t) => sum + convertToTRY(t), 0);
  }, [transactions, lastMonthStart, lastMonthEnd, convertToTRY]);

  const lastMonthExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense' && isDateInRange(t.date, lastMonthStart, lastMonthEnd))
      .reduce((sum, t) => sum + convertToTRY(t), 0);
  }, [transactions, lastMonthStart, lastMonthEnd, convertToTRY]);

  const lastMonthNet = lastMonthIncome - lastMonthExpense;

  const incomeChange = calculatePercentageChange(thisMonthIncome, lastMonthIncome);
  const expenseChange = calculatePercentageChange(thisMonthExpense, lastMonthExpense);
  const netIncomeChange = calculatePercentageChange(netIncome, lastMonthNet);

  const totalNetWorth = useMemo(() => {
    return (
      transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + convertToTRY(t), 0) -
      transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + convertToTRY(t), 0)
    );
  }, [transactions, convertToTRY]);

  const netChangeAmount = netIncome - lastMonthNet;
  const netChangeText = `${netChangeAmount >= 0 ? '+' : ''}₺${Math.abs(netChangeAmount).toLocaleString('tr-TR')}`;

  const allCurrencies = useMemo(
    () =>
      buildAllCurrencies(
        contextExchangeRates as Record<string, Currency>,
        goldPrices as Record<string, Currency>,
        cryptoCurrencies as Record<string, Currency>,
        preciousMetals as Record<string, Currency>
      ),
    [contextExchangeRates, goldPrices, cryptoCurrencies, preciousMetals]
  );

  const updatedInvestments = useMemo(
    () => computeUpdatedInvestments(financeInvestments, allCurrencies, borsaData || [], allFunds),
    [financeInvestments, allCurrencies, borsaData, allFunds]
  );

  const activeInvestments = useMemo(() => {
    return updatedInvestments
      .filter((inv: { quantity: number }) => inv.quantity > 0)
      .sort((a: { totalValue?: number }, b: { totalValue?: number }) => (b.totalValue || 0) - (a.totalValue || 0));
  }, [updatedInvestments]);

  useEffect(() => {
    const loadFunds = async () => {
      if (allFunds.length > 0) return;

      try {
        const response = await fundsAPI.getFunds();
        if (response?.success && response?.data?.funds) {
          const fundsList = response.data.funds.map((fund: { key?: string; id?: string; value?: string }) => ({
            key: fund.key || fund.id,
            value: fund.value || ''
          }));
          setAllFunds(fundsList);
        }
      } catch (error) {
        console.error('Funds verileri yüklenirken hata:', error);
        setAllFunds([]);
      }
    };

    void loadFunds();
  }, [allFunds.length]);

  const totalInvestmentValue = useMemo(() => {
    return activeInvestments.reduce((sum: number, inv: { totalValue?: number; hasValidPrice?: boolean }) => {
      return sum + (inv.totalValue && inv.hasValidPrice !== false ? inv.totalValue : 0);
    }, 0);
  }, [activeInvestments]);

  const totalInvestmentGain = useMemo(() => {
    return activeInvestments.reduce((sum: number, inv: { profitLoss?: number; hasValidPrice?: boolean }) => {
      return sum + (inv.profitLoss && inv.hasValidPrice !== false ? inv.profitLoss : 0);
    }, 0);
  }, [activeInvestments]);

  const totalInvestmentCost = useMemo(() => {
    return activeInvestments.reduce((sum: number, inv: { totalValue?: number; profitLoss?: number }) => {
      const cost = (inv.totalValue || 0) - (inv.profitLoss || 0);
      return sum + Math.max(0, cost);
    }, 0);
  }, [activeInvestments]);

  const savingsRate = useMemo(() => {
    if (thisMonthIncome === 0) return 0;
    return (netIncome / thisMonthIncome) * 100;
  }, [netIncome, thisMonthIncome]);

  const lastMonthSavingsRate = useMemo(() => {
    if (lastMonthIncome === 0) return 0;
    return (lastMonthNet / lastMonthIncome) * 100;
  }, [lastMonthNet, lastMonthIncome]);

  const savingsRateChange = savingsRate - lastMonthSavingsRate;

  const investmentROI = useMemo(() => {
    if (totalInvestmentCost === 0) return 0;
    return (totalInvestmentGain / totalInvestmentCost) * 100;
  }, [totalInvestmentGain, totalInvestmentCost]);

  useEffect(() => {
    const loadTargets = async () => {
      if (authLoading || authenticating) return;
      if (!currentUser?.id || targetsLoaded) return;

      const token = localStorage.getItem('access_token');
      if (!token) {
        const retryTimeout = setTimeout(() => {
          void loadTargets();
        }, 500);
        return () => clearTimeout(retryTimeout);
      }

      try {
        const settingsResponse = await settingsAPI.get();
        if (settingsResponse?.success && settingsResponse?.data) {
          const targets = settingsResponse.data.targets;
          if (targets) {
            if (targets.monthly !== undefined && targets.monthly !== null) {
              setMonthlyTarget(targets.monthly);
            }
            if (targets.savings !== undefined && targets.savings !== null) {
              setTotalSavingsTarget(targets.savings);
            }
          }
          setTargetsLoaded(true);
        }
      } catch (error) {
        console.error('Hedefler yüklenirken hata:', error);
        const savedMonthly = localStorage.getItem('monthlyTarget');
        const savedSavings = localStorage.getItem('totalSavingsTarget');
        if (savedMonthly) setMonthlyTarget(parseFloat(savedMonthly));
        if (savedSavings) setTotalSavingsTarget(parseFloat(savedSavings));
        setTargetsLoaded(true);
      }
    };

    void loadTargets();
  }, [currentUser, authLoading, authenticating, targetsLoaded]);

  const saveTargets = async (monthly: number | null, savings: number | null) => {
    if (!currentUser?.id) return;

    try {
      const settingsResponse = await settingsAPI.get();
      const currentSettings = settingsResponse?.success && settingsResponse?.data ? settingsResponse.data : {};

      const updatedSettings = {
        ...currentSettings,
        targets: {
          ...(currentSettings.targets || {}),
          ...(monthly !== null ? { monthly } : {}),
          ...(savings !== null ? { savings } : {})
        }
      };

      await settingsAPI.update(updatedSettings);
    } catch (error) {
      console.error('❌ Hedefler kaydedilirken hata:', error);
      if (monthly !== null) localStorage.setItem('monthlyTarget', monthly.toString());
      if (savings !== null) localStorage.setItem('totalSavingsTarget', savings.toString());
      throw error;
    }
  };

  const effectiveMonthlyTarget = useMemo(() => {
    if (monthlyTarget !== null) return monthlyTarget;
    if (lastMonthNet > 0) return lastMonthNet;
    return thisMonthIncome * 0.3;
  }, [monthlyTarget, lastMonthNet, thisMonthIncome]);

  const monthlyTargetProgress = useMemo(() => {
    if (effectiveMonthlyTarget === 0) return 0;
    return Math.min((netIncome / effectiveMonthlyTarget) * 100, 100);
  }, [netIncome, effectiveMonthlyTarget]);

  const remainingToTarget = useMemo(() => {
    return Math.max(0, effectiveMonthlyTarget - netIncome);
  }, [effectiveMonthlyTarget, netIncome]);

  const totalSavingsProgress = useMemo(() => {
    if (totalSavingsTarget === null || totalSavingsTarget === 0) return null;
    const currentSavings = totalNetWorth + totalInvestmentValue;
    return Math.min((currentSavings / totalSavingsTarget) * 100, 100);
  }, [totalSavingsTarget, totalNetWorth, totalInvestmentValue]);

  const remainingToTotalTarget = useMemo(() => {
    if (totalSavingsTarget === null) return null;
    const currentSavings = totalNetWorth + totalInvestmentValue;
    return Math.max(0, totalSavingsTarget - currentSavings);
  }, [totalSavingsTarget, totalNetWorth, totalInvestmentValue]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);
    setShowAddTransactionModal(false);
    void loadData();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'income':
        setDefaultTransactionType('income');
        setShowAddTransactionModal(true);
        break;
      case 'expense':
        setDefaultTransactionType('expense');
        setShowAddTransactionModal(true);
        break;
      case 'investment':
        setShowAddInvestmentModal(true);
        break;
      case 'reports':
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'reports' }));
        break;
    }
  };

  const handleInvestmentAdded = async (formData: {
    symbol: string;
    name: string;
    type: 'currency' | 'gold' | 'preciousMetal' | 'fund' | 'stock' | 'crypto';
    transactionType: 'buy' | 'sell';
    quantity: string;
    price: string;
    date: string;
  }) => {
    if (isAddingInvestment) return;

    setIsAddingInvestment(true);
    try {
      const quantity = parseFloat(formData.quantity);
      const price = parseFloat(formData.price);
      const totalAmount = quantity * price;

      let investmentType: 'stock' | 'crypto' | 'forex';
      if (formData.type === 'stock') {
        investmentType = 'stock';
      } else if (formData.type === 'crypto') {
        investmentType = 'crypto';
      } else {
        investmentType = 'forex';
      }

      const existingInvestment = financeInvestments.find(
        (inv) => inv.symbol === formData.symbol && inv.type === investmentType
      );

      let investmentId: string;

      if (existingInvestment) {
        investmentId = existingInvestment.id;
      } else {
        const newInvestment = {
          symbol: formData.symbol,
          name: formData.name,
          type: investmentType,
          quantity: formData.transactionType === 'buy' ? quantity : 0,
          averagePrice: price,
          currentPrice: price,
          totalValue: formData.transactionType === 'buy' ? totalAmount : 0,
          profitLoss: 0,
          profitLossPercentage: 0
        };

        const response = await investmentAPI.create(newInvestment);
        if (response.success && response.id) {
          investmentId = response.id;
        } else {
          throw new Error(t('toast.investmentCreateFailed'));
        }
      }

      const transaction = {
        type: formData.transactionType,
        quantity,
        price,
        totalAmount,
        date: formData.date
      };

      await addInvestmentTransaction(investmentId, transaction);
      await refreshInvestments();
      await loadData();

      setShowAddInvestmentModal(false);
    } catch (error: unknown) {
      console.error('Yatırım ekleme hatası:', error);
      const err = error as { message?: string; error?: string };
      const errorMessage = err?.message || err?.error || t('toast.unknownError');
      toast.error(t('toast.investmentError', { message: errorMessage }));
    } finally {
      setIsAddingInvestment(false);
    }
  };

  const stats: DashboardStatItem[] = [
    {
      title: t('stats.monthlyIncome'),
      value: `₺${thisMonthIncome.toLocaleString('tr-TR')}`,
      change: incomeChange,
      changeType: thisMonthIncome >= lastMonthIncome ? 'positive' : 'negative',
      icon: ArrowUpRight,
      color: 'from-emerald-500 via-green-500 to-teal-600',
      bgColor: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
      changePeriod: 'thisMonth'
    },
    {
      title: t('stats.monthlyExpense'),
      value: `₺${thisMonthExpense.toLocaleString('tr-TR')}`,
      change: expenseChange,
      changeType: thisMonthExpense <= lastMonthExpense ? 'positive' : 'negative',
      icon: ArrowDownRight,
      color: 'from-rose-500 via-red-500 to-pink-600',
      bgColor: 'from-rose-50 to-red-100 dark:from-rose-900/20 dark:to-red-900/20',
      changePeriod: 'thisMonth'
    },
    {
      title: t('stats.monthlyNet'),
      value: `₺${netIncome.toLocaleString('tr-TR')}`,
      change: netIncomeChange,
      changeType: netIncome >= lastMonthNet ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'from-blue-500 via-indigo-500 to-purple-600',
      bgColor: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
      changePeriod: 'thisMonth'
    },
    {
      title: t('stats.totalStatus'),
      value: `₺${totalNetWorth.toLocaleString('tr-TR')}`,
      change: netChangeText,
      changeType: netChangeAmount >= 0 ? 'positive' : 'negative',
      icon: Wallet,
      color: 'from-amber-500 via-yellow-500 to-orange-600',
      bgColor: 'from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20',
      changePeriod: 'vsLastMonth'
    },
    {
      title: t('stats.investmentPortfolio'),
      value: `₺${totalInvestmentValue.toLocaleString('tr-TR')}`,
      change: `+₺${totalInvestmentGain.toLocaleString('tr-TR')}`,
      changeType: totalInvestmentGain >= 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'from-violet-500 via-purple-500 to-indigo-600',
      bgColor: 'from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20',
      changePeriod: 'thisMonth'
    }
  ];

  const handleSaveTarget = async () => {
    const target = parseFloat(targetInputValue);
    if (isNaN(target) || target <= 0) {
      toast.error(t('toast.invalidAmount'));
      return;
    }
    try {
      if (targetModalType === 'monthly') {
        setMonthlyTarget(target);
        await saveTargets(target, totalSavingsTarget);
        toast.success(t('toast.monthlyTargetSaved'));
      } else {
        setTotalSavingsTarget(target);
        await saveTargets(monthlyTarget, target);
        toast.success(t('toast.savingsTargetSaved'));
      }
      setShowTargetModal(false);
    } catch {
      toast.error(t('toast.targetSaveError'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-8 space-y-8">
        <DashboardHeader totalNetWorth={totalNetWorth} totalInvestmentValue={totalInvestmentValue} />

        <DashboardStatsGrid stats={stats} />

        <DashboardPerformanceSection
          effectiveMonthlyTarget={effectiveMonthlyTarget}
          netIncome={netIncome}
          remainingToTarget={remainingToTarget}
          monthlyTargetProgress={monthlyTargetProgress}
          onEditMonthlyTarget={() => {
            setTargetModalType('monthly');
            setTargetInputValue(effectiveMonthlyTarget.toString());
            setShowTargetModal(true);
          }}
          savingsRate={savingsRate}
          thisMonthIncome={thisMonthIncome}
          savingsRateChange={savingsRateChange}
          investmentROI={investmentROI}
          totalInvestmentValue={totalInvestmentValue}
          totalInvestmentGain={totalInvestmentGain}
          totalSavingsTarget={totalSavingsTarget}
          totalNetWorth={totalNetWorth}
          totalSavingsProgress={totalSavingsProgress}
          remainingToTotalTarget={remainingToTotalTarget}
          onEditSavingsTarget={() => {
            setTargetModalType('savings');
            setTargetInputValue((totalSavingsTarget ?? 0).toString());
            setShowTargetModal(true);
          }}
          onAddSavingsTarget={() => {
            setTargetModalType('savings');
            setTargetInputValue('');
            setShowTargetModal(true);
          }}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <DashboardRecentTransactions
            loading={loading}
            recentTransactions={recentTransactions}
            convertToTRY={convertToTRY}
          />
          <DashboardInvestmentOverview loading={loading} activeInvestments={activeInvestments} />
        </div>

        <DashboardQuickActions onAction={handleQuickAction} />
      </div>

      <AddTransactionModal
        isOpen={showAddTransactionModal}
        onClose={() => setShowAddTransactionModal(false)}
        onTransactionAdded={handleTransactionAdded}
        categories={TRANSACTION_CATEGORIES}
        defaultType={defaultTransactionType}
      />

      <AddInvestmentModal
        isOpen={showAddInvestmentModal}
        onClose={() => setShowAddInvestmentModal(false)}
        onSubmit={handleInvestmentAdded}
        allCurrencies={allCurrencies}
        allFunds={allFunds}
        allStocks={borsaData || []}
      />

      <DashboardTargetModal
        isOpen={showTargetModal}
        targetModalType={targetModalType}
        targetInputValue={targetInputValue}
        onChangeTargetInput={setTargetInputValue}
        onClose={() => setShowTargetModal(false)}
        onSave={handleSaveTarget}
      />
    </div>
  );
};

export default Dashboard;
