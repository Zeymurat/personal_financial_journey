from django.urls import path, include

# Bu dosya, sadece projenin ana URL yönlendirmelerini içerir.
# Django'nun kendi veritabanı ve kimlik doğrulama sistemine ait
# herhangi bir import veya path içermez.
# Tüm kullanıcı ile ilgili URL'ler 'users' uygulamasına yönlendirilir.

urlpatterns = [
    # FirebaseLoginView'in bulunduğu 'users.urls' dosyasını dahil eder.
    path('api/auth/', include('users.urls')),
]
