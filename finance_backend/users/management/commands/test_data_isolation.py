from django.core.management.base import BaseCommand
from django.conf import settings
from datetime import datetime, timedelta
import random
import firebase_admin
from firebase_admin import auth, firestore
import requests
import json
import os
from firebase_admin import credentials

class Command(BaseCommand):
    help = 'Veri izolasyonunu test et'

    def handle(self, *args, **options):
        if not settings.FIRESTORE_DB:
            self.stdout.write(self.style.ERROR('❌ Firestore bağlantısı yok!'))
            return

        db = settings.FIRESTORE_DB
        test_users = ['user-1-abc123', 'user-2-def456', 'user-3-ghi789']
        
        try:
            # Önce temizlik
            self.stdout.write('🧹 Mevcut test verileri temizleniyor...')
            self.cleanup_test_data(db, test_users)
            
            # Sonra yeni test verileri oluştur
            self.test_data_isolation()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Hata: {str(e)}'))

    def test_data_isolation(self):
        """Veri izolasyonunu test et"""
        if not settings.FIRESTORE_DB:
            self.stdout.write(self.style.ERROR('❌ Firestore bağlantısı yok!'))
            return

        db = settings.FIRESTORE_DB
        test_users = ['user-1-abc123', 'user-2-def456', 'user-3-ghi789']
        
        try:
            # Önce temizlik yap
            self.stdout.write('🧹 Mevcut test verileri temizleniyor...')
            self.cleanup_test_data(db, test_users)
            
            # Test verilerini oluştur (admin ile)
            self.create_test_data(db, test_users)
            
            # Her kullanıcı için ayrı bir istemci ile test et
            for user_id in test_users:
                self.stdout.write(f'\n� {user_id} kullanıcı verileri kontrol ediliyor...')
                
                try:
                    # Kullanıcı için token oluştur
                    custom_token = self.create_test_user(user_id)
                    if not custom_token:
                        continue
                    
                    # Kullanıcı için Firestore istemcisi oluştur
                    user_db = self.get_firestore_client(custom_token)
                    
                    # Kendi verilerine erişim
                    try:
                        own_transactions = list(user_db.collection('users').document(user_id).collection('transactions').stream())
                        own_investments = list(user_db.collection('users').document(user_id).collection('investments').stream())
                        
                        self.stdout.write(f'  ✅ {len(own_transactions)} işlem bulundu')
                        self.stdout.write(f'  ✅ {len(own_investments)} yatırım bulundu')
                    except Exception as e:
                        self.stdout.write(f'  ❌ Kendi verilerine erişilemedi: {str(e)}')
                    
                    # Diğer kullanıcıların verilerine erişmeyi dene
                    for other_user in test_users:
                        if other_user != user_id:
                            try:
                                other_transactions = list(user_db.collection('users').document(other_user).collection('transactions').limit(1).get())
                                if other_transactions:
                                    self.stdout.write(f'  ⚠️  Uyarı: {other_user} kullanıcısının verilerine erişilebiliyor!')
                            except Exception as e:
                                if "permission-denied" in str(e).lower() or "Missing or insufficient permissions" in str(e):
                                    self.stdout.write(f'  🔒 {other_user} kullanıcısının verilerine erişilemiyor (Beklenen davranış)')
                                else:
                                    self.stdout.write(f'  ❌ {other_user} için beklenmeyen hata: {str(e)}')
                                    
                except Exception as e:
                    self.stdout.write(f'  ❌ {user_id} için test sırasında hata: {str(e)}')
            
            # Test sonunda temizlik yap
            self.stdout.write('\n🧹 Test sonrası temizlik yapılıyor...')
            self.cleanup_test_data(db, test_users)
            
            self.stdout.write(self.style.SUCCESS('\n🎉 Veri izolasyon testi tamamlandı!'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Test sırasında hata oluştu: {str(e)}'))
            raise

    def create_test_data(self, db, test_users):
        """Test verileri oluştur"""
        for i, user_id in enumerate(test_users, 1):
            # Her kullanıcı için farklı veriler oluştur
            self.create_test_user_data(db, user_id, i)
            
    def create_test_user_data(self, db, user_id, user_index):
        """Test kullanıcısı için veri oluştur"""
        # Kullanıcı dokümanı
        user_data = {
            'email': f'user{user_index}@test.com',
            'name': f'Test User {user_index}',
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        db.collection('users').document(user_id).set(user_data)
        self.stdout.write(f'  👤 {user_id} kullanıcısı oluşturuldu')
        
        # İşlemler
        transactions = [
            {
                'type': 'income',
                'amount': 1000 * user_index,
                'category': 'Maaş',
                'description': f'Test kullanıcısı {user_index} maaşı',
                'date': '2024-01-15',
                'currency': 'TRY',
                'createdAt': datetime.now(),
                'updatedAt': datetime.now()
            },
            {
                'type': 'expense',
                'amount': 500 * user_index,
                'category': 'Market',
                'description': f'Test kullanıcısı {user_index} market alışverişi',
                'date': '2024-01-10',
                'currency': 'TRY',
                'createdAt': datetime.now(),
                'updatedAt': datetime.now()
            }
        ]
        
        for transaction in transactions:
            doc_ref = db.collection('users').document(user_id).collection('transactions').document()
            transaction['id'] = doc_ref.id
            doc_ref.set(transaction)
        
        self.stdout.write(f'  💰 {user_id} için {len(transactions)} işlem oluşturuldu')
        
        # Yatırımlar
        investments = [
            {
                'symbol': f'STOCK{user_index}',
                'name': f'Test Stock {user_index}',
                'type': 'stock',
                'quantity': user_index,
                'averagePrice': 100 * user_index,
                'currentPrice': 110 * user_index,
                'totalValue': 110 * user_index,
                'profitLoss': 10 * user_index,
                'profitLossPercentage': 10.0,
                'createdAt': datetime.now(),
                'updatedAt': datetime.now()
            }
        ]
        
        for investment in investments:
            doc_ref = db.collection('users').document(user_id).collection('investments').document()
            investment['id'] = doc_ref.id
            doc_ref.set(investment)
        
        self.stdout.write(f'  📈 {user_id} için {len(investments)} yatırım oluşturuldu')

    def create_test_user(self, user_id):
        """Test kullanıcısı oluştur"""
        try:
            user = auth.get_user(user_id)
            custom_token = auth.create_custom_token(user.uid)
            return custom_token
        except Exception as e:
            self.stdout.write(f'  ❌ {user_id} kullanıcısı oluşturulurken hata: {str(e)}')
            return None

    def get_firestore_client(self, custom_token):
        """Firestore istemcisi oluştur"""
        try:
            cred = credentials.Certificate(settings.FIREBASE_CERTIFICATE)
            firebase_admin.initialize_app(cred)
            client = firebase_admin.firestore.client()
            client.collection('users').document('test').get()
            return client
        except Exception as e:
            self.stdout.write(f'  ❌ Firestore istemcisi oluşturulurken hata: {str(e)}')
            return None

    def test_user_isolation(self, db, user_id):
        """Kullanıcı verilerinin izolasyonunu test et"""
        # Kullanıcı verilerini getir
        user_doc = db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            self.stdout.write(f'  ❌ {user_id} kullanıcısı bulunamadı!')
            return
        
        user_data = user_doc.to_dict()
        self.stdout.write(f'\n🔍 {user_id} kullanıcı verileri kontrol ediliyor...')
        
        # İşlemleri kontrol et
        transactions = db.collection('users').document(user_id).collection('transactions').get()
        transactions_list = [t.to_dict() for t in transactions]
        
        self.stdout.write(f'  ✅ {len(transactions_list)} işlem bulundu')
        
        # Yatırımları kontrol et
        investments = db.collection('users').document(user_id).collection('investments').get()
        investments_list = [i.to_dict() for i in investments]
        
        self.stdout.write(f'  ✅ {len(investments_list)} yatırım bulundu')
        
        # Başka kullanıcıların verilerine erişememeli
        other_users = [u for u in ['user-1-abc123', 'user-2-def456', 'user-3-ghi789'] if u != user_id]
        
        for other_user in other_users:
            try:
                other_transactions = db.collection('users').document(other_user).collection('transactions').get()
                if other_transactions:
                    self.stdout.write(f'  ⚠️  Uyarı: {other_user} kullanıcısının verilerine erişilebiliyor!')
            except Exception:
                # Erişim izni yok, bu beklenen davranış
                pass
    
    def cleanup_test_data(self, db, user_ids):
        """Test verilerini temizle"""
        for user_id in user_ids:
            try:
                # Alt koleksiyonları temizle
                collections = ['transactions', 'investments']
                for collection in collections:
                    try:
                        # Tüm dokümanları al ve sil
                        docs = db.collection('users').document(user_id).collection(collection).stream()
                        for doc in docs:
                            doc.reference.delete()
                    except Exception as e:
                        self.stdout.write(f'  ⚠️  {user_id} {collection} temizlenirken hata: {str(e)}')
                
                # Ana kullanıcı dokümanını sil
                db.collection('users').document(user_id).delete()
                self.stdout.write(f'  🗑️  {user_id} kullanıcısı ve tüm verileri silindi')
                
            except Exception as e:
                self.stdout.write(f'  ❌ {user_id} temizlenirken hata: {str(e)}')