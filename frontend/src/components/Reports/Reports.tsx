import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTokenValidation } from '../../hooks/useTokenValidation';
import { useReportsData } from './hooks/useReportsData';
import { useReportsMetrics } from './hooks/useReportsMetrics';
import ReportsHeader from './sections/ReportsHeader';
import ReportsCurrentMonthSummary from './sections/ReportsCurrentMonthSummary';
import ReportsMonthlyTrends from './sections/ReportsMonthlyTrends';
import ReportsDetailedTable from './sections/ReportsDetailedTable';

const Reports: React.FC = () => {
  const { t } = useTranslation('reports');
  const { currentUser } = useAuth();

  useTokenValidation();

  const { transactions, investments, investmentTransactions, loading } = useReportsData(currentUser?.id);

  const metrics = useReportsMetrics(transactions, investments, investmentTransactions);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ReportsHeader />
      <ReportsCurrentMonthSummary
        formatMonthYear={metrics.formatMonthYear}
        currentDate={metrics.currentDate}
        trendColor={metrics.trendColor}
        generalTrend={metrics.generalTrend}
        currentMonthIncome={metrics.currentMonthIncome}
        incomeChange={metrics.incomeChange}
        currentMonthExpenses={metrics.currentMonthExpenses}
        expenseChange={metrics.expenseChange}
        currentMonthNetIncome={metrics.currentMonthNetIncome}
        netIncomeChange={metrics.netIncomeChange}
        investmentData={metrics.investmentData}
      />
      <ReportsMonthlyTrends
        monthlyIncomeExpenseData={metrics.monthlyIncomeExpenseData}
        monthlyInvestmentData={metrics.monthlyInvestmentData}
      />
      <ReportsDetailedTable monthlyDetailedReportData={metrics.monthlyDetailedReportData} />
    </div>
  );
};

export default Reports;
