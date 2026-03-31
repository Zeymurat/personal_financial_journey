import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DashboardStatItem } from '../types';

interface DashboardStatsGridProps {
  stats: DashboardStatItem[];
}

const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => {
  const { t } = useTranslation('dashboard');
  return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
    {stats.map((stat, index) => {
      const Icon = stat.icon;
      return (
        <div
          key={index}
          className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-3xl pl-8 pr-8 py-6 border border-white/20 dark:border-slate-700/30 shadow-xl hover:shadow-2xl transition-all duration-300`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                {stat.title}
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 leading-tight break-words">
                {stat.value}
              </p>
              <div className="flex items-center justify-between mt-4 gap-4 w-full">
                <span
                  className={`text-sm font-bold px-4 py-1.5 rounded-full flex-shrink-0 ${
                    stat.changeType === 'positive'
                      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30'
                      : 'text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-900/30'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap flex-shrink-0">
                  {stat.changePeriod === 'vsLastMonth' ? t('stats.vsLastMonth') : t('stats.thisMonth')}
                </span>
              </div>
            </div>
            <div className={`p-2 bg-gradient-to-r ${stat.color} rounded-xl shadow-lg flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      );
    })}
  </div>
  );
};

export default DashboardStatsGrid;
