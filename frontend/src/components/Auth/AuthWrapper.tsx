import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../../context/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      await login(email, password);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      await signup(email, password);
      // Note: The name update should be handled by the AuthProvider
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading spinner while checking auth status
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Show auth screens if not authenticated
  if (!currentUser) {
    return (
      <>
        {currentView === 'login' ? (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
            loading={authLoading}
          />
        ) : (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
            loading={authLoading}
          />
        )}
      </>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

// Use the main AuthContext from context/AuthContext

export default AuthWrapper;