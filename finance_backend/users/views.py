import json
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, UserCreateSerializer
from django.contrib.auth import get_user_model
from firebase_admin import auth
from django.conf import settings

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                return Response(status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class BlacklistTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class FirebaseLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        id_token = request.data.get('id_token')
        
        if not id_token:
            return Response(
                {'error': 'ID token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Firebase'den kullanıcı bilgilerini doğrula
            decoded_token = auth.verify_id_token(id_token)
            firebase_uid = decoded_token['uid']
            
            # Kullanıcıyı bul veya oluştur
            User = get_user_model()
            try:
                user = User.objects.get(firebase_uid=firebase_uid)
            except User.DoesNotExist:
                # Firebase'den kullanıcı bilgilerini al
                firebase_user = auth.get_user(firebase_uid)
                
                # Yeni kullanıcı oluştur
                user = User(
                    username=firebase_user.email or firebase_uid,
                    email=firebase_user.email,
                    firebase_uid=firebase_uid,
                    is_active=True
                )
                user.set_unusable_password()
                user.save()
            
            # JWT token oluştur
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
