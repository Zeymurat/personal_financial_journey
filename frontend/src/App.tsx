// src/App.tsx
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AuthWrapper from './components/Auth/AuthWrapper';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { NotificationProvider } from './contexts/NotificationContext';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Transactions = lazy(() => import('./components/Transactions/Transactions'));
const Investments = lazy(() => import('./components/Investments/Investments'));
const TrackAndCompare = lazy(() => import('./components/TrackAndCompare/TrackAndCompare'));
const Reports = lazy(() => import('./components/Reports/Reports'));
const CurrencyConverter = lazy(() => import('./components/Converter/CurrencyConverter'));
const Settings = lazy(() => import('./components/Settings'));
const Notifications = lazy(() => import('./components/Notifications'));
const Agenda = lazy(() => import('./components/Agenda/Agenda'));
const Calculator = lazy(() => import('./components/Calculator/Calculator'));
// Assistant prod’da kapalı — lazy import yok (bundle’a girmesin)

const TabFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[40vh] text-sm text-slate-500">
    Yükleniyor…
  </div>
);

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'investments':
        return <Investments />;
      case 'track':
        return <TrackAndCompare />;
      case 'reports':
        return <Reports />;
      case 'converter':
        return <CurrencyConverter />;
      case 'calculator':
        return <Calculator />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
      case 'agenda':
        return <Agenda />;
      case 'assistant':
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background min-w-0">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 min-w-0 overflow-auto bg-transparent">
        <Suspense fallback={<TabFallback />}>{renderContent()}</Suspense>
      </main>
    </div>
  );
};

function App() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      console.error('[unhandledrejection]', event.reason);
      const msg =
        event.reason?.message ||
        (typeof event.reason === 'string' ? event.reason : null) ||
        'Beklenmeyen bir ağ/işlem hatası';
      toast.error(String(msg).slice(0, 200));
    };
    const onError = (event: ErrorEvent) => {
      console.error('[window.error]', event.error || event.message);
    };
    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FinanceProvider>
          <NotificationProvider>
            <AuthWrapper>
              <MainApp />
            </AuthWrapper>
            <Toaster
              position="top-center"
              containerClassName="toast-container"
              toastOptions={{
                duration: 4000,
                className: 'toast-notification',
                style: {
                  background: 'transparent',
                  boxShadow: 'none',
                },
                success: {
                  duration: 3000,
                  className: 'toast-success',
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  className: 'toast-error',
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#ef4444',
                  },
                },
              }}
            />
          </NotificationProvider>
        </FinanceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
