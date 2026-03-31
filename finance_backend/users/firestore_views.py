from rest_framework import status, permissions, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
# Kendi özel Firebase kimlik doğrulama sınıfımızı içe aktarıyoruz
from .authentication import FirebaseAuthentication 
from .firestore_service import firestore_service
import logging
import asyncio

logger = logging.getLogger(__name__)

# --- BaseFirestoreView: DRY ve SRP'nin Kalbi ---

class BaseFirestoreView(APIView):
    """
    Tüm Firestore view'ları için temel sınıf. Tekrarı önler (DRY) ve 
    merkezi güvenlik (Authentication/Authorization) politikalarını tanımlar.
    """
    # 1. GÜVENLİK (AUTHENTICATION): Firebase ID Token'ı doğrulayan özel sınıf
    authentication_classes = [FirebaseAuthentication]
    # 2. YETKİLENDİRME (PERMISSION): Sadece kimliği doğrulanmış kullanıcılara izin ver
    permission_classes = [permissions.IsAuthenticated]

    # Artık 'get_user_firebase_uid' metoduna gerek yok, mantığı buraya entegre edildi.
    
    def validate_user_access(self, request, user_id=None):
        """
        Kullanıcının Firebase UID'sini döndürür. 
        Eğer bir user_id parametresi gelirse, kullanıcının o veriye erişimini (Authorization) kontrol eder.
        """
        
        # FirebaseAuthentication sınıfımız request.user'a 'firebase_uid' ekledi.
        if not hasattr(request.user, 'firebase_uid'):
            # Bu hata, aslında authentication_classes çalışmadıysa veya bir hata oluştuysa tetiklenir.
            logger.error("Doğrulama başarılı olmasına rağmen request.user.firebase_uid yok.")
            raise exceptions.AuthenticationFailed('Kullanıcı kimlik bilgileri eksik.')
            
        current_user_uid = request.user.firebase_uid
        
        # Kendi verisine erişim kontrolü (Yetkilendirme katmanı)
        if user_id and user_id != current_user_uid:
            raise exceptions.PermissionDenied('Bu kaynağa erişim yetkiniz yok.')
        
        return current_user_uid

# --- 1. İşlemler View'i (/api/auth/transactions/) ---

