import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTokenValidation } from '../hooks/useTokenValidation';
import { notificationsAPI } from '../services/apiService';
import { coerceFlexibleDate } from '../utils/firestoreUtils';
import { Notification } from '../types';
import { 
  Bell, 
  Target, 
  TrendingUp, 
  ArrowUpDown, 
  Clock,
  Check,
  CheckCheck,
  Trash2,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const { t, i18n } = useTranslation('notifications');
  const { currentUser } = useAuth();
  const { notifications: contextNotifications, unreadCount: contextUnreadCount, refreshNotifications } = useNotifications();
  useTokenValidation();

  const locale = useMemo(() => {
    const map: Record<string, string> = { tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
    return map[i18n.language?.split('-')[0] || 'tr'] || 'tr-TR';
  }, [i18n.language]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | Notification['category']>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Context'ten gelen bildirimleri kullan
  useEffect(() => {
    if (contextNotifications.length > 0) {
      setNotifications(contextNotifications);
      setLoading(false);
    } else {
      // İlk yüklemede API'den yükle
      loadNotifications();
    }
  }, [contextNotifications]);

  const loadNotifications = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      
      if (response?.success && Array.isArray(response.data)) {
        const notificationsData = response.data.map((item: any) => {
          let createdAt = item.createdAt;
          if (createdAt && typeof createdAt === 'object' && createdAt.toDate) {
            createdAt = createdAt.toDate().toISOString();
          } else if (!createdAt || typeof createdAt !== 'string') {
            createdAt = new Date().toISOString();
          }

          return {
            id: item.id || item._id,
            category: item.category || 'reminder',
            title: item.title || '',
            message: item.message || '',
            read: item.read || false,
            createdAt,
            metadata: item.metadata || {}
          };
        });

        // Tarihe göre sırala (en yeni önce)
        notificationsData.sort((a: Notification, b: Notification) =>
          coerceFlexibleDate(b.createdAt).getTime() -
          coerceFlexibleDate(a.createdAt).getTime()
        );

        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
      toast.error(t('toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      refreshNotifications(); // Context'i güncelle
      toast.success(t('toast.markReadSuccess'));
    } catch (error) {
      console.error('Bildirim işaretlenirken hata:', error);
      toast.error(t('toast.genericError'));
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      refreshNotifications(); // Context'i güncelle
      toast.success(t('toast.markAllSuccess'));
    } catch (error) {
      console.error('Bildirimler işaretlenirken hata:', error);
      toast.error(t('toast.genericError'));
    }
  };

  // Bildirimi sil
  const handleDelete = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      refreshNotifications(); // Context'i güncelle
      toast.success(t('toast.deleteSuccess'));
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
      toast.error(t('toast.genericError'));
    }
  };

  // Okunmuş bildirimleri sil
  const handleDeleteAllRead = async () => {
    try {
      await notificationsAPI.deleteAllRead();
      setNotifications(prev => prev.filter(notif => !notif.read));
      refreshNotifications(); // Context'i güncelle
      toast.success(t('toast.deleteReadSuccess'));
    } catch (error) {
      console.error('Bildirimler silinirken hata:', error);
      toast.error(t('toast.genericError'));
    }
  };

  // Kategori ikonları
  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'target':
        return <Target className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'transaction':
        return <ArrowUpDown className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  // Kategori renkleri
  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'target':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
      case 'investment':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400';
      case 'transaction':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
      case 'reminder':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  // Kategori isimleri
  const getCategoryName = useCallback(
    (category: Notification['category']) => {
      switch (category) {
        case 'target':
          return t('category.target');
        case 'investment':
          return t('category.investment');
        case 'transaction':
          return t('category.transaction');
        case 'reminder':
          return t('category.reminder');
        default:
          return t('category.other');
      }
    },
    [t]
  );

  // Filtrelenmiş bildirimler
  const filteredNotifications = notifications.filter(notif => {
    if (selectedCategory !== 'all' && notif.category !== selectedCategory) {
      return false;
    }
    if (showOnlyUnread && notif.read) {
      return false;
    }
    return true;
  });

  // İstatistikler - Context'ten gelen unreadCount'u kullan
  const unreadCount = contextUnreadCount;
  const categoryCounts = {
    all: notifications.length,
    target: notifications.filter(n => n.category === 'target').length,
    investment: notifications.filter(n => n.category === 'investment').length,
    transaction: notifications.filter(n => n.category === 'transaction').length,
    reminder: notifications.filter(n => n.category === 'reminder').length,
  };

  // Tarih formatla
  const formatDate = (dateInput: Notification['createdAt']) => {
    const date = coerceFlexibleDate(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.justNow');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });

    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categories: Array<{ value: 'all' | Notification['category']; label: string }> = [
    { value: 'all', label: t('filters.all') },
    { value: 'target', label: t('category.target') },
    { value: 'investment', label: t('category.investment') },
    { value: 'transaction', label: t('category.transaction') },
    { value: 'reminder', label: t('category.reminder') }
  ];

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('header.title')}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                {unreadCount > 0 ? t('header.unreadCount', { count: unreadCount }) : t('header.allRead')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{t('actions.markAllRead')}</span>
              </button>
            )}
            {notifications.filter(n => n.read).length > 0 && (
              <button
                onClick={handleDeleteAllRead}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('actions.deleteRead')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('filters.categoryLabel')}</span>
              </div>
              <div className="flex items-center space-x-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat.value
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.label} ({categoryCounts[cat.value]})
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showOnlyUnread
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('filters.unreadOnly')}
            </button>
          </div>
        </div>
      </div>

      {/* Bildirimler Listesi */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Bell className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {showOnlyUnread 
              ? t('empty.noUnread')
              : selectedCategory !== 'all'
              ? t('empty.noInCategory')
              : t('empty.none')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all ${
                notification.read
                  ? 'border-gray-200 dark:border-gray-700 opacity-75'
                  : 'border-blue-200 dark:border-blue-800 shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Kategori İkonu */}
                  <div className={`p-3 rounded-lg ${getCategoryColor(notification.category)}`}>
                    {getCategoryIcon(notification.category)}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-lg font-semibold ${
                        notification.read 
                          ? 'text-gray-700 dark:text-gray-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                          {t('badge.new')}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)}`}>
                        {getCategoryName(notification.category)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title={t('actions.markReadTooltip')}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('actions.deleteTooltip')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
