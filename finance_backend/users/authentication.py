from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from firebase_admin import auth, initialize_app, credentials
import logging
from django.conf import settings
import os

logger = logging.getLogger(__name__)

# Django REST Framework'te kullanılan özel bir kullanıcı sınıfı.
# Basitçe kullanıcı UID'sini taşımak için kullanılır.
class FirebaseUser:
    """
    DRF'in request.user alanına atanan özel kullanıcı nesnesi.
    Firebase kimlik doğrulamasından sonra kullanıcının UID'sini taşır.
    """
    def __init__(self, firebase_uid):
        self.firebase_uid = firebase_uid
        
    @property
    def is_authenticated(self):
        # DRF'in IsAuthenticated kontrolü için gereklidir.
        return True
    
    # İsteğe bağlı, ancak DRF debug barları vb. için yardımcı olur
    def __str__(self):
        return self.firebase_uid

class FirebaseAuthentication(BaseAuthentication):
    """
    HTTP Authorization başlığındaki Firebase ID Token'ı doğrulayan özel
    REST Framework kimlik doğrulama sınıfı.
    """

    def authenticate(self, request):
        """
        Token'ı çıkarır, Firebase ile doğrular ve FirebaseUser nesnesi döndürür.
        """
        # 1. Authorization Başlığını Al
        auth_header = request.headers.get('Authorization')
        logger.info(f"🔍 Authorization header: {auth_header}")

        if not auth_header:
            # Token yoksa anonim kullanıcı kabul et (veya None döndür)
            logger.warning("❌ Authorization header bulunamadı")
            return None

        # Authorization formatı: "Bearer <token>"
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != 'bearer':
                # Token tipimiz Bearer değilse
                logger.warning(f"❌ Geçersiz scheme: {scheme}")
                return None
        except ValueError:
            # Başlık doğru formatta değilse
            logger.error("❌ Authorization header geçersiz formatta")
            raise exceptions.AuthenticationFailed('Kimlik doğrulama başlığı geçersiz formatta.')

        id_token = token
        logger.info(f"🔍 Token alındı: {id_token[:50]}...")

        # 2. Token'ı Firebase ile Doğrula
        try:
            # verify_id_token metodu token'ı kontrol eder ve çözer (decode)
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token.get('uid')
            
            if not uid:
                 # Token geçerli ama UID yoksa (olası değil ama kontrol et)
                logger.error("❌ Token geçerli ama UID bulunamadı")
                raise exceptions.AuthenticationFailed('Token geçerli, ancak kullanıcı UID bulunamadı.')

            # 3. Başarılı Kimlik Doğrulama
            logger.info(f"✅ Token doğrulandı, UID: {uid}")
            # request.user ve request.auth için tuple döndürülmeli. 
            # auth (ikinci eleman) burada kullanılmadığı için None döndürüyoruz.
            user = FirebaseUser(firebase_uid=uid)
            return (user, None)

        except exceptions.AuthenticationFailed as e:
            # AuthenticationFailed zaten fırlatıldığı için tekrar fırlat
            logger.error(f"❌ Authentication failed: {e}")
            raise e
        except Exception as e:
            # Token geçersizse, süresi dolmuşsa veya Firebase hatası varsa
            logger.error(f"❌ Firebase Token Doğrulama Hatası: {e}")
            raise exceptions.AuthenticationFailed('Kimlik doğrulama başarısız. Token geçersiz veya süresi dolmuş.')
