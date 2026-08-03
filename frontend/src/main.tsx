import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App.tsx';
import './index.css';

// Uygulama başlangıcında dark mode'u kontrol et ve uygula
// Önce localStorage'dan kontrol et (fallback), sonra API'den yüklenecek
const savedDarkMode = localStorage.getItem('darkMode');
const isDarkMode = savedDarkMode !== null ? JSON.parse(savedDarkMode) : false;

const root = document.documentElement;
if (isDarkMode) {
  root.classList.add('dark');
} else {
  root.classList.remove('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
