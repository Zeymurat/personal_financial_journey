import type { LucideIcon } from 'lucide-react';

export type DashboardStatItem = {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  color: string;
  bgColor: string;
  /** Subtitle under change badge: vs last month or this month */
  changePeriod: 'vsLastMonth' | 'thisMonth';
};
