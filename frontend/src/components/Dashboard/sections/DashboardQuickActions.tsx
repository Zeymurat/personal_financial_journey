import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart } from 'lucide-react';

interface DashboardQuickActionsProps {
  onAction: (action: 'income' | 'expense' | 'investment' | 'reports') => void;
}

const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ onAction }) => {
  const { t } = useTranslation('dashboard');

  const ACTIONS = useMemo(
    () =>
      [
        {
          title: t('quickActions.addIncome'),
          icon: ArrowUpRight,
          color: 'from-emerald-500 to-green-600',
          bgColor: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
          action: 'income' as const
        },
        {
          title: t('quickActions.addExpense'),
          icon: ArrowDownRight,
          color: 'from-rose-500 to-red-600',
          bgColor: 'hover:bg-rose-50 dark:hover:bg-rose-900/20',
          action: 'expense' as const
        },
        {
          title: t('quickActions.addInvestment'),
          icon: TrendingUp,
          color: 'from-blue-500 to-cyan-600',
          bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
          action: 'investment' as const
        },
        {
          title: t('quickActions.viewReports'),
          icon: PieChart,
          color: 'from-violet-500 to-purple-600',
          bgColor: 'hover:bg-violet-50 dark:hover:bg-violet-900/20',
          action: 'reports' as const
        }
      ],
    [t]
  );

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
      <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">{t('quickActions.title')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onAction(action.action)}
              className={`flex flex-col items-center p-8 bg-slate-50 dark:bg-slate-700/50 rounded-2xl ${action.bgColor} transition-all duration-300 hover:scale-105 group border border-slate-200/50 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500`}
            >
              <div
                className={`p-5 rounded-2xl bg-gradient-to-r ${action.color} mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{action.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
