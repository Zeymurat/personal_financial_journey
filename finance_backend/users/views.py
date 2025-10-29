from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from firebase_admin import auth, exceptions
import logging

# Logger'ı tanımlayın
logger = logging.getLogger(__name__)

class FirebaseLoginView(APIView):
    """
    Firebase Authentication ID Token'ı doğrulayan API view'ı.
    Bu view, Django'nun veritabanı sistemini tamamen bypass eder.
    """
    def post(self, request):
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response(
                {"error": "ID Token sağlanmadı."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            email = decoded_token['email']
            
            logger.info(f"✅ Kullanıcı başarıyla doğrulandı: {email} (UID: {uid})")
            
            # Frontend'in beklediği format: access ve refresh token'ları
            # Firebase ID Token'ı hem access hem refresh olarak kullanıyoruz
            return Response(
                {
                    "message": "Giriş başarılı", 
                    "uid": uid, 
                    "email": email,
                    "access": id_token,  # Firebase ID Token'ı access token olarak döndür
                    "refresh": id_token  # Aynı token'ı refresh olarak da döndür
                },
                status=status.HTTP_200_OK
            )
        except exceptions.AuthError as e:
            logger.error(f"❌ Firebase ID Token doğrulama hatası: {e}")
            return Response(
                {"error": "Geçersiz ID Token."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error(f"❌ Genel hata: {e}")
            return Response(
                {"error": "Sunucu hatası."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )