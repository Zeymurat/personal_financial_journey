from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # Firebase UID'sini saklamak için alan
    firebase_uid = models.CharField(max_length=128, unique=True, null=True, blank=True)
    
    # Ek kullanıcı alanları buraya eklenebilir
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.email or self.username

    class Meta:
        verbose_name = 'Kullanıcı'
        verbose_name_plural = 'Kullanıcılar'
