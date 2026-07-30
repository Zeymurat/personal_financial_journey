"""
API hız sınırı — kötü niyetli / anon trafik için.

İlk parti istemciler (web + mobil) bu limite TAKILMAZ:
- Origin allowlist (localhost, finance.zeynelcmurat.com, Render, …)
- veya Authorization’lı istek + X-Finance-Client: web|ios|android|mobile

Anonim / bilinmeyen istemci: 100/dakika (UID veya IP).
"""

import os
from urllib.parse import urlparse

from rest_framework.throttling import SimpleRateThrottle


def _env_list(name: str, default: str = '') -> list:
    raw = os.getenv(name, default) or ''
    return [x.strip().rstrip('/') for x in raw.split(',') if x.strip()]


# Varsayılan trusted frontends — env ile genişletilir: TRUSTED_ORIGINS=...
_DEFAULT_TRUSTED_ORIGINS = (
    'http://localhost:5173,'
    'http://localhost:4173,'
    'http://127.0.0.1:5173,'
    'http://127.0.0.1:4173,'
    'https://finance.zeynelcmurat.com,'
    'https://www.finance.zeynelcmurat.com,'
    'https://personal-financial-journey.onrender.com'
)

_TRUSTED_CLIENTS = frozenset({'web', 'ios', 'android', 'mobile'})


def _origin_host(value: str) -> str:
    if not value:
        return ''
    try:
        parsed = urlparse(value)
        if parsed.scheme and parsed.netloc:
            return f'{parsed.scheme}://{parsed.netloc}'.rstrip('/')
    except Exception:
        pass
    return value.rstrip('/')


def is_trusted_first_party(request) -> bool:
    """Kendi web/mobil istemcimiz mi?"""
    trusted_origins = {
        _origin_host(o)
        for o in _env_list('TRUSTED_ORIGINS', _DEFAULT_TRUSTED_ORIGINS)
    }

    origin = _origin_host(request.META.get('HTTP_ORIGIN', ''))
    if origin and origin in trusted_origins:
        return True

    referer = _origin_host(request.META.get('HTTP_REFERER', ''))
    if referer and referer in trusted_origins:
        return True

    # Mobil (Origin yok) + giriş yapmış kullanıcı + istemci etiketi
    client = (request.META.get('HTTP_X_FINANCE_CLIENT') or '').strip().lower()
    user = getattr(request, 'user', None)
    authed = bool(
        user
        and getattr(user, 'is_authenticated', False)
        and hasattr(user, 'firebase_uid')
    )
    if authed and client in _TRUSTED_CLIENTS:
        return True

    return False


class GlobalRateThrottle(SimpleRateThrottle):
    scope = 'global'

    def allow_request(self, request, view):
        if request.method == 'OPTIONS':
            return True
        # Kendi uygulamalarımız (web/mobil) — 100/dk kotasına girmez
        if is_trusted_first_party(request):
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        user = request.user
        if getattr(user, 'is_authenticated', False) and hasattr(user, 'firebase_uid'):
            ident = user.firebase_uid
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
