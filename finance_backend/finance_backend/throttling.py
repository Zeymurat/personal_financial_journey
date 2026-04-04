"""
Tüm API için varsayılan hız sınırı (DRF SimpleRateThrottle).

Kimlik doğrulaması yoksa IP; Firebase ile giriş yapılmışsa firebase_uid anahtarı kullanılır.
CORS ön kontrolü (OPTIONS) sayıma dahil edilmez.
"""

from rest_framework.throttling import SimpleRateThrottle


class GlobalRateThrottle(SimpleRateThrottle):
    scope = 'global'

    def allow_request(self, request, view):
        if request.method == 'OPTIONS':
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        user = request.user
        if getattr(user, 'is_authenticated', False) and hasattr(user, 'firebase_uid'):
            ident = user.firebase_uid
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}
