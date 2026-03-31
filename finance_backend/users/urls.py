from django.urls import path
from users.views import FirebaseLoginView
# Tüm finansal verileri yöneten view'ları import ediyoruz.
from users.firestore_views import (
    FirestoreTransactionView,
    FirestoreTransactionDetailView,
    FirestoreQuickTransactionView,
    FirestoreQuickTransactionDetailView,
    FirestoreInvestmentView,
    FirestoreInvestmentDetailView,
    FirestoreInvestmentTransactionView,
    FirestoreInvestmentTransactionDetailView,
    FirestoreSettingsView,
    FirestoreNotificationView,
    FirestoreNotificationDetailView,
    FirestoreNotificationReadAllView,
    FirestoreNotificationDeleteReadView,
    FirestoreEventView,
    FirestoreEventDetailView
)

urlpatterns = [
    # 1. Kimlik Doğrulama Uç Noktası (Örn: /api/auth/firebase-login/)
    path('firebase-login/', FirebaseLoginView.as_view(), name='firebase_login'),
    
    # 2. Firestore Finansal Veri Uç Noktaları (Transactions.tsx'in çağırdığı yer)
    
    # İşlemler (GET/POST) için: Tam URL: /api/auth/transactions/
    path('transactions/', FirestoreTransactionView.as_view(), name='firestore_transactions'),
    
    # İşlem Detay (PUT/DELETE) için: Tam URL: /api/auth/transactions/<id>/
    path('transactions/<str:transaction_id>/', FirestoreTransactionDetailView.as_view(), name='firestore_transaction_detail'),
    
    # Hızlı İşlemler (GET/POST) için: Tam URL: /api/auth/quick-transactions/
    path('quick-transactions/', FirestoreQuickTransactionView.as_view(), name='firestore_quick_transactions'),
    
    # Hızlı İşlem Detay (PUT/DELETE) için: Tam URL: /api/auth/quick-transactions/<id>/
    path('quick-transactions/<str:quick_transaction_id>/', FirestoreQuickTransactionDetailView.as_view(), name='firestore_quick_transaction_detail'),
    
    # Yatırımlar (GET/POST) için: Tam URL: /api/auth/investments/
    path('investments/', FirestoreInvestmentView.as_view(), name='firestore_investments'),
    
    # Yatırım Detay (PUT/DELETE) için: Tam URL: /api/auth/investments/<id>/
    path('investments/<str:investment_id>/', FirestoreInvestmentDetailView.as_view(), name='firestore_investment_detail'),
    
    # Bir yatırıma ait işlemler (GET/POST): Tam URL: /api/auth/investments/<str:id>/transactions/
    path('investments/<str:investment_id>/transactions/', 
         FirestoreInvestmentTransactionView.as_view(), 
         name='firestore_investment_transactions'),
    
    # Yatırım İşlemi Detay (PUT/DELETE) için: Tam URL: /api/auth/investments/<investment_id>/transactions/<transaction_id>/
    path('investments/<str:investment_id>/transactions/<str:transaction_id>/', 
         FirestoreInvestmentTransactionDetailView.as_view(), 
         name='firestore_investment_transaction_detail'),
    
    # Ayarlar (GET/PUT) için: Tam URL: /api/auth/settings/
    path('settings/', FirestoreSettingsView.as_view(), name='firestore_settings'),
    
    # Bildirimler (GET/POST) için: Tam URL: /api/auth/notifications/
    path('notifications/', FirestoreNotificationView.as_view(), name='firestore_notifications'),
    
    # Tüm bildirimleri okundu işaretle için: Tam URL: /api/auth/notifications/read-all/
    # ÖNEMLİ: Bu route, notification_id pattern'inden ÖNCE olmalı
    path('notifications/read-all/', FirestoreNotificationReadAllView.as_view(), name='firestore_notifications_read_all'),
    
    # Okunmuş bildirimleri sil için: Tam URL: /api/auth/notifications/delete-read/
    # ÖNEMLİ: Bu route, notification_id pattern'inden ÖNCE olmalı
    path('notifications/delete-read/', FirestoreNotificationDeleteReadView.as_view(), name='firestore_notifications_delete_read'),
    
    # Bildirimi okundu işaretle için: Tam URL: /api/auth/notifications/<id>/read/
    path('notifications/<str:notification_id>/read/', FirestoreNotificationDetailView.as_view(), name='firestore_notification_read'),
    
    # Bildirim Detay (PUT/DELETE) için: Tam URL: /api/auth/notifications/<id>/
    path('notifications/<str:notification_id>/', FirestoreNotificationDetailView.as_view(), name='firestore_notification_detail'),
    
    # Etkinlikler (GET/POST) için: Tam URL: /api/auth/events/
    path('events/', FirestoreEventView.as_view(), name='firestore_events'),
    
    # Etkinlik Detay (PUT/DELETE) için: Tam URL: /api/auth/events/<id>/
    path('events/<str:event_id>/', FirestoreEventDetailView.as_view(), name='firestore_event_detail'),
]
