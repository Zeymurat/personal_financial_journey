# from django.urls import path
# from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# from . import views
# from . import firestore_views


# urlpatterns = [
#     path('register/', views.RegisterView.as_view(), name='register'),
#     path('me/', views.UserDetailView.as_view(), name='user-detail'),
#     path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('logout/', views.BlacklistTokenView.as_view(), name='logout'),
#     path('firebase-login/', views.FirebaseLoginView.as_view(), name='firebase_login'),
    
#     # Firestore API endpoints
#     path('transactions/', firestore_views.FirestoreTransactionView.as_view(), name='firestore_transactions'),
#     path('investments/', firestore_views.FirestoreInvestmentView.as_view(), name='firestore_investments'),
#     path('investments/<str:investment_id>/transactions/', firestore_views.FirestoreInvestmentTransactionView.as_view(), name='firestore_investment_transactions'),
# ]


