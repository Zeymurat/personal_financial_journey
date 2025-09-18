"""finance_backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
# """
# from django.contrib import admin
# from django.urls import path, include
# from rest_framework_simplejwt.views import TokenVerifyView

# urlpatterns = [
#     path('admin/', admin.site.urls),
#     path('api/auth/', include('users.urls')),
#     path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
# ]


# finance_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenVerifyView, TokenObtainPairView, TokenRefreshView
from users import views as users_views
from users import firestore_views

print("✅ URL'ler başarıyla yüklendi.")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Tüm users uygulamasının URL'lerini buraya taşıyoruz
    path('api/auth/register/', users_views.RegisterView.as_view(), name='register'),
    path('api/auth/me/', users_views.UserDetailView.as_view(), name='user-detail'),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', users_views.BlacklistTokenView.as_view(), name='logout'),
    path('api/auth/firebase-login/', users_views.FirebaseLoginView.as_view(), name='firebase_login'),

    # Firestore API uç noktalarını da buraya taşıyoruz
    path('api/auth/transactions/', firestore_views.FirestoreTransactionView.as_view(), name='firestore_transactions'),
    path('api/auth/investments/', firestore_views.FirestoreInvestmentView.as_view(), name='firestore_investments'),
    path('api/auth/investments/<str:investment_id>/transactions/', firestore_views.FirestoreInvestmentTransactionView.as_view(), name='firestore_investment_transactions'),
]