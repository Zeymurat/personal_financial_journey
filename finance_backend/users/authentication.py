from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)


class FirebaseUser:
    """
    DRF request.user — yalnızca firebase_uid taşır (Interface Segregation).
    """

    def __init__(self, firebase_uid):
        self.firebase_uid = firebase_uid

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return self.firebase_uid


class FirebaseAuthentication(BaseAuthentication):
    """
    Authorization: Bearer <Firebase ID Token>
    Big-O: O(1) parse + 1 verify çağrısı (Firebase); token boyutu sabit üst sınırlı.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return None

        try:
            scheme, token = auth_header.split()
            if scheme.lower() != 'bearer':
                return None
        except ValueError:
            raise exceptions.AuthenticationFailed(
                'Kimlik doğrulama başlığı geçersiz formatta.'
            )

        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get('uid')

            if not uid:
                raise exceptions.AuthenticationFailed(
                    'Token geçerli, ancak kullanıcı UID bulunamadı.'
                )

            return (FirebaseUser(firebase_uid=uid), None)

        except exceptions.AuthenticationFailed:
            raise
        except Exception as e:
            # Token içeriğini loglama (güvenlik)
            logger.warning("Firebase token doğrulama başarısız: %s", type(e).__name__)
            raise exceptions.AuthenticationFailed(
                'Kimlik doğrulama başarısız. Token geçersiz veya süresi dolmuş.'
            )
