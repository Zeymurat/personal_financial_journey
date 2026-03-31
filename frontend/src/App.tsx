// src/App.tsx
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AuthWrapper from './components/Auth/AuthWrapper';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import Transactions from './components/Transactions/Transactions';
import Investments from './components/Investments/Investments';
import TrackAndCompare from './components/TrackAndCompare/TrackAndCompare';
import Reports from './components/Reports/Reports';
import CurrencyConverter from './components/Converter/CurrencyConverter';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import Agenda from './components/Agenda/Agenda';
import Calculator from './components/Calculator/Calculator';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { NotificationProvider } from './contexts/NotificationContext';

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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    // AuthProvider, tüm kimlik doğrulama bağlamını sağlar
    // FinanceProvider, tüm finansal veri bağlamını sağlar
    // AuthWrapper ve MainApp onun içinde olmalı
    <AuthProvider>
      <FinanceProvider>
        <NotificationProvider>
          <AuthWrapper>
            {/* AuthWrapper, kullanıcının oturum açıp açmadığına göre içeriği render eder */}
            <MainApp />
          </AuthWrapper>
        </NotificationProvider>
        {/* Toast notifications */}
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
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;