class FirestoreTransactionView(BaseFirestoreView):
    
    def get(self, request):
        """Kullanıcının işlemlerini filtreleyerek getirir."""
        try:
            # DRY: Kimlik ve yetki kontrolü BaseFirestoreView'den geliyor.
            firebase_uid = self.validate_user_access(request)
            
            # Filtreleme parametreleri
            filters = {}
            if request.query_params.get('type'):
                filters['type'] = request.query_params.get('type')
            if request.query_params.get('category'):
                filters['category'] = request.query_params.get('category')
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                transactions = loop.run_until_complete(
                    firestore_service.get_user_transactions(firebase_uid, filters)
                )
            finally:
                loop.close()
            
            return Response({'success': True, 'data': transactions})
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"İşlem getirilirken beklenmedik hata: {e}")
            return Response({'success': False, 'error': 'Sunucu hatası: İşlemler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Yeni işlem oluşturur."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            transaction_data = request.data
            required_fields = ['type', 'amount', 'category', 'description', 'date']
            
            # Temel veri doğrulama (View'ın SRP'si)
            for field in required_fields:
                if not transaction_data.get(field):
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                transaction_id = loop.run_until_complete(
                    firestore_service.create_transaction(firebase_uid, transaction_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'id': transaction_id, 'message': 'İşlem başarıyla oluşturuldu'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yeni işlem oluşturulurken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: İşlem oluşturulamadı.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 1.1. İşlem Detay View'i (/api/auth/transactions/<id>/) ---

class FirestoreTransactionDetailView(BaseFirestoreView):
    
    def put(self, request, transaction_id):
        """İşlem günceller."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            transaction_data = request.data
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.update_transaction(firebase_uid, transaction_id, transaction_data)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'message': 'İşlem başarıyla güncellendi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'İşlem bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"İşlem güncellenirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: İşlem güncellenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, transaction_id):
        """İşlem siler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.delete_transaction(firebase_uid, transaction_id)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'message': 'İşlem başarıyla silindi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'İşlem bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"İşlem silinirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: İşlem silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 1.2. Hızlı İşlemler View'i (/api/auth/quick-transactions/) ---

class FirestoreQuickTransactionView(BaseFirestoreView):
    
    def get(self, request):
        """Kullanıcının hızlı işlemlerini getirir."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                quick_transactions = loop.run_until_complete(
                    firestore_service.get_user_quick_transactions(firebase_uid)
                )
            finally:
                loop.close()
            
            return Response(quick_transactions)
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Hızlı işlemler getirilirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: Hızlı işlemler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Yeni hızlı işlem oluşturur."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            quick_transaction_data = request.data
            required_fields = ['name', 'type', 'amount', 'category', 'description']
            
            for field in required_fields:
                if not quick_transaction_data.get(field):
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                quick_transaction_id = loop.run_until_complete(
                    firestore_service.create_quick_transaction(firebase_uid, quick_transaction_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'id': quick_transaction_id, 'message': 'Hızlı işlem başarıyla oluşturuldu'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Hızlı işlem oluşturulurken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: Hızlı işlem oluşturulamadı.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FirestoreQuickTransactionDetailView(BaseFirestoreView):
    
    def put(self, request, quick_transaction_id):
        """Hızlı işlem günceller."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            quick_transaction_data = request.data
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.update_quick_transaction(firebase_uid, quick_transaction_id, quick_transaction_data)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'message': 'Hızlı işlem başarıyla güncellendi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Hızlı işlem bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Hızlı işlem güncellenirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: Hızlı işlem güncellenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, quick_transaction_id):
        """Hızlı işlem siler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.delete_quick_transaction(firebase_uid, quick_transaction_id)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'message': 'Hızlı işlem başarıyla silindi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Hızlı işlem bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Hızlı işlem silinirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: Hızlı işlem silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 2. Yatırımlar View'i (/api/auth/investments/) ---

class FirestoreInvestmentView(BaseFirestoreView):
    
    def get(self, request):
        """Kullanıcının tüm yatırımlarını getirir."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                investments = loop.run_until_complete(
                    firestore_service.get_user_investments(firebase_uid)
                )
            finally:
                loop.close()
            
            return Response({'success': True, 'data': investments})
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırımlar getirilirken beklenmedik hata: {e}")
            return Response({'success': False, 'error': 'Sunucu hatası: Yatırımlar getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Yeni bir yatırım portföy öğesi oluşturur."""
        try:
            firebase_uid = self.validate_user_access(request)
            investment_data = request.data
            required_fields = ['symbol', 'name', 'type', 'quantity', 'averagePrice', 'currentPrice']
            
            for field in required_fields:
                if not investment_data.get(field):
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Basit hesaplamalar
            try:
                quantity = float(investment_data['quantity'])
                current_price = float(investment_data['currentPrice'])
                investment_data['totalValue'] = quantity * current_price
                investment_data['profitLoss'] = 0 
                investment_data['profitLossPercentage'] = 0
            except (TypeError, ValueError):
                return Response(
                    {'error': 'Miktar veya Fiyat alanları sayısal olmalıdır.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                investment_id = loop.run_until_complete(
                    firestore_service.create_investment(firebase_uid, investment_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'id': investment_id, 'message': 'Yatırım başarıyla oluşturuldu'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yeni yatırım oluşturulurken beklenmedik hata: {e}")
            return Response({'success': False, 'error': 'Sunucu hatası: Yatırım oluşturulamadı.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 2.1. Yatırım Detay View'i (/api/auth/investments/<id>/) ---

class FirestoreInvestmentDetailView(BaseFirestoreView):
    
    def put(self, request, investment_id):
        """Yatırım günceller."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            investment_data = request.data
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.update_investment(firebase_uid, investment_id, investment_data)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'success': True, 'message': 'Yatırım başarıyla güncellendi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Yatırım bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım güncellenirken beklenmedik hata: {e}")
            return Response({'success': False, 'error': 'Sunucu hatası: Yatırım güncellenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, investment_id):
        """Yatırım siler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.delete_investment(firebase_uid, investment_id)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'success': True, 'message': 'Yatırım başarıyla silindi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Yatırım bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım silinirken beklenmedik hata: {e}")
            return Response({'success': False, 'error': 'Sunucu hatası: Yatırım silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 3. Yatırım İşlemleri View'i (/api/auth/investments/<id>/transactions/) ---

class FirestoreInvestmentTransactionView(BaseFirestoreView):
    
    def get(self, request, investment_id):
        """Belirli bir yatırımın tüm alım/satım işlemlerini getirir."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                transactions = loop.run_until_complete(
                    firestore_service.get_investment_transactions(firebase_uid, investment_id)
                )
            finally:
                loop.close()
            
            return Response({'success': True, 'data': transactions})
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım işlemleri getirilirken beklenmedik hata: {e}")
            return Response({'success': False, 'error': 'Sunucu hatası: İşlemler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, investment_id):
        """Belirli bir yatırıma yeni bir işlem (alım/satım) ekler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            transaction_data = request.data
            required_fields = ['type', 'quantity', 'price', 'totalAmount', 'date']
            
            for field in required_fields:
                if not transaction_data.get(field):
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                transaction_id = loop.run_until_complete(
                    firestore_service.add_investment_transaction(firebase_uid, investment_id, transaction_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'id': transaction_id, 'message': 'Yatırım işlemi başarıyla eklendi'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            logger.error(f"Yatırım işlemi eklenirken erişim hatası: {e}", exc_info=True)
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım işlemi eklenirken beklenmedik hata: {e}", exc_info=True)
            error_msg = str(e)
            # Firestore permission hatalarını daha açıklayıcı yap
            if 'permission' in error_msg.lower() or 'insufficient' in error_msg.lower():
                error_msg = f"Firestore izin hatası: {error_msg}. Lütfen Firebase Admin SDK yapılandırmasını kontrol edin."
            return Response({'success': False, 'error': f'Sunucu hatası: {error_msg}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- 3. Yatırım İşlemi Detay View'i (/api/auth/investments/<investment_id>/transactions/<transaction_id>/) ---

class FirestoreInvestmentTransactionDetailView(BaseFirestoreView):
    
    def put(self, request, investment_id, transaction_id):
        """Belirli bir yatırım işlemini günceller."""
        try:
            firebase_uid = self.validate_user_access(request)
            transaction_data = request.data
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(
                    firestore_service.update_investment_transaction(firebase_uid, investment_id, transaction_id, transaction_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'message': 'Yatırım işlemi başarıyla güncellendi'}, 
                status=status.HTTP_200_OK
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım işlemi güncellenirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: İşlem güncellenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, investment_id, transaction_id):
        """Belirli bir yatırım işlemini siler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(
                    firestore_service.delete_investment_transaction(firebase_uid, investment_id, transaction_id)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'message': 'Yatırım işlemi başarıyla silindi'}, 
                status=status.HTTP_200_OK
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım işlemi silinirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: İşlem silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 7. Settings View'i (/api/auth/settings/) ---

class FirestoreSettingsView(BaseFirestoreView):
    """Kullanıcı ayarlarını yöneten view"""
    
    def get(self, request):
        """Kullanıcının ayarlarını getirir."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                settings = loop.run_until_complete(
                    firestore_service.get_user_settings(firebase_uid)
                )
            finally:
                loop.close()
            
            # Eğer settings yoksa varsayılan değerleri döndür
            if not settings:
                default_settings = {
                    'darkMode': False,
                    'budgetAlerts': True,
                    'language': 'tr',
                    'currency': 'TRY'
                }
                return Response({'success': True, 'data': default_settings})
            
            # Firestore'dan gelen veriyi temizle (id ve timestamp'leri kaldır)
            settings_data = {k: v for k, v in settings.items() if k not in ['id', 'createdAt', 'updatedAt']}
            
            return Response({'success': True, 'data': settings_data})
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Ayarlar getirilirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Ayarlar getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request):
        """Kullanıcının ayarlarını günceller veya oluşturur."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            settings_data = request.data
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(
                    firestore_service.create_or_update_user_settings(firebase_uid, settings_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'message': 'Ayarlar başarıyla kaydedildi'}, 
                status=status.HTTP_200_OK
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Ayarlar kaydedilirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Ayarlar kaydedilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 8. Notifications View'i (/api/auth/notifications/) ---

class FirestoreNotificationView(BaseFirestoreView):
    """Bildirimleri yöneten view"""
    
    def get(self, request):
        """Kullanıcının bildirimlerini getirir (son 30 gün)."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                notifications = loop.run_until_complete(
                    firestore_service.get_user_notifications(firebase_uid)
                )
            finally:
                loop.close()
            
            return Response({'success': True, 'data': notifications})
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Bildirimler getirilirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Bildirimler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Yeni bildirim oluşturur."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            notification_data = request.data
            required_fields = ['category', 'title', 'message']
            
            for field in required_fields:
                if not notification_data.get(field):
                    return Response(
                        {'success': False, 'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Kategori kontrolü
            valid_categories = ['target', 'investment', 'transaction', 'reminder']
            if notification_data.get('category') not in valid_categories:
                return Response(
                    {'success': False, 'error': f'Geçersiz kategori. Geçerli kategoriler: {", ".join(valid_categories)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                notification_id = loop.run_until_complete(
                    firestore_service.create_notification(firebase_uid, notification_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'id': notification_id, 'message': 'Bildirim başarıyla oluşturuldu'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Bildirim oluşturulurken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Bildirim oluşturulamadı.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FirestoreNotificationDetailView(BaseFirestoreView):
    """Tek bir bildirimi yöneten view"""
    
    def put(self, request, notification_id):
        """Bildirimi okundu olarak işaretle."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.mark_notification_as_read(firebase_uid, notification_id)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'success': True, 'message': 'Bildirim okundu olarak işaretlendi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Bildirim bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Bildirim işaretlenirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Bildirim işaretlenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, notification_id):
        """Bildirimi siler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.delete_notification(firebase_uid, notification_id)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'success': True, 'message': 'Bildirim başarıyla silindi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Bildirim bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Bildirim silinirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Bildirim silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FirestoreNotificationReadAllView(BaseFirestoreView):
    """Tüm bildirimleri okundu olarak işaretleyen view"""
    
    def put(self, request):
        """Tüm bildirimleri okundu olarak işaretle."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.mark_all_notifications_as_read(firebase_uid)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'message': 'Tüm bildirimler okundu olarak işaretlendi'}, 
                status=status.HTTP_200_OK
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Bildirimler işaretlenirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Bildirimler işaretlenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FirestoreNotificationDeleteReadView(BaseFirestoreView):
    """Okunmuş bildirimleri silen view"""
    
    def delete(self, request):
        """Tüm okunmuş bildirimleri sil."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.delete_all_read_notifications(firebase_uid)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'message': 'Okunmuş bildirimler başarıyla silindi'}, 
                status=status.HTTP_200_OK
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Okunmuş bildirimler silinirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Bildirimler silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 9. Events View'i (/api/auth/events/) ---

class FirestoreEventView(BaseFirestoreView):
    """Etkinlikleri yöneten view"""
    
    def get(self, request):
        """Kullanıcının etkinliklerini getirir."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Filtreler (opsiyonel)
            filters = {}
            start_date = request.query_params.get('startDate')
            end_date = request.query_params.get('endDate')
            
            if start_date:
                filters['startDate'] = start_date
            if end_date:
                filters['endDate'] = end_date
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                events = loop.run_until_complete(
                    firestore_service.get_user_events(firebase_uid, filters if filters else None)
                )
            finally:
                loop.close()
            
            return Response({'success': True, 'data': events})
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Etkinlikler getirilirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Etkinlikler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Yeni etkinlik oluşturur."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            event_data = request.data
            required_fields = ['title', 'date']
            
            for field in required_fields:
                if not event_data.get(field):
                    return Response(
                        {'success': False, 'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                event_id = loop.run_until_complete(
                    firestore_service.create_event(firebase_uid, event_data)
                )
            finally:
                loop.close()
            
            return Response(
                {'success': True, 'id': event_id, 'message': 'Etkinlik başarıyla oluşturuldu'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Etkinlik oluşturulurken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Etkinlik oluşturulamadı.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- 9.1. Event Detay View'i (/api/auth/events/<id>/) ---

class FirestoreEventDetailView(BaseFirestoreView):
    """Etkinlik detayını yöneten view"""
    
    def put(self, request, event_id):
        """Etkinlik günceller."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            event_data = request.data
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.update_event(firebase_uid, event_id, event_data)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'success': True, 'message': 'Etkinlik başarıyla güncellendi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Etkinlik bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Etkinlik güncellenirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Etkinlik güncellenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, event_id):
        """Etkinlik siler."""
        try:
            firebase_uid = self.validate_user_access(request)
            
            # Async firestore servisini sync wrapper ile çağır
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(
                    firestore_service.delete_event(firebase_uid, event_id)
                )
            finally:
                loop.close()
            
            if success:
                return Response(
                    {'success': True, 'message': 'Etkinlik başarıyla silindi'}, 
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'success': False, 'error': 'Etkinlik bulunamadı'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
        except exceptions.PermissionDenied as e:
            return Response({'success': False, 'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Etkinlik silinirken beklenmedik hata: {e}", exc_info=True)
            return Response({'success': False, 'error': 'Sunucu hatası: Etkinlik silinemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
