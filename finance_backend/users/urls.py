from django.urls import path
from users.views import FirebaseLoginView
# Tüm finansal verileri yöneten view'ları import ediyoruz.
from users.firestore_views import (
    FirestoreTransactionView,
    FirestoreTransactionDetailView,
    FirestoreQuickTransactionView,
    FirestoreQuickTransactionDetailView,
    FirestoreInvestmentView, 
    FirestoreInvestmentTransactionView
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
    
    # Yatırımlar (GET/POST/PUT/DELETE) için: Tam URL: /api/auth/investments/
    path('investments/', FirestoreInvestmentView.as_view(), name='firestore_investments'),
    
    # Bir yatırıma ait işlemler (GET): Tam URL: /api/auth/investments/<str:id>/transactions/
    path('investments/<str:investment_id>/transactions/', 
         FirestoreInvestmentTransactionView.as_view(), 
         name='firestore_investment_transactions'),
]
