import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';
import toast from 'react-hot-toast';
import { Bell, Target, TrendingUp, ArrowUpDown, Clock } from 'lucide-react';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);
  const [shownToastIds, setShownToastIds] = useState<Set<string>>(new Set());
  const shownToastIdsRef = useRef<Set<string>>(new Set());

  // OnSnapshot sırasında “tek tek” gelen bildirimleri debounce ile grupluyoruz.
  const pendingToastNotificationsRef = useRef<Notification[]>([]);
  const toastFlushTimerRef = useRef<number | null>(null);

  // İlk snapshot geldikten sonra toasts mantığını açmak için ref.
  // state güncellemeleriyle oluşan race condition'ı engeller.
  const didInitRef = useRef(false);

  // localStorage'dan gösterilen toast ID'lerini yükle
  useEffect(() => {
    if (currentUser?.id) {
      const stored = localStorage.getItem(`shown_toasts_${currentUser.id}`);
      if (stored) {
        try {
          const ids = JSON.parse(stored) as unknown[];
          // Sadece son 30 günün ID'lerini tut (eski ID'leri temizle)
          // Bu basit bir yaklaşım - gerçekte bildirim ID'lerini kontrol etmek daha iyi olur
          // Ama şimdilik tüm ID'leri tutuyoruz, çünkü bildirimler zaten 30 günlük
          const next = new Set<string>(ids.filter((x): x is string => typeof x === 'string'));
          setShownToastIds(next);
          shownToastIdsRef.current = next;
        } catch (e) {
          console.error('Toast ID\'leri yüklenirken hata:', e);
        }
      }
    } else {
      // Kullanıcı çıkış yaptığında temizle
      const next = new Set<string>();
      setShownToastIds(next);
      shownToastIdsRef.current = next;
    }
  }, [currentUser?.id]);

  // state güncellemeleri sırasında ref'i her zaman senkron tut
  useEffect(() => {
    shownToastIdsRef.current = shownToastIds;
  }, [shownToastIds]);

  useEffect(() => {
    lastNotificationIdRef.current = lastNotificationId;
  }, [lastNotificationId]);

  // Gösterilen toast ID'lerini localStorage'a kaydet
  const saveShownToastIds = (ids: Set<string>) => {
    if (currentUser?.id) {
      try {
        localStorage.setItem(`shown_toasts_${currentUser.id}`, JSON.stringify(Array.from(ids)));
      } catch (e) {
        console.error('Toast ID\'leri kaydedilirken hata:', e);
      }
    }
  };

  // Kategori ikonları
  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'target':
        return Target;
      case 'investment':
        return TrendingUp;
      case 'transaction':
        return ArrowUpDown;
      case 'reminder':
        return Clock;
      default:
        return Bell;
    }
  };

  // Kategori renkleri
  const getCategoryColor = (category: Notification['category']) => {
    switch (category) {
      case 'target':
        return 'text-blue-600';
      case 'investment':
        return 'text-green-600';
      case 'transaction':
        return 'text-purple-600';
      case 'reminder':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // Real-time listener
  useEffect(() => {
    if (!currentUser?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Son 30 günün bildirimlerini dinle
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const notificationsRef = collection(db, 'users', currentUser.id, 'notifications');
    const q = query(
      notificationsRef,
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(100) // Son 100 bildirimi dinle
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData: Notification[] = [];
        let unread = 0;
        const isInitialLoad = !didInitRef.current;

        // Tüm bildirimleri topla
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt = data.createdAt;
          
          if (createdAt && createdAt.toDate) {
            createdAt = createdAt.toDate().toISOString();
          } else if (!createdAt || typeof createdAt !== 'string') {
            createdAt = new Date().toISOString();
          }

          const notification: Notification = {
            id: doc.id,
            category: data.category || 'reminder',
            title: data.title || '',
            message: data.message || '',
            read: data.read || false,
            createdAt,
            metadata: data.metadata || {}
          };

          notificationsData.push(notification);
          
          if (!notification.read) {
            unread++;
          }
        });

        // Yeni eklenen bildirimleri kontrol et (sadece ilk yükleme değilse)
        if (!isInitialLoad) {
          const addedNotifications: Notification[] = [];

          snapshot.docChanges().forEach((change) => {
            if (change.type !== 'added') return;

            const data = change.doc.data();
            let createdAt = data.createdAt;

            if (createdAt && createdAt.toDate) {
              createdAt = createdAt.toDate().toISOString();
            } else if (!createdAt || typeof createdAt !== 'string') {
              createdAt = new Date().toISOString();
            }

            const notification: Notification = {
              id: change.doc.id,
              category: data.category || 'reminder',
              title: data.title || '',
              message: data.message || '',
              read: data.read || false,
              createdAt,
              metadata: data.metadata || {}
            };

            if (notification.read) return;
            if (shownToastIdsRef.current.has(notification.id)) return;

            addedNotifications.push(notification);
          });

          if (addedNotifications.length > 0) {
            pendingToastNotificationsRef.current = [
              ...pendingToastNotificationsRef.current,
              ...addedNotifications
            ];

            // Aynı anda birden fazla snapshot gelirse, tek bir flush planlayalım.
            if (toastFlushTimerRef.current == null) {
              toastFlushTimerRef.current = window.setTimeout(() => {
                const pending = pendingToastNotificationsRef.current;
                pendingToastNotificationsRef.current = [];
                toastFlushTimerRef.current = null;

                if (pending.length === 0) return;

                pending.forEach((notification) => {
                  const Icon = getCategoryIcon(notification.category);
                  const iconColor = getCategoryColor(notification.category);

                  toast(
                    () => (
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    ),
                    {
                      duration: 5000,
                      position: 'top-right',
                      className: 'toast-notification',
                      style: {
                        background: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white',
                        color: document.documentElement.classList.contains('dark') ? '#f9fafb' : '#1f2937',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                        border: document.documentElement.classList.contains('dark')
                          ? '1px solid rgba(255, 255, 255, 0.1)'
                          : '1px solid rgba(0, 0, 0, 0.05)',
                      },
                    }
                  );
                });

                // Bu pending grubundaki tüm ID'leri işaretle (detay gösterilsin ya da overflow olsun)
                const idsToAdd = pending.map((n) => n.id);
                const next = new Set(shownToastIdsRef.current);
                idsToAdd.forEach((id) => next.add(id));
                shownToastIdsRef.current = next;
                setShownToastIds(next);
                saveShownToastIds(next);
              }, 500);
            }
          }
        }

        // İlk snapshot'tan sonra toasts mantığını aç.
        if (isInitialLoad) {
          didInitRef.current = true;
        }

        // En yeni bildirimin ID'sini güncelle
        if (notificationsData.length > 0) {
          const latestId = notificationsData[0].id;
          if (latestId !== lastNotificationIdRef.current) {
            setLastNotificationId(latestId);
          }
        }

        setNotifications(notificationsData);
        setUnreadCount(unread);
      },
      (error) => {
        console.error('Bildirimler dinlenirken hata:', error);
      }
    );

    return () => {
      unsubscribe();
      if (toastFlushTimerRef.current != null) {
        clearTimeout(toastFlushTimerRef.current);
      }
    };
  }, [currentUser?.id]);

  const refreshNotifications = () => {
    // Real-time listener zaten güncelliyor, bu fonksiyon sadece API çağrısı yapmak isterseniz kullanılabilir
    didInitRef.current = false;
    setLastNotificationId(null); // Reset ederek tüm bildirimleri tekrar kontrol et
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

