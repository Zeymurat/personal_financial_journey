# from rest_framework import status, permissions
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework_simplejwt.authentication import JWTAuthentication
# from firebase_admin import auth
# from .firestore_service import firestore_service
# import asyncio

# class FirestoreTransactionView(APIView):
#     # authentication_classes = [JWTAuthentication]
#     # permission_classes = [permissions.IsAuthenticated]
    
#     # def options(self, request, *args, **kwargs):
#     #     """
#     #     Handles CORS preflight requests by returning a 200 OK response.
#     #     """
#     #     response = Response(status=status.HTTP_200_OK)
#     #     # These headers are handled by CorsMiddleware, but adding them manually 
#     #     # ensures the response is correct even if the middleware fails.
#     #     response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
#     #     response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
#     #     response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
#     #     response['Access-Control-Max-Age'] = '86400' 
#     #     return response
    
#     def get_user_firebase_uid(self, request):
#         """Güvenli şekilde kullanıcının Firebase UID'sini al"""
#         if not hasattr(request.user, 'firebase_uid') or not request.user.firebase_uid:
#             raise ValueError('Firebase UID bulunamadı')
#         return request.user.firebase_uid
    
#     def validate_user_access(self, request, user_id=None):
#         """Kullanıcının kendi verilerine erişim hakkını doğrula"""
#         current_user_uid = self.get_user_firebase_uid(request)
        
#         # Eğer belirli bir user_id isteniyorsa, sadece kendi verilerine erişebilir
#         if user_id and user_id != current_user_uid:
#             raise PermissionError('Bu veriye erişim yetkiniz yok')
        
#         return current_user_uid
    
#     def get(self, request):
#         """Kullanıcının işlemlerini getir"""
#         try:
#             # Güvenli şekilde Firebase UID'yi al ve doğrula
#             firebase_uid = self.validate_user_access(request)
            
#             # Filtreleri al
#             filters = {}
#             if request.query_params.get('type'):
#                 filters['type'] = request.query_params.get('type')
#             if request.query_params.get('category'):
#                 filters['category'] = request.query_params.get('category')
            
