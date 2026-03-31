import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import { Moon, Sun, Bell, Shield, Palette, Globe, Save } from 'lucide-react';
import { settingsAPI } from '../services/apiService';
import { UserSettings } from '../types';
import i18n from '../i18n';
import { APP_LANGUAGE_CODES, isAppLanguageCode } from '../locales/languages';
import ChangePasswordModal from './ChangePasswordModal';

const Settings: React.FC = () => {
  const { currentUser, hasPasswordProvider } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { t } = useTranslation('settings');
  const { t: tc } = useTranslation('common');

  // Token doğrulama - Geçersiz token durumunda login sayfasına yönlendirir
  useTokenValidation();
  
  // Settings state'leri
  const [darkMode, setDarkMode] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [language, setLanguage] = useState('tr');
  const [currency, setCurrency] = useState('TRY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Firestore'dan ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.id) return;

      try {
        setLoading(true);
        const response = await settingsAPI.get();
        
        if (response?.success && response?.data) {
          const settings = response.data;
          setDarkMode(settings.darkMode ?? false);
          setBudgetAlerts(settings.budgetAlerts ?? true);
          const nextLang = settings.language || 'tr';
          const safeLang = isAppLanguageCode(nextLang) ? nextLang : 'tr';
          setLanguage(safeLang);
          void i18n.changeLanguage(safeLang);
          setCurrency(settings.currency || 'TRY');
          
          // Dark mode'u HTML'e uygula
          const root = document.documentElement;
          if (settings.darkMode) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        // Hata durumunda varsayılan değerleri kullan
        const isDark = document.documentElement.classList.contains('dark');
        setDarkMode(isDark);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadSettings();
  }, [currentUser?.id]);

  // Dark mode değiştiğinde HTML root element'ine 'dark' class'ını ekle/çıkar
  useEffect(() => {
    if (isInitialLoad) return; // İlk yüklemede API'den gelen değeri kullan
    
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Debounce ile API'ye kaydet (500ms bekle)
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [darkMode]);

  // Diğer ayarlar değiştiğinde API'ye kaydet (debounced)
  useEffect(() => {
    if (isInitialLoad) return;
    
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [budgetAlerts, language, currency]);

  // Ayarları Firestore'a kaydet
  const saveSettings = async () => {
    if (!currentUser?.id || isInitialLoad) return;

    try {
      const settingsData: UserSettings = {
        darkMode,
        budgetAlerts,
        language,
        currency
      };
      
      await settingsAPI.update(settingsData);
      console.log('✅ Ayarlar kaydedildi:', settingsData);
      // Otomatik kaydetme için toast gösterme (kullanıcıyı rahatsız etmemek için)
    } catch (error) {
      console.error('❌ Ayarlar kaydedilirken hata:', error);
      toast.error(i18n.t('toast.settingsAutoSaveError', { ns: 'common' }));
    }
  };

  // Manuel kaydet butonu
  const handleSave = async () => {
    if (!currentUser?.id) return;

    try {
      setSaving(true);
      const settingsData: UserSettings = {
        darkMode,
        budgetAlerts,
        language,
        currency
      };
      
      await settingsAPI.update(settingsData);
      toast.success(tc('toast.settingsSaved'));
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error(tc('toast.settingsSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('meta.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('meta.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? tc('actions.saving') : tc('actions.save')}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('appearance.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('appearance.description')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <label className="font-medium text-gray-900 dark:text-white">{t('appearance.darkMode')}</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('appearance.darkModeHint')}</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('notifications.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.description')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/*
              Push bildirimleri — mobil/web push için şimdilik kapalı.
              Tekrar açılırsa: UserSettings.notifications + state + kayıt burada kullanılabilir.
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">Push Bildirimleri</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Önemli güncellemeler için bildirim al</p>
              </div>
              <button type="button" ... />
            </div>
            */}

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900 dark:text-white">{t('notifications.budgetAlerts')}</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.budgetAlertsHint')}</p>
              </div>
              <button
                type="button"
                onClick={() => setBudgetAlerts(!budgetAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  budgetAlerts ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    budgetAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('language.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('language.description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="w-full flex items-center justify-between gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('language.label')}
              </label>
              <select
                value={language}
                onChange={(e) => {
                  const code = e.target.value;
                  setLanguage(code);
                  void i18n.changeLanguage(code);
                }}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {APP_LANGUAGE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {tc(`languages.${code}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ana Para Birimi
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="TRY">₺ Türk Lirası</option>
                <option value="USD">$ Amerikan Doları</option>
                <option value="EUR">€ Euro</option>
                <option value="GBP">£ İngiliz Sterlini</option>
              </select>
            </div> */}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('security.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('security.description')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {hasPasswordProvider ? (
              <button
                type="button"
                onClick={() => setChangePasswordOpen(true)}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('security.changePassword')}
              </button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                {t('security.passwordChange.oauthHint')}
              </p>
            )}
            {/* <button type="button" className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-0 md:ml-3">
              {t('security.twoFactor')}
            </button> */}
          </div>
        </div>

        <ChangePasswordModal isOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />

        {/* Profile Settings */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('profile.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.fullName')}
              </label>
              <input
                type="text"
                defaultValue="Ahmet Yılmaz"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile.email')}
              </label>
              <input
                type="email"
                defaultValue="ahmet@example.com"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div> */}

        {/* Data & Privacy */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('data.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('data.description')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <button type="button" className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {t('data.export')}
            </button>
            <button type="button" className="w-full md:w-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors ml-0 md:ml-3">
              {t('data.backup')}
            </button>
            <button type="button" className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-0 md:ml-3">
              {t('data.deleteAccount')}
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Settings;