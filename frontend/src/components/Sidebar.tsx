import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  ArrowUpDown,
  TrendingUp,
  BarChart3,
  Repeat,
  Settings,
  Wallet,
  LogOut,
  User,
  Eye,
  Bell,
  Calendar,
  Calculator,
  Bot,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

type MenuItem = {
  id: string;
  labelKey:
    | 'nav.dashboard'
    | 'nav.transactions'
    | 'nav.investments'
    | 'nav.track'
    | 'nav.reports'
    | 'nav.converter'
    | 'nav.calculator'
    | 'nav.assistant'
    | 'nav.notifications'
    | 'nav.agenda'
    | 'nav.settings';
  icon: React.ComponentType<{ className?: string }>;
  /** true → tıklanınca sayfa açılmaz (yakında) */
  disabled?: boolean;
  beta?: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation('sidebar');
  const { currentUser: user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: Home },
    { id: 'transactions', labelKey: 'nav.transactions', icon: ArrowUpDown },
    { id: 'investments', labelKey: 'nav.investments', icon: TrendingUp },
    { id: 'track', labelKey: 'nav.track', icon: Eye },
    { id: 'reports', labelKey: 'nav.reports', icon: BarChart3 },
    { id: 'converter', labelKey: 'nav.converter', icon: Repeat },
    { id: 'calculator', labelKey: 'nav.calculator', icon: Calculator },
    { id: 'notifications', labelKey: 'nav.notifications', icon: Bell },
    { id: 'agenda', labelKey: 'nav.agenda', icon: Calendar },
    { id: 'settings', labelKey: 'nav.settings', icon: Settings },
    // En altta — AI henüz prod’da açık değil
    {
      id: 'assistant',
      labelKey: 'nav.assistant',
      icon: Bot,
      disabled: true,
      beta: true,
    },
  ];

  React.useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      const tab = event.detail;
      if (tab === 'assistant') return;
      if (tab && typeof tab === 'string') {
        setActiveTab(tab);
      }
    };

    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);

    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
    };
  }, [setActiveTab]);

  return (
    <div className="w-64 min-w-64 max-w-64 shrink-0 flex flex-col border-r border-white/8 bg-[linear-gradient(165deg,hsl(213_55%_11%)_0%,hsl(213_58%_7%)_55%,hsl(213_60%_5%)_100%)] text-sidebar-foreground shadow-elite">
      <div className="p-6 border-b border-white/8 relative">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground ring-1 ring-gold/40 shadow-gold">
            <Wallet className="h-5 w-5 shrink-0" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-sidebar-foreground">
              {t('brand.title')}
            </h1>
            <p className="text-[11px] uppercase tracking-[0.14em] text-gold/90 font-medium">
              {t('brand.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = !item.disabled && activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={item.disabled}
                  title={item.disabled ? t('nav.assistantComingSoon') : undefined}
                  onClick={() => {
                    if (item.disabled) return;
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    item.disabled
                      ? 'text-sidebar-muted/55 cursor-not-allowed opacity-80'
                      : isActive
                        ? 'bg-primary text-primary-foreground shadow-elite font-semibold ring-1 ring-gold/35'
                        : 'text-sidebar-muted hover:bg-white/6 hover:text-sidebar-foreground'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-gold-soft' : ''}`} />
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg border-2 border-[hsl(213_55%_9%)]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-sm flex-1 text-left">
                    {t(item.labelKey)}
                  </span>
                  {item.beta && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gold/20 text-gold-soft ring-1 ring-gold/35">
                      {t('nav.beta')}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/8 relative">
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 mb-3 ring-1 ring-white/5 min-w-0">
          <div className="flex h-10 w-10 min-w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/20 text-sm font-semibold text-gold-soft ring-1 ring-gold/35">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-10 w-10 max-w-none shrink-0 aspect-square rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 shrink-0" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {user?.name || t('userFallback')}
            </p>
            <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl border border-white/10 text-sidebar-foreground hover:bg-white/8 hover:border-gold/25 transition-all duration-200 font-medium text-sm"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
