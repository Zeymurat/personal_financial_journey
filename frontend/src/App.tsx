// src/App.tsx
import React, { useState } from 'react';
import AuthWrapper from './components/Auth/AuthWrapper';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Investments from './components/Investments';
import Reports from './components/Reports';
import CurrencyConverter from './components/CurrencyConverter';
import Settings from './components/Settings';
import { AuthProvider } from './contexts/AuthContext'; // <-- AuthProvider'ı import edin!

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
      case 'reports':
        return <Reports />;
      case 'converter':
        return <CurrencyConverter />;
      case 'settings':
        return <Settings />;
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
    // AuthWrapper ve MainApp onun içinde olmalı
    <AuthProvider> {/* <-- Buraya AuthProvider'ı ekledik! */}
      <AuthWrapper>
        {/* AuthWrapper, kullanıcının oturum açıp açmadığına göre içeriği render eder */}
        <MainApp />
      </AuthWrapper>
    </AuthProvider>
  );
}

export default App;