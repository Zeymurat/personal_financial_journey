import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../../types';
import { transactionAPI } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useFinance } from '../../contexts/FinanceContext';
import AddTransactionModal from './modals/AddTransactionModal';
import EditTransactionModal from './modals/EditTransactionModal';
import TransactionDetailModal from './modals/TransactionDetailModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import QuickActions from './cards/QuickActions';
import InvestmentSuggestionModal from './modals/InvestmentSuggestionModal';
import TransactionsHeader from './cards/TransactionsHeader';
import TransactionSummaryCards from './cards/TransactionSummaryCards';
import TransactionsListCard, { type DateFilterType } from './cards/TransactionsListCard';
import { INVESTMENT_CATEGORY_VALUE, TRANSACTION_CATEGORIES } from './constants';

const Transactions: React.FC = () => {
  const { t } = useTranslation('transactions');
  const { currentUser } = useAuth();

  useTokenValidation();

  const { exchangeRates: contextExchangeRates } = useFinance();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, { rate: number }>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [showInvestmentSuggestion, setShowInvestmentSuggestion] = useState(false);

  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');

  const [sortField, setSortField] = useState<'date' | 'amount' | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);

  const allCategories = React.useMemo(() => {
    const categorySet = new Set<string>();

    Object.values(TRANSACTION_CATEGORIES)
      .flat()
      .forEach((cat) => {
        categorySet.add(cat);
      });

    transactions.forEach((transaction) => {
      if (transaction.category) {
        categorySet.add(transaction.category);
      }
    });

    return Array.from(categorySet).sort();
  }, [transactions]);

  const filteredTransactions = (Array.isArray(transactions) ? transactions : []).filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);
      const now = new Date();

      switch (dateFilter) {
        case 'today': {
          const today = new Date(now);
          today.setHours(0, 0, 0, 0);
          matchesDate = transactionDate.getTime() === today.getTime();
          break;
        }
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          weekAgo.setHours(0, 0, 0, 0);
          matchesDate = transactionDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          monthEnd.setHours(23, 59, 59, 999);
          matchesDate = transactionDate >= monthStart && transactionDate <= monthEnd;
          break;
        }
        case 'last30days': {
          const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          last30Days.setHours(0, 0, 0, 0);
          matchesDate = transactionDate >= last30Days;
          break;
        }
        case 'custom':
          if (customDateStart && customDateEnd) {
            const startDate = new Date(customDateStart);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(customDateEnd);
            endDate.setHours(23, 59, 59, 999);
            matchesDate = transactionDate >= startDate && transactionDate <= endDate;
          } else {
            matchesDate = true;
          }
          break;
      }
    }

    return matchesSearch && matchesFilter && matchesCategory && matchesDate;
  });

  const convertToTRY = React.useCallback(
    (transaction: Transaction): number => {
      if (transaction.amountInTRY !== undefined && transaction.amountInTRY !== null) {
        return transaction.amountInTRY;
      }

      const currency = transaction.currency || 'TRY';
      if (currency === 'TRY') return transaction.amount;

      const rate = exchangeRates[currency]?.rate;
      if (!rate || rate === 0) {
        console.warn(`Döviz kuru bulunamadı: ${currency}, varsayılan değer kullanılıyor`);
        return transaction.amount;
      }
      return transaction.amount * rate;
    },
    [exchangeRates]
  );

  const sortedTransactions = React.useMemo(() => {
    if (!sortField) {
      return [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
    }

    const sorted = [...filteredTransactions].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        comparison = dateA - dateB;
      } else if (sortField === 'amount') {
        const amountA = convertToTRY(a);
        const amountB = convertToTRY(b);
        comparison = amountA - amountB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredTransactions, sortField, sortDirection, convertToTRY]);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedTransactions.slice(startIndex, endIndex);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, dateFilter, categoryFilter]);

  React.useEffect(() => {
    if (currentPage > 1) {
      const tableElement = document.querySelector('[data-table-container]');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [currentPage]);

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

  useEffect(() => {
    if (currentUser) {
      loadTransactions();
    }
  }, [currentUser]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getAll();

      if (response && response.success && Array.isArray(response.data)) {
        const transactionsMapped = response.data.map((item: any) => {
          let date = item.date;
          let createdAt = item.createdAt;
          let updatedAt = item.updatedAt;

          if (date && typeof date === 'object' && date.toDate) {
            date = date.toDate().toISOString().split('T')[0];
          } else if (date && typeof date === 'string') {
            // ok
          } else {
            date = new Date().toISOString().split('T')[0];
          }

          if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
            createdAt = createdAt.toDate();
          } else if (createdAt && typeof createdAt === 'string') {
            createdAt = new Date(createdAt);
          } else {
            createdAt = new Date();
          }

          if (updatedAt && typeof updatedAt === 'object' && updatedAt.toDate) {
            updatedAt = updatedAt.toDate();
          } else if (updatedAt && typeof updatedAt === 'string') {
            updatedAt = new Date(updatedAt);
          } else {
            updatedAt = new Date();
          }

          return {
            id: item.id || item._id,
            type: item.type || 'expense',
            amount: item.amount || 0,
            category: item.category || '',
            description: item.description || '',
            date,
            currency: item.currency || 'TRY',
            amountInTRY: item.amountInTRY,
            createdAt,
            updatedAt
          } as Transaction;
        });

        setTransactions(transactionsMapped);
      } else if (Array.isArray(response)) {
        setTransactions(response);
      } else {
        console.error('Beklenmeyen response formatı:', response);
        setTransactions([]);
      }
    } catch (error) {
      console.error('İşlemler yüklenirken hata:', error);
      toast.error(t('toast.loadError'));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await transactionAPI.delete(transactionToDelete.id);
      setTransactions(transactions.filter((t) => t.id !== transactionToDelete.id));
      if (selectedTransaction?.id === transactionToDelete.id) {
        setSelectedTransaction(null);
      }
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      toast.success(t('toast.deleteSuccess'));
    } catch (error) {
      console.error('İşlem silinirken hata:', error);
      toast.error(t('toast.deleteError'));
    }
  };

  const handleTransactionAdded = (newTransaction: Transaction) => {
    setTransactions([newTransaction, ...transactions]);

    if (newTransaction.category === INVESTMENT_CATEGORY_VALUE) {
      setShowInvestmentSuggestion(true);
    }
  };

  const handleNavigateToInvestments = () => {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'investments' }));
  };

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransactions(transactions.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)));
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  thisMonthEnd.setHours(23, 59, 59, 999);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  lastMonthStart.setHours(0, 0, 0, 0);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  lastMonthEnd.setHours(23, 59, 59, 999);

  const isDateInRange = (dateString: string, startDate: Date, endDate: Date): boolean => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date >= startDate && date <= endDate;
  };

  const thisMonthIncome = transactions
    .filter((t) => t.type === 'income' && isDateInRange(t.date, thisMonthStart, thisMonthEnd))
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const thisMonthExpense = transactions
    .filter((t) => t.type === 'expense' && isDateInRange(t.date, thisMonthStart, thisMonthEnd))
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const thisMonthNet = thisMonthIncome - thisMonthExpense;

  const thisMonthTransactions = transactions.filter((t) => isDateInRange(t.date, thisMonthStart, thisMonthEnd));

  const totalIncome = thisMonthIncome;
  const totalExpense = thisMonthExpense;

  const totalNetWorth =
    transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + convertToTRY(t), 0) -
    transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + convertToTRY(t), 0);

  const lastMonthIncome = transactions
    .filter((t) => t.type === 'income' && isDateInRange(t.date, lastMonthStart, lastMonthEnd))
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const lastMonthExpense = transactions
    .filter((t) => t.type === 'expense' && isDateInRange(t.date, lastMonthStart, lastMonthEnd))
    .reduce((sum, t) => sum + convertToTRY(t), 0);

  const lastMonthNet = lastMonthIncome - lastMonthExpense;

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomePercentageChange = calculatePercentageChange(thisMonthIncome, lastMonthIncome);
  const expensePercentageChange = calculatePercentageChange(thisMonthExpense, lastMonthExpense);
  const netPercentageChange = calculatePercentageChange(thisMonthNet, lastMonthNet);

  const netChangeAmount = thisMonthNet - lastMonthNet;

  useEffect(() => {
    console.log('📊 Net Durum Karşılaştırması:');
    console.log('  Geçen ay (lastMonthNet):', lastMonthNet.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }));
    console.log('  Bu ay (thisMonthNet):', thisMonthNet.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }));
    console.log('  Değişim (netChangeAmount):', netChangeAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="p-8 space-y-8">
        <TransactionsHeader onAddClick={() => setShowAddModal(true)} />

        <TransactionSummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          thisMonthNet={thisMonthNet}
          thisMonthTransactionCount={thisMonthTransactions.length}
          totalNetWorth={totalNetWorth}
          incomePercentageChange={incomePercentageChange}
          expensePercentageChange={expensePercentageChange}
          netPercentageChange={netPercentageChange}
          netChangeAmount={netChangeAmount}
        />

        <QuickActions onTransactionAdded={handleTransactionAdded} categories={TRANSACTION_CATEGORIES} />

        <TransactionsListCard
          loading={loading}
          sortedTransactions={sortedTransactions}
          paginatedTransactions={paginatedTransactions}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          customDateStart={customDateStart}
          onCustomDateStartChange={setCustomDateStart}
          customDateEnd={customDateEnd}
          onCustomDateEndChange={setCustomDateEnd}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          allCategories={allCategories}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalPages={totalPages}
          onShowAddModal={() => setShowAddModal(true)}
          onView={setSelectedTransaction}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        <AddTransactionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTransactionAdded={handleTransactionAdded}
          categories={TRANSACTION_CATEGORIES}
        />
        <EditTransactionModal
          isOpen={showEditModal}
          transaction={editingTransaction}
          categories={TRANSACTION_CATEGORIES}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onTransactionUpdated={handleTransactionUpdated}
        />
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          transaction={transactionToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setTransactionToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
        <InvestmentSuggestionModal
          isOpen={showInvestmentSuggestion}
          onClose={() => setShowInvestmentSuggestion(false)}
          onNavigateToInvestments={handleNavigateToInvestments}
        />
      </div>
    </div>
  );
};

export default Transactions;
