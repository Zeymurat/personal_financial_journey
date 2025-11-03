"""
Currencies app URL routing
"""
from django.urls import path
from . import views

app_name = 'currencies'

urlpatterns = [
    # Tüm verileri getir (döviz, altın, parite)
    path('getmain/', views.GetMainDataView.as_view(), name='getmain'),
    
    # Sadece döviz kurları
    path('exchange-rates/', views.ExchangeRatesView.as_view(), name='exchange-rates'),
    
    # Sadece altın fiyatları
    path('gold-prices/', views.GoldPricesView.as_view(), name='gold-prices'),
]

