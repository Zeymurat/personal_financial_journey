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
  Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation('sidebar');
  const { currentUser: user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Custom event listener for navigation
  React.useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      const tab = event.detail;
      if (tab && typeof tab === 'string') {
        setActiveTab(tab);
      }
    };

    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener);
    
    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener);
    };
  }, [setActiveTab]);

  const menuItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard' as const, icon: Home },
    { id: 'transactions', labelKey: 'nav.transactions' as const, icon: ArrowUpDown },
    { id: 'investments', labelKey: 'nav.investments' as const, icon: TrendingUp },
    { id: 'track', labelKey: 'nav.track' as const, icon: Eye },
    { id: 'reports', labelKey: 'nav.reports' as const, icon: BarChart3 },
    { id: 'converter', labelKey: 'nav.converter' as const, icon: Repeat },
    { id: 'calculator', labelKey: 'nav.calculator' as const, icon: Calculator },
    { id: 'notifications', labelKey: 'nav.notifications' as const, icon: Bell },
    { id: 'agenda', labelKey: 'nav.agenda' as const, icon: Calendar },
    { id: 'settings', labelKey: 'nav.settings' as const, icon: Settings }
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('brand.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('brand.subtitle')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{t(item.labelKey)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || t('userFallback')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;