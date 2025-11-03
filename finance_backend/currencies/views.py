"""
Döviz kurları, altın fiyatları ve parite bilgileri için API View'ları
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import logging

from .services import get_altinkaynak_service

logger = logging.getLogger(__name__)


class GetMainDataView(APIView):
    """
    Altınkaynak GetMain servisini çağırarak anlık döviz kurları, 
    altın fiyatları ve parite bilgilerini döndürür.
    """
    permission_classes = [AllowAny]  # İsterseniz authentication ekleyebilirsiniz
    
    def get(self, request):
        """
        GET request ile GetMain verilerini alır.
        
        Returns:
            JSON response with currency rates, gold prices, and parities
        """
        try:
            print("\n" + "="*60)
            print("🌐 API Request: /api/currencies/getmain/")
            print("="*60)
            print("📞 Frontend'den istek geldi, Altınkaynak servisi çağrılıyor...")
            
            service = get_altinkaynak_service()
            data = service.get_formatted_rates()
            
            if data is None:
                print("❌ Altınkaynak servisinden veri alınamadı")
                print("="*60 + "\n")
                return Response(
                    {
                        "error": "Altınkaynak servisinden veri alınamadı",
                        "message": "Lütfen daha sonra tekrar deneyin"
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            print(f"✅ Veri başarıyla alındı!")
            print(f"   - Döviz kurları: {len(data.get('exchange_rates', {}))} adet")
            print(f"   - Altın fiyatları: {len(data.get('gold_prices', {}))} adet")
            print("="*60 + "\n")
            
            return Response(
                {
                    "success": True,
                    "data": data,
                    "source": "Altınkaynak"
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            print(f"❌ GetMainDataView hatası: {e}")
            print("="*60 + "\n")
            logger.error(f"GetMainDataView hatası: {e}")
            return Response(
                {
                    "error": "Sunucu hatası",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExchangeRatesView(APIView):
    """
    Sadece döviz kurlarını döndüren view
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Sadece döviz kurlarını döndürür"""
        try:
            service = get_altinkaynak_service()
            data = service.get_formatted_rates()
            
            if data is None:
                return Response(
                    {"error": "Veri alınamadı"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            return Response(
                {
                    "success": True,
                    "exchange_rates": data.get('exchange_rates', {}),
                    "last_updated": data.get('last_updated')
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"ExchangeRatesView hatası: {e}")
            return Response(
                {"error": "Sunucu hatası"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoldPricesView(APIView):
    """
    Sadece altın fiyatlarını döndüren view
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Sadece altın fiyatlarını döndürür"""
        try:
            service = get_altinkaynak_service()
            data = service.get_formatted_rates()
            
            if data is None:
                return Response(
                    {"error": "Veri alınamadı"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            return Response(
                {
                    "success": True,
                    "gold_prices": data.get('gold_prices', {}),
                    "last_updated": data.get('last_updated')
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"GoldPricesView hatası: {e}")
            return Response(
                {"error": "Sunucu hatası"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

