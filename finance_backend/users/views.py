from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from firebase_admin import auth, exceptions
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class FirebaseLoginView(APIView):
    """
    Firebase ID Token doğrulama (stateless).
    Access = doğrulanmış Firebase ID token.
    Ayrı bir JWT refresh yok; istemci getIdToken() ile yeniler.
    """
    authentication_classes: list = []
    permission_classes = [AllowAny]

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
            email = decoded_token.get('email')

            logger.info("Kullanıcı doğrulandı: uid=%s", uid)

            return Response(
                {
                    "message": "Giriş başarılı",
                    "uid": uid,
                    "email": email,
                    "access": id_token,
                },
                status=status.HTTP_200_OK
            )
        except exceptions.AuthError as e:
            logger.error("Firebase ID Token doğrulama hatası: %s", e)
            return Response(
                {"error": "Geçersiz ID Token."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            logger.error("Firebase login genel hata: %s", e)
            return Response(
                {"error": "Sunucu hatası."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
