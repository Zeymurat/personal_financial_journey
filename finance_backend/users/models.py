# from django.db import models
# from django.contrib.auth.models import AbstractUser

# class CustomUser(AbstractUser):
#     # Firebase UID'sini saklamak için alan
#     firebase_uid = models.CharField(max_length=128, unique=True, null=True, blank=True)

#     # E-posta adresinin null olmasına izin veriyoruz ve benzersizliğini kaldırıyoruz
#     email = models.EmailField(unique=True, null=True)

    
#     # Ek kullanıcı alanları buraya eklenebilir
#     phone_number = models.CharField(max_length=20, blank=True, null=True)
#     profile_picture = models.URLField(blank=True, null=True)
    
#     def __str__(self):
#         return self.email or self.username

#     class Meta:
#         verbose_name = 'Kullanıcı'
#         verbose_name_plural = 'Kullanıcılar'


from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email adresi gereklidir')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    firebase_uid = models.CharField(max_length=128, unique=True, null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name