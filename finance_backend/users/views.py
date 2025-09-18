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
            return Response({'error': 'ID token is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_token = auth.verify_id_token(id_token)
            firebase_uid = decoded_token['uid']
            
            User = get_user_model()
            try:
                user = User.objects.get(firebase_uid=firebase_uid)
                print("Mevcut kullanıcı bulundu: ", user.email)
            except User.DoesNotExist:
                print("Yeni kullanıcı oluşturuluyor...")
                firebase_user_info = auth.get_user(firebase_uid)
                user = User.objects.create_user(
                    email=firebase_user_info.email or f"{firebase_uid}@temp.com",
                    firebase_uid=firebase_uid,
                )
                
                if firebase_user_info.display_name:
                    user.username = firebase_user_info.display_name
                else:
                    user.username = firebase_uid
                    
                user.is_active = True
                user.save()
                print("Yeni kullanıcı oluşturuldu: ", user.email)

            # Debug: Kullanıcı bilgilerini yazdır
            print(f"User ID: {user.id}, type: {type(user.id)}")
            print(f"User email: {user.email}, type: {type(user.email)}")
            print(f"User pk: {user.pk}, type: {type(user.pk)}")
            
            # JWT Token oluşturmayı try-catch içine al
            try:
                print("RefreshToken oluşturuluyor...")
                refresh = RefreshToken.for_user(user)
                print("RefreshToken başarıyla oluşturuldu")
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'username': user.username,
                    }
                }, status=status.HTTP_200_OK)
                
            except Exception as token_error:
                print(f"JWT Token oluşturma hatası: {token_error}")
                print(f"Token error traceback: {traceback.format_exc()}")
                raise token_error

        except auth.InvalidIdTokenError:
            return Response({'error': 'Geçersiz Firebase kimlik belirteci.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Genel sunucu hatası: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response({'error': f"Sunucu hatası: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# class FirebaseLoginView(APIView):
#     permission_classes = [permissions.AllowAny]
    
#     def post(self, request):
#         id_token = request.data.get('id_token')
        
#         if not id_token:
#             return Response(
#                 {'error': 'ID token is required'}, 
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             # Firebase'den kullanıcı bilgilerini doğrula
#             decoded_token = auth.verify_id_token(id_token)
#             firebase_uid = decoded_token['uid']
            
#             # Kullanıcıyı bul veya oluştur
#             User = get_user_model()
#             print("Firebase UID: ", firebase_uid)
#             print("User",User.objects.all())
#             try:
#                 user = User.objects.get(firebase_uid=firebase_uid)
#             except User.DoesNotExist:
#                 # Firebase'den kullanıcı bilgilerini al
#                 firebase_user = auth.get_user(firebase_uid)
                
#                 # Yeni kullanıcı oluştur
#                 user = User(
#                     username=firebase_user.email or firebase_uid,
#                     email=firebase_user.email,
#                     firebase_uid=firebase_uid,
#                     is_active=True
#                 )
#                 user.set_unusable_password()
#                 user.save()
            
#             # JWT token oluştur
#             refresh = RefreshToken.for_user(user)
            
#             return Response({
#                 'refresh': str(refresh),
#                 'access': str(refresh.access_token),
#                 'user': UserSerializer(user).data
#             })
            
#         except Exception as e:
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
