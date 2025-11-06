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
    
    # Borsa verileri - Veri çek ve Firestore'a kaydet
    path('borsa/', views.BorsaDataView.as_view(), name='borsa'),
    
    # Borsa verileri - Firestore'dan oku
    path('borsa/list/', views.BorsaDataListView.as_view(), name='borsa-list'),
    
    # Funds verileri - Firestore'dan oku (global havuz)
    path('funds/', views.FundsListView.as_view(), name='funds'),
    
    # Fon detay bilgileri - RapidAPI (akıllı cache ile)
    path('fund-detail/', views.FundDetailView.as_view(), name='fund-detail'),
    
    # Fon API quota bilgisi (cache'den okur, istek saymaz)
    path('fund-quota/', views.FundQuotaView.as_view(), name='fund-quota'),
    
    # Fon fiyat kontrolü (cache'den okur, API'ye istek atmaz)
    path('fund-price-check/', views.FundPriceCheckView.as_view(), name='fund-price-check'),
]

