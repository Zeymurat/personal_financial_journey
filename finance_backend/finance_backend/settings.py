"""Django settings for finance_backend project."""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-default-key')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

APPEND_SLASH = False

# CORS settings - Bu kısmı tamamen değiştirin
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = None

# Bu satırları ekleyin:
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# CSRF ayarları - Bu kısmı güncelleyin
# CSRF ayarları
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',  # Frontend uygulamanızın adresi
    'http://127.0.0.1:5173',  # Eğer 127.0.0.1 kullanıyorsa
    'http://localhost:3000',  # Varsayılanlar
    'http://127.0.0.1:3000',  # Varsayılanlar
    'http://localhost:8000',
    'http://127.0.0.1:8000'
]

# Eğer API'niz CSRF token gerektirmiyorsa, bu satırı ekleyin:
CSRF_COOKIE_HTTPONLY = False


# Session ayarları
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Geliştirme ortamı için False, production'da True yapın

# CSRF cookie ayarları
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SECURE = False  # Geliştirme ortamı için False, production'da True yapın
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'
CSRF_COOKIE_NAME = 'csrftoken'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'users',
]

# settings.py

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # En üstte olmalı
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'finance_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Use PostgreSQL if DATABASE_URL is set
if os.getenv('DATABASE_URL'):
    import dj_database_url
    DATABASES['default'] = dj_database_url.config(default=os.getenv('DATABASE_URL'))

# Internationalization
LANGUAGE_CODE = 'tr-tr'
TIME_ZONE = 'Europe/Istanbul'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Custom User Model
AUTH_USER_MODEL = 'users.CustomUser'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    
    # Bu satırları tamamen kaldırın
    # 'USER_ID_FIELD': 'email',
    # 'USER_ID_CLAIM': 'user_email',
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
}

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Firebase Configuration
FIREBASE_CONFIG = {
    "apiKey": os.getenv("FIREBASE_API_KEY", ""),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", ""),
    "projectId": os.getenv("FIREBASE_PROJECT_ID", ""),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", ""),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", ""),
    "appId": os.getenv("FIREBASE_APP_ID", ""),
}

# Load Firebase credentials from JSON string in environment variable
FIREBASE_CREDENTIALS_JSON = os.getenv('FIREBASE_CREDENTIALS_JSON')
FIREBASE_CREDENTIALS = json.loads(FIREBASE_CREDENTIALS_JSON) if FIREBASE_CREDENTIALS_JSON else {}

# Initialize Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, firestore, auth

# Check if Firebase credentials are available
FIREBASE_CREDENTIALS_MISSING = not all([
    FIREBASE_CREDENTIALS.get("private_key"),
    FIREBASE_CREDENTIALS.get("client_email"),
    FIREBASE_CREDENTIALS.get("project_id")
])

if not FIREBASE_CREDENTIALS_MISSING and not firebase_admin._apps:
    try:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK başarıyla başlatıldı")
        FIRESTORE_DB = firestore.client()
    except Exception as e:
        print(f"❌ Firebase Admin SDK başlatılamadı: {e}")
        FIRESTORE_DB = None
else:
    if FIREBASE_CREDENTIALS_MISSING:
        print("⚠️  Firebase kimlik bilgileri eksik. Lütfen .env dosyanızı kontrol edin.")
    FIRESTORE_DB = None

# Security headers for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
