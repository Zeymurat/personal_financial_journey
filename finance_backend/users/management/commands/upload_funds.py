"""
Funds verilerini Firestore'a yükleyen Django management command
Usage: python manage.py upload_funds
"""
import json
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from firebase_admin import firestore
from typing import List, Dict


class Command(BaseCommand):
    help = 'Funds.json dosyasındaki verileri Firestore\'a yükler (users ile aynı seviyede funds collection)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='funds.json',
            help='Funds JSON dosyasının yolu (varsayılan: funds.json)',
        )

    def handle(self, *args, **options):
        file_path = options['file']
        
        if not settings.FIRESTORE_DB:
            self.stdout.write(
                self.style.ERROR('❌ Firestore veritabanı bağlantısı bulunamadı. Firebase kimlik bilgilerini kontrol edin.')
            )
            return

        # Dosya yolunu kontrol et
        if not os.path.exists(file_path):
            # Proje kök dizininde ara
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
            file_path = os.path.join(base_dir, 'funds.json')
            
            if not os.path.exists(file_path):
                self.stdout.write(
                    self.style.ERROR(f'❌ funds.json dosyası bulunamadı: {file_path}')
                )
                return

        self.stdout.write(f'📂 Dosya okunuyor: {file_path}')
        
        try:
            # JSON dosyasını oku
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # data.data array'ini al
            if isinstance(data, dict) and 'data' in data:
                funds_data = data['data']
            elif isinstance(data, list):
                funds_data = data
            else:
                self.stdout.write(
                    self.style.ERROR('❌ JSON formatı beklenmedik. "data" array\'i bulunamadı.')
                )
                return
            
            self.stdout.write(f'✅ {len(funds_data)} adet fund verisi okundu')
            
            db = settings.FIRESTORE_DB
            funds_ref = db.collection('funds')
            
            # Mevcut verileri kontrol et
            self.stdout.write('🔍 Mevcut funds verileri kontrol ediliyor...')
            existing_docs = funds_ref.stream()
            existing_keys = set()
            for doc in existing_docs:
                existing_keys.add(doc.id)
            
            if existing_keys:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Mevcut {len(existing_keys)} adet fund dokümanı bulundu. Sadece yeni veriler eklenecek.')
                )
            else:
                self.stdout.write('ℹ️  Mevcut fund dokümanı bulunamadı. Tüm veriler eklenecek.')
            
            # Verileri Firestore'a yaz
            self.stdout.write('📤 Funds verileri Firestore\'a yazılıyor...')
            
            batch = db.batch()
            total_count = 0
            success_count = 0
            error_count = 0
            
            for fund in funds_data:
                if not isinstance(fund, dict) or 'key' not in fund:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  Geçersiz fund formatı atlandı: {fund}')
                    )
                    error_count += 1
                    continue
                
                fund_key = fund.get('key', '').strip()
                fund_value = fund.get('value', '').strip()
                
                if not fund_key:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  Boş key değeri atlandı: {fund}')
                    )
                    error_count += 1
                    continue
                
                # Mevcut verileri atla (varsa)
                if fund_key in existing_keys:
                    skipped_count = getattr(self, '_skipped_count', 0)
                    self._skipped_count = skipped_count + 1
                    continue
                
                # Fund dokümanını oluştur (key = document ID)
                fund_doc_ref = funds_ref.document(fund_key)
                
                batch.set(fund_doc_ref, {
                    'key': fund_key,
                    'value': fund_value,
                    'created_at': firestore.SERVER_TIMESTAMP,
                })
                
                total_count += 1
                
                # Firestore batch limit: 500 operations
                if total_count % 500 == 0:
                    batch.commit()
                    batch = db.batch()
                    success_count += total_count
                    self.stdout.write(f'  ✅ {total_count} adet fund yazıldı (toplam: {success_count})')
                    total_count = 0
            
            # Kalan verileri commit et
            if total_count > 0:
                batch.commit()
                success_count += total_count
            
            skipped_count = getattr(self, '_skipped_count', 0)
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('=' * 60))
            self.stdout.write(self.style.SUCCESS(f'✅ Funds verileri başarıyla yüklendi!'))
            self.stdout.write(self.style.SUCCESS(f'   📊 Toplam: {len(funds_data)} adet'))
            self.stdout.write(self.style.SUCCESS(f'   ✅ Yeni eklenen: {success_count} adet'))
            if skipped_count > 0:
                self.stdout.write(self.style.WARNING(f'   ⏭️  Atlanan (mevcut): {skipped_count} adet'))
            if error_count > 0:
                self.stdout.write(self.style.WARNING(f'   ⚠️  Hatalı: {error_count} adet'))
            self.stdout.write(self.style.SUCCESS(f'   📁 Collection: funds'))
            self.stdout.write(self.style.SUCCESS('=' * 60))
            
        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f'❌ Dosya bulunamadı: {file_path}')
            )
        except json.JSONDecodeError as e:
            self.stdout.write(
                self.style.ERROR(f'❌ JSON parse hatası: {e}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Hata oluştu: {str(e)}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())

