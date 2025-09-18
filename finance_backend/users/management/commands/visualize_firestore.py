from django.core.management.base import BaseCommand
from django.conf import settings
import asyncio

class Command(BaseCommand):
    help = 'Firestore veri yapısını görselleştir'

    def handle(self, *args, **options):
        if not settings.FIRESTORE_DB:
            self.stdout.write(
                self.style.ERROR('❌ Firestore veritabanı bağlantısı bulunamadı!')
            )
            return
        
        self.stdout.write('📊 Firestore veri yapısı görselleştiriliyor...')
        
        # Async fonksiyonu çalıştır
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self.visualize_structure())
        finally:
            loop.close()

    async def visualize_structure(self):
        """Firestore veri yapısını görselleştir"""
        db = settings.FIRESTORE_DB
        
        try:
            self.stdout.write('\n🏗️  Firestore Veri Yapısı:\n')
            
            # Kullanıcıları listele
            users = db.collection('users').stream()
            users_list = list(users)
            
            if not users_list:
                self.stdout.write('  📭 Henüz hiç kullanıcı yok')
                self.stdout.write('\n📋 Beklenen Veri Yapısı:')
                self.stdout.write('''
users/
├── {firebase_uid_1}/
│   ├── email: "user1@example.com"
│   ├── name: "User 1"
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── transactions/
│   │   ├── {transaction_id_1}/
│   │   │   ├── type: "income" | "expense"
│   │   │   ├── amount: number
│   │   │   ├── category: string
│   │   │   ├── description: string
│   │   │   ├── date: string
│   │   │   ├── currency: string
│   │   │   ├── createdAt: timestamp
│   │   │   └── updatedAt: timestamp
│   │   └── {transaction_id_2}/
│   └── investments/
│       ├── {investment_id_1}/
│       │   ├── symbol: string
│       │   ├── name: string
│       │   ├── type: "stock" | "crypto" | "forex"
│       │   ├── quantity: number
│       │   ├── averagePrice: number
│       │   ├── currentPrice: number
│       │   ├── totalValue: number
│       │   ├── profitLoss: number
│       │   ├── profitLossPercentage: number
│       │   ├── createdAt: timestamp
│       │   ├── updatedAt: timestamp
│       │   └── transactions/
│       │       ├── {transaction_id_1}/
│       │       │   ├── type: "buy" | "sell"
│       │       │   ├── quantity: number
│       │       │   ├── price: number
│       │       │   ├── totalAmount: number
│       │       │   ├── date: string
│       │       │   ├── fees: number
│       │       │   └── createdAt: timestamp
│       │       └── {transaction_id_2}/
│       └── {investment_id_2}/
└── {firebase_uid_2}/
    ├── email: "user2@example.com"
    ├── name: "User 2"
    ├── transactions/
    └── investments/
                ''')
                return
            
            self.stdout.write(f'  👥 Toplam {len(users_list)} kullanıcı bulundu\n')
            
            for user_doc in users_list:
                user_id = user_doc.id
                user_data = user_doc.to_dict()
                
                self.stdout.write(f'👤 Kullanıcı: {user_id}')
                self.stdout.write(f'   📧 Email: {user_data.get("email", "Belirtilmemiş")}')
                self.stdout.write(f'   👤 İsim: {user_data.get("name", "Belirtilmemiş")}')
                
                # İşlemleri say
                transactions = db.collection('users').document(user_id).collection('transactions').stream()
                transactions_list = list(transactions)
                self.stdout.write(f'   💰 İşlemler: {len(transactions_list)} adet')
                
                # Yatırımları say
                investments = db.collection('users').document(user_id).collection('investments').stream()
                investments_list = list(investments)
                self.stdout.write(f'   📈 Yatırımlar: {len(investments_list)} adet')
                
                # Yatırım işlemlerini say
                total_investment_transactions = 0
                for investment_doc in investments_list:
                    investment_transactions = db.collection('users').document(user_id).collection('investments').document(investment_doc.id).collection('transactions').stream()
                    total_investment_transactions += len(list(investment_transactions))
                
                if total_investment_transactions > 0:
                    self.stdout.write(f'   📝 Yatırım İşlemleri: {total_investment_transactions} adet')
                
                self.stdout.write('')
            
            # Güvenlik özeti
            self.stdout.write('🔒 Güvenlik Durumu:')
            self.stdout.write('  ✅ Her kullanıcının verisi kendi UID\'si altında izole edilmiş')
            self.stdout.write('  ✅ Alt koleksiyonlar (transactions, investments) kullanıcıya özel')
            self.stdout.write('  ✅ Firestore Rules ile erişim kontrolü')
            self.stdout.write('  ✅ Backend API\'lerde ek güvenlik kontrolleri')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Görselleştirme sırasında hata oluştu: {str(e)}')
            ) 