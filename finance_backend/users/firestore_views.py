from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from firebase_admin import auth
from .firestore_service import firestore_service
import asyncio

class FirestoreTransactionView(APIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [permissions.IsAuthenticated]
    
    # def options(self, request, *args, **kwargs):
    #     """
    #     Handles CORS preflight requests by returning a 200 OK response.
    #     """
    #     response = Response(status=status.HTTP_200_OK)
    #     # These headers are handled by CorsMiddleware, but adding them manually 
    #     # ensures the response is correct even if the middleware fails.
    #     response['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    #     response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    #     response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
    #     response['Access-Control-Max-Age'] = '86400' 
    #     return response
    
    def get_user_firebase_uid(self, request):
        """Güvenli şekilde kullanıcının Firebase UID'sini al"""
        if not hasattr(request.user, 'firebase_uid') or not request.user.firebase_uid:
            raise ValueError('Firebase UID bulunamadı')
        return request.user.firebase_uid
    
    def validate_user_access(self, request, user_id=None):
        """Kullanıcının kendi verilerine erişim hakkını doğrula"""
        current_user_uid = self.get_user_firebase_uid(request)
        
        # Eğer belirli bir user_id isteniyorsa, sadece kendi verilerine erişebilir
        if user_id and user_id != current_user_uid:
            raise PermissionError('Bu veriye erişim yetkiniz yok')
        
        return current_user_uid
    
    def get(self, request):
        """Kullanıcının işlemlerini getir"""
        try:
            # Güvenli şekilde Firebase UID'yi al ve doğrula
            firebase_uid = self.validate_user_access(request)
            
            # Filtreleri al
            filters = {}
            if request.query_params.get('type'):
                filters['type'] = request.query_params.get('type')
            if request.query_params.get('category'):
                filters['category'] = request.query_params.get('category')
            
            # Firestore'dan işlemleri getir
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                transactions = loop.run_until_complete(
                    firestore_service.get_user_transactions(firebase_uid, filters)
                )
            finally:
                loop.close()
            
            return Response(transactions)
            
        except ValueError as e:
            return Response(
                {'error': f'Geçersiz veri: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': f'Erişim hatası: {str(e)}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Sunucu hatası: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Yeni işlem oluştur"""
        try:
            # Güvenli şekilde Firebase UID'yi al ve doğrula
            firebase_uid = self.validate_user_access(request)
            
            transaction_data = request.data
            required_fields = ['type', 'amount', 'category', 'description', 'date']
            
            for field in required_fields:
                if field not in transaction_data:
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Firestore'a kaydet
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
            
        except ValueError as e:
            return Response(
                {'error': f'Geçersiz veri: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': f'Erişim hatası: {str(e)}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Sunucu hatası: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FirestoreInvestmentView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_firebase_uid(self, request):
        """Güvenli şekilde kullanıcının Firebase UID'sini al"""
        if not hasattr(request.user, 'firebase_uid') or not request.user.firebase_uid:
            raise ValueError('Firebase UID bulunamadı')
        return request.user.firebase_uid
    
    def validate_user_access(self, request, user_id=None):
        """Kullanıcının kendi verilerine erişim hakkını doğrula"""
        current_user_uid = self.get_user_firebase_uid(request)
        
        # Eğer belirli bir user_id isteniyorsa, sadece kendi verilerine erişebilir
        if user_id and user_id != current_user_uid:
            raise PermissionError('Bu veriye erişim yetkiniz yok')
        
        return current_user_uid
    
    def get(self, request):
        """Kullanıcının yatırımlarını getir"""
        try:
            # Güvenli şekilde Firebase UID'yi al ve doğrula
            firebase_uid = self.validate_user_access(request)
            
            # Firestore'dan yatırımları getir
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                investments = loop.run_until_complete(
                    firestore_service.get_user_investments(firebase_uid)
                )
            finally:
                loop.close()
            
            return Response(investments)
            
        except ValueError as e:
            return Response(
                {'error': f'Geçersiz veri: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': f'Erişim hatası: {str(e)}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Sunucu hatası: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        """Yeni yatırım oluştur"""
        try:
            # Güvenli şekilde Firebase UID'yi al ve doğrula
            firebase_uid = self.validate_user_access(request)
            
            investment_data = request.data
            required_fields = ['symbol', 'name', 'type', 'quantity', 'averagePrice', 'currentPrice']
            
            for field in required_fields:
                if field not in investment_data:
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Hesaplamalar
            total_value = investment_data['quantity'] * investment_data['currentPrice']
            investment_data['totalValue'] = total_value
            investment_data['profitLoss'] = 0
            investment_data['profitLossPercentage'] = 0
            
            # Firestore'a kaydet
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
            
        except ValueError as e:
            return Response(
                {'error': f'Geçersiz veri: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': f'Erişim hatası: {str(e)}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Sunucu hatası: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FirestoreInvestmentTransactionView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_user_firebase_uid(self, request):
        """Güvenli şekilde kullanıcının Firebase UID'sini al"""
        if not hasattr(request.user, 'firebase_uid') or not request.user.firebase_uid:
            raise ValueError('Firebase UID bulunamadı')
        return request.user.firebase_uid
    
    def validate_user_access(self, request, user_id=None):
        """Kullanıcının kendi verilerine erişim hakkını doğrula"""
        current_user_uid = self.get_user_firebase_uid(request)
        
        # Eğer belirli bir user_id isteniyorsa, sadece kendi verilerine erişebilir
        if user_id and user_id != current_user_uid:
            raise PermissionError('Bu veriye erişim yetkiniz yok')
        
        return current_user_uid
    
    def get(self, request, investment_id):
        """Yatırım işlemlerini getir"""
        try:
            # Güvenli şekilde Firebase UID'yi al ve doğrula
            firebase_uid = self.validate_user_access(request)
            
            # Firestore'dan işlemleri getir
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                transactions = loop.run_until_complete(
                    firestore_service.get_investment_transactions(firebase_uid, investment_id)
                )
            finally:
                loop.close()
            
            return Response(transactions)
            
        except ValueError as e:
            return Response(
                {'error': f'Geçersiz veri: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': f'Erişim hatası: {str(e)}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Sunucu hatası: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, investment_id):
        """Yatırım işlemi ekle"""
        try:
            # Güvenli şekilde Firebase UID'yi al ve doğrula
            firebase_uid = self.validate_user_access(request)
            
            transaction_data = request.data
            required_fields = ['type', 'quantity', 'price', 'totalAmount', 'date']
            
            for field in required_fields:
                if field not in transaction_data:
                    return Response(
                        {'error': f'{field} alanı gerekli'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Firestore'a kaydet
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
            
        except ValueError as e:
            return Response(
                {'error': f'Geçersiz veri: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': f'Erişim hatası: {str(e)}'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {'error': f'Sunucu hatası: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 