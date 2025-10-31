from django.core.management.base import BaseCommand
from django.conf import settings
import json
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Mock dataları Firestore veritabanına gönder'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=str,
            help='Firebase user ID (opsiyonel)',
        )

    def handle(self, *args, **options):
        if not settings.FIRESTORE_DB:
            self.stdout.write(
                self.style.ERROR('❌ Firestore veritabanı bağlantısı bulunamadı!')
            )
            return

        user_id = options['user_id'] or 'demo-user-123'
        
        self.stdout.write(f'🚀 Mock datalar {user_id} kullanıcısı için Firestore\'a gönderiliyor...')
        
        # Sync fonksiyonu çalıştır
        self.seed_data(user_id)

    def seed_data(self, user_id):
        """Mock dataları Firestore'a gönder"""
        db = settings.FIRESTORE_DB
        
        # Mock transactions
        mock_transactions = [
            {
                'type': 'income',
                'amount': 15000,
                'category': 'Maaş',
                'description': 'Aylık maaş',
                'date': '2024-01-15',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 3500,
                'category': 'Kira',
                'description': 'Aylık kira ödemesi',
                'date': '2024-01-05',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 1200,
                'category': 'Market',
                'description': 'Aylık market alışverişi',
                'date': '2024-01-10',
                'currency': 'TRY'
            },
            {
                'type': 'income',
                'amount': 2500,
                'category': 'Freelance',
                'description': 'Web projesi ödemesi',
                'date': '2024-01-20',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 850,
                'category': 'Ulaşım',
                'description': 'Aylık ulaşım gideri',
                'date': '2024-01-08',
                'currency': 'TRY'
            },
            {
                'type': 'income',
                'amount': 800,
                'category': 'Bonus',
                'description': 'Performans bonusu',
                'date': '2024-01-25',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 450,
                'category': 'Eğlence',
                'description': 'Sinema ve yemek',
                'date': '2024-01-12',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 300,
                'category': 'Sağlık',
                'description': 'İlaç ve doktor',
                'date': '2024-01-18',
                'currency': 'TRY'
            }
        ]

        # Eylül 2025 için mock transactions (9. ay - geçen ay karşılaştırması için)
        september_2025_transactions = [
            {
                'type': 'income',
                'amount': 14500,
                'category': 'Maaş',
                'description': 'Eylül maaşı',
                'date': '2025-09-15',
                'currency': 'TRY'
            },
            {
                'type': 'income',
                'amount': 2200,
                'category': 'Freelance',
                'description': 'Eylül freelance projesi',
                'date': '2025-09-20',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 3500,
                'category': 'Kira',
                'description': 'Eylül kira ödemesi',
                'date': '2025-09-05',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 1350,
                'category': 'Market',
                'description': 'Eylül market alışverişi',
                'date': '2025-09-10',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 950,
                'category': 'Ulaşım',
                'description': 'Eylül ulaşım gideri',
                'date': '2025-09-08',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 650,
                'category': 'Eğlence',
                'description': 'Eylül sinema ve eğlence',
                'date': '2025-09-12',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 400,
                'category': 'Sağlık',
                'description': 'Eylül sağlık giderleri',
                'date': '2025-09-18',
                'currency': 'TRY'
            },
            {
                'type': 'expense',
                'amount': 1200,
                'category': 'Teknoloji',
                'description': 'Eylül teknoloji alışverişi',
                'date': '2025-09-22',
                'currency': 'TRY'
            }
        ]

        # Mock investments
        mock_investments = [
            {
                'symbol': 'AAPL',
                'name': 'Apple Inc.',
                'type': 'stock',
                'quantity': 10,
                'averagePrice': 150,
                'currentPrice': 175,
                'totalValue': 1750,
                'profitLoss': 250,
                'profitLossPercentage': 16.67
            },
            {
                'symbol': 'BTC',
                'name': 'Bitcoin',
                'type': 'crypto',
                'quantity': 0.5,
                'averagePrice': 45000,
                'currentPrice': 52000,
                'totalValue': 26000,
                'profitLoss': 3500,
                'profitLossPercentage': 15.56
            },
            {
                'symbol': 'GOOGL',
                'name': 'Alphabet Inc.',
                'type': 'stock',
                'quantity': 5,
                'averagePrice': 2800,
                'currentPrice': 2950,
                'totalValue': 14750,
                'profitLoss': 750,
                'profitLossPercentage': 5.36
            }
        ]

        # Mock investment transactions
        mock_investment_transactions = {
            'AAPL': [
                {
                    'type': 'buy',
                    'quantity': 5,
                    'price': 140,
                    'totalAmount': 700,
                    'date': '2023-10-15',
                    'fees': 5
                },
                {
                    'type': 'buy',
                    'quantity': 3,
                    'price': 155,
                    'totalAmount': 465,
                    'date': '2023-11-20',
                    'fees': 3
                },
                {
                    'type': 'buy',
                    'quantity': 2,
                    'price': 160,
                    'totalAmount': 320,
                    'date': '2023-12-10',
                    'fees': 2
                }
            ],
            'BTC': [
                {
                    'type': 'buy',
                    'quantity': 0.2,
                    'price': 42000,
                    'totalAmount': 8400,
                    'date': '2023-09-05',
                    'fees': 25
                },
                {
                    'type': 'buy',
                    'quantity': 0.3,
                    'price': 48000,
                    'totalAmount': 14400,
                    'date': '2023-11-15',
                    'fees': 35
                }
            ],
            'GOOGL': [
                {
                    'type': 'buy',
                    'quantity': 3,
                    'price': 2750,
                    'totalAmount': 8250,
                    'date': '2023-10-25',
                    'fees': 15
                },
                {
                    'type': 'buy',
                    'quantity': 2,
                    'price': 2850,
                    'totalAmount': 5700,
                    'date': '2023-12-05',
                    'fees': 10
                }
            ]
        }

        try:
            # Transactions ekle
            self.stdout.write('📊 Transactions ekleniyor...')
            for transaction_data in mock_transactions:
                doc_ref = db.collection('users').document(user_id).collection('transactions').document()
                transaction_data['id'] = doc_ref.id
                transaction_data['createdAt'] = datetime.now()
                transaction_data['updatedAt'] = datetime.now()
                
                doc_ref.set(transaction_data)
                self.stdout.write(f'  ✅ {transaction_data["description"]} eklendi')
            
            # Eylül 2025 transactions ekle (9. ay - geçen ay karşılaştırması için)
            self.stdout.write('📊 Eylül 2025 transactions ekleniyor...')
            for transaction_data in september_2025_transactions:
                doc_ref = db.collection('users').document(user_id).collection('transactions').document()
                transaction_data['id'] = doc_ref.id
                transaction_data['createdAt'] = datetime.now()
                transaction_data['updatedAt'] = datetime.now()
                
                doc_ref.set(transaction_data)
                self.stdout.write(f'  ✅ {transaction_data["description"]} eklendi')

            # Investments ekle
            self.stdout.write('📈 Investments ekleniyor...')
            for investment_data in mock_investments:
                doc_ref = db.collection('users').document(user_id).collection('investments').document()
                investment_data['id'] = doc_ref.id
                investment_data['transactions'] = []
                investment_data['createdAt'] = datetime.now()
                investment_data['updatedAt'] = datetime.now()
                
                doc_ref.set(investment_data)
                self.stdout.write(f'  ✅ {investment_data["symbol"]} ({investment_data["name"]}) eklendi')

                # Investment transactions ekle
                if investment_data['symbol'] in mock_investment_transactions:
                    for trans_data in mock_investment_transactions[investment_data['symbol']]:
                        trans_doc_ref = doc_ref.collection('transactions').document()
                        trans_data['id'] = trans_doc_ref.id
                        trans_data['createdAt'] = datetime.now()
                        
                        trans_doc_ref.set(trans_data)
                        self.stdout.write(f'    📝 {trans_data["type"]} işlemi eklendi')

            self.stdout.write(
                self.style.SUCCESS(f'🎉 Tüm mock datalar başarıyla {user_id} kullanıcısı için Firestore\'a gönderildi!')
            )
            
            # Özet bilgi
            total_income = sum(t['amount'] for t in mock_transactions if t['type'] == 'income')
            total_expense = sum(t['amount'] for t in mock_transactions if t['type'] == 'expense')
            net_income = total_income - total_expense
            
            sept_income = sum(t['amount'] for t in september_2025_transactions if t['type'] == 'income')
            sept_expense = sum(t['amount'] for t in september_2025_transactions if t['type'] == 'expense')
            sept_net = sept_income - sept_expense
            
            self.stdout.write(f'\n📊 Özet:')
            self.stdout.write(f'  📅 Ocak 2024 Transactions:')
            self.stdout.write(f'    💰 Toplam Gelir: ₺{total_income:,}')
            self.stdout.write(f'    💸 Toplam Gider: ₺{total_expense:,}')
            self.stdout.write(f'    📈 Net Gelir: ₺{net_income:,}')
            self.stdout.write(f'\n  📅 Eylül 2025 Transactions (9. ay):')
            self.stdout.write(f'    💰 Toplam Gelir: ₺{sept_income:,}')
            self.stdout.write(f'    💸 Toplam Gider: ₺{sept_expense:,}')
            self.stdout.write(f'    📈 Net Gelir: ₺{sept_net:,}')
            self.stdout.write(f'\n  📊 Toplam İşlem: {len(mock_transactions) + len(september_2025_transactions)}')
            self.stdout.write(f'  📈 Toplam Yatırım: {len(mock_investments)}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Hata oluştu: {str(e)}')
            ) 