#             # Firestore'dan işlemleri getir
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 transactions = loop.run_until_complete(
#                     firestore_service.get_user_transactions(firebase_uid, filters)
#                 )
#             finally:
#                 loop.close()
            
#             return Response(transactions)
            
#         except ValueError as e:
#             return Response(
#                 {'error': f'Geçersiz veri: {str(e)}'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except PermissionError as e:
#             return Response(
#                 {'error': f'Erişim hatası: {str(e)}'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Sunucu hatası: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
    
#     def post(self, request):
#         """Yeni işlem oluştur"""
#         try:
#             # Güvenli şekilde Firebase UID'yi al ve doğrula
#             firebase_uid = self.validate_user_access(request)
            
#             transaction_data = request.data
#             required_fields = ['type', 'amount', 'category', 'description', 'date']
            
#             for field in required_fields:
#                 if field not in transaction_data:
#                     return Response(
#                         {'error': f'{field} alanı gerekli'}, 
#                         status=status.HTTP_400_BAD_REQUEST
#                     )
            
#             # Firestore'a kaydet
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 transaction_id = loop.run_until_complete(
#                     firestore_service.create_transaction(firebase_uid, transaction_data)
#                 )
#             finally:
#                 loop.close()
            
#             return Response(
#                 {'id': transaction_id, 'message': 'İşlem başarıyla oluşturuldu'}, 
#                 status=status.HTTP_201_CREATED
#             )
            
#         except ValueError as e:
#             return Response(
#                 {'error': f'Geçersiz veri: {str(e)}'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except PermissionError as e:
#             return Response(
#                 {'error': f'Erişim hatası: {str(e)}'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Sunucu hatası: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

# class FirestoreInvestmentView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_user_firebase_uid(self, request):
#         """Güvenli şekilde kullanıcının Firebase UID'sini al"""
#         if not hasattr(request.user, 'firebase_uid') or not request.user.firebase_uid:
#             raise ValueError('Firebase UID bulunamadı')
#         return request.user.firebase_uid
    
#     def validate_user_access(self, request, user_id=None):
#         """Kullanıcının kendi verilerine erişim hakkını doğrula"""
#         current_user_uid = self.get_user_firebase_uid(request)
        
#         # Eğer belirli bir user_id isteniyorsa, sadece kendi verilerine erişebilir
#         if user_id and user_id != current_user_uid:
#             raise PermissionError('Bu veriye erişim yetkiniz yok')
        
#         return current_user_uid
    
#     def get(self, request):
#         """Kullanıcının yatırımlarını getir"""
#         try:
#             # Güvenli şekilde Firebase UID'yi al ve doğrula
#             firebase_uid = self.validate_user_access(request)
            
#             # Firestore'dan yatırımları getir
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 investments = loop.run_until_complete(
#                     firestore_service.get_user_investments(firebase_uid)
#                 )
#             finally:
#                 loop.close()
            
#             return Response(investments)
            
#         except ValueError as e:
#             return Response(
#                 {'error': f'Geçersiz veri: {str(e)}'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except PermissionError as e:
#             return Response(
#                 {'error': f'Erişim hatası: {str(e)}'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Sunucu hatası: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
    
#     def post(self, request):
#         """Yeni yatırım oluştur"""
#         try:
#             # Güvenli şekilde Firebase UID'yi al ve doğrula
#             firebase_uid = self.validate_user_access(request)
            
#             investment_data = request.data
#             required_fields = ['symbol', 'name', 'type', 'quantity', 'averagePrice', 'currentPrice']
            
#             for field in required_fields:
#                 if field not in investment_data:
#                     return Response(
#                         {'error': f'{field} alanı gerekli'}, 
#                         status=status.HTTP_400_BAD_REQUEST
#                     )
            
#             # Hesaplamalar
#             total_value = investment_data['quantity'] * investment_data['currentPrice']
#             investment_data['totalValue'] = total_value
#             investment_data['profitLoss'] = 0
#             investment_data['profitLossPercentage'] = 0
            
#             # Firestore'a kaydet
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 investment_id = loop.run_until_complete(
#                     firestore_service.create_investment(firebase_uid, investment_data)
#                 )
#             finally:
#                 loop.close()
            
#             return Response(
#                 {'id': investment_id, 'message': 'Yatırım başarıyla oluşturuldu'}, 
#                 status=status.HTTP_201_CREATED
#             )
            
#         except ValueError as e:
#             return Response(
#                 {'error': f'Geçersiz veri: {str(e)}'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except PermissionError as e:
#             return Response(
#                 {'error': f'Erişim hatası: {str(e)}'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Sunucu hatası: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )

# class FirestoreInvestmentTransactionView(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [permissions.IsAuthenticated]
    
#     def get_user_firebase_uid(self, request):
#         """Güvenli şekilde kullanıcının Firebase UID'sini al"""
#         if not hasattr(request.user, 'firebase_uid') or not request.user.firebase_uid:
#             raise ValueError('Firebase UID bulunamadı')
#         return request.user.firebase_uid
    
#     def validate_user_access(self, request, user_id=None):
#         """Kullanıcının kendi verilerine erişim hakkını doğrula"""
#         current_user_uid = self.get_user_firebase_uid(request)
        
#         # Eğer belirli bir user_id isteniyorsa, sadece kendi verilerine erişebilir
#         if user_id and user_id != current_user_uid:
#             raise PermissionError('Bu veriye erişim yetkiniz yok')
        
#         return current_user_uid
    
#     def get(self, request, investment_id):
#         """Yatırım işlemlerini getir"""
#         try:
#             # Güvenli şekilde Firebase UID'yi al ve doğrula
#             firebase_uid = self.validate_user_access(request)
            
#             # Firestore'dan işlemleri getir
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 transactions = loop.run_until_complete(
#                     firestore_service.get_investment_transactions(firebase_uid, investment_id)
#                 )
#             finally:
#                 loop.close()
            
#             return Response(transactions)
            
#         except ValueError as e:
#             return Response(
#                 {'error': f'Geçersiz veri: {str(e)}'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except PermissionError as e:
#             return Response(
#                 {'error': f'Erişim hatası: {str(e)}'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Sunucu hatası: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
    
#     def post(self, request, investment_id):
#         """Yatırım işlemi ekle"""
#         try:
#             # Güvenli şekilde Firebase UID'yi al ve doğrula
#             firebase_uid = self.validate_user_access(request)
            
#             transaction_data = request.data
#             required_fields = ['type', 'quantity', 'price', 'totalAmount', 'date']
            
#             for field in required_fields:
#                 if field not in transaction_data:
#                     return Response(
#                         {'error': f'{field} alanı gerekli'}, 
#                         status=status.HTTP_400_BAD_REQUEST
#                     )
            
#             # Firestore'a kaydet
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 transaction_id = loop.run_until_complete(
#                     firestore_service.add_investment_transaction(firebase_uid, investment_id, transaction_data)
#                 )
#             finally:
#                 loop.close()
            
#             return Response(
#                 {'id': transaction_id, 'message': 'Yatırım işlemi başarıyla eklendi'}, 
#                 status=status.HTTP_201_CREATED
#             )
            
#         except ValueError as e:
#             return Response(
#                 {'error': f'Geçersiz veri: {str(e)}'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         except PermissionError as e:
#             return Response(
#                 {'error': f'Erişim hatası: {str(e)}'}, 
#                 status=status.HTTP_403_FORBIDDEN
#             )
#         except Exception as e:
#             return Response(
#                 {'error': f'Sunucu hatası: {str(e)}'}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             ) 

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
            
            return Response(transactions)
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"İşlem getirilirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: İşlemler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
            
            return Response(investments)
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırımlar getirilirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: Yatırımlar getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
                {'id': investment_id, 'message': 'Yatırım başarıyla oluşturuldu'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yeni yatırım oluşturulurken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: Yatırım oluşturulamadı.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            
            return Response(transactions)
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım işlemleri getirilirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: İşlemler getirilemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
                {'id': transaction_id, 'message': 'Yatırım işlemi başarıyla eklendi'}, 
                status=status.HTTP_201_CREATED
            )
            
        except exceptions.PermissionDenied as e:
            return Response({'error': f'Erişim hatası: {str(e)}'}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            logger.error(f"Yatırım işlemi eklenirken beklenmedik hata: {e}")
            return Response({'error': 'Sunucu hatası: İşlem eklenemedi.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
