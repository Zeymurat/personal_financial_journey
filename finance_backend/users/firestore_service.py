from firebase_admin import firestore
from django.conf import settings
from typing import Dict, List, Optional, Any
import json
import logging

logger = logging.getLogger(__name__)

class FirestoreService:
    def __init__(self):
        self.db = settings.FIRESTORE_DB
        if not self.db:
            print("⚠️  Firestore veritabanı bağlantısı bulunamadı. Firebase kimlik bilgilerini kontrol edin.")
            # Don't raise exception here, let individual methods handle it
    
    def get_user_doc(self, user_id: str):
        """Kullanıcı dokümanını getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        return self.db.collection('users').document(user_id)
    
    def get_user_transactions_ref(self, user_id: str):
        """Kullanıcının işlemler koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('transactions')
    
    def get_user_investments_ref(self, user_id: str):
        """Kullanıcının yatırımlar koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('investments')
    
    def get_user_investment_transactions_ref(self, user_id: str, investment_id: str):
        """Kullanıcının belirli yatırımının işlemlerini getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        if not investment_id or not isinstance(investment_id, str):
            raise ValueError('Geçersiz investment_id')
        return self.db.collection('users').document(user_id).collection('investments').document(investment_id).collection('transactions')
    
    def get_user_quick_transactions_ref(self, user_id: str):
        """Kullanıcının hızlı işlemler koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('quickTransactions')
    
    def get_user_quick_investments_ref(self, user_id: str):
        """Kullanıcının hızlı yatırımlar koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('quickInvestments')
    
    # Transaction işlemleri
    async def create_transaction(self, user_id: str, transaction_data: Dict[str, Any]) -> str:
        """Yeni işlem oluştur"""
        doc_ref = self.get_user_transactions_ref(user_id).document()
        transaction_data['id'] = doc_ref.id
        transaction_data['createdAt'] = firestore.SERVER_TIMESTAMP
        transaction_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.set(transaction_data)
        
        # Transaction oluşturulduktan sonra bildirim kontrolü yap
        try:
            await self._check_transaction_notifications(user_id, transaction_data)
        except Exception as e:
            # Bildirim hatası transaction oluşturmayı engellemesin
            logger.error(f"Bildirim kontrolü yapılırken hata: {e}", exc_info=True)
        
        return doc_ref.id
    
    async def get_user_transactions(self, user_id: str, filters: Optional[Dict] = None) -> List[Dict]:
        """Kullanıcının işlemlerini getir"""
        query = self.get_user_transactions_ref(user_id).order_by('date', direction=firestore.Query.DESCENDING)
        
        if filters:
            if filters.get('type'):
                query = query.where('type', '==', filters['type'])
            if filters.get('category'):
                query = query.where('category', '==', filters['category'])
        
        docs = query.stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    async def update_transaction(self, user_id: str, transaction_id: str, updates: Dict[str, Any]) -> bool:
        """İşlem güncelle"""
        doc_ref = self.get_user_transactions_ref(user_id).document(transaction_id)
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(updates)
        return True
    
    async def delete_transaction(self, user_id: str, transaction_id: str) -> bool:
        """İşlem sil"""
        doc_ref = self.get_user_transactions_ref(user_id).document(transaction_id)
        doc_ref.delete()
        return True
    
    # Investment işlemleri
    async def create_investment(self, user_id: str, investment_data: Dict[str, Any]) -> str:
        """Yeni yatırım oluştur"""
        doc_ref = self.get_user_investments_ref(user_id).document()
        investment_data['id'] = doc_ref.id
        investment_data['transactions'] = []
        investment_data['createdAt'] = firestore.SERVER_TIMESTAMP
        investment_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.set(investment_data)
        return doc_ref.id
    
    async def get_user_investments(self, user_id: str) -> List[Dict]:
        """Kullanıcının yatırımlarını getir"""
        docs = self.get_user_investments_ref(user_id).stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    async def update_investment(self, user_id: str, investment_id: str, updates: Dict[str, Any]) -> bool:
        """Yatırım güncelle"""
        doc_ref = self.get_user_investments_ref(user_id).document(investment_id)
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(updates)
        return True
    
    async def delete_investment(self, user_id: str, investment_id: str) -> bool:
        """Yatırım sil"""
        doc_ref = self.get_user_investments_ref(user_id).document(investment_id)
        doc_ref.delete()
        return True
    
    # Investment transaction işlemleri
    async def add_investment_transaction(self, user_id: str, investment_id: str, transaction_data: Dict[str, Any]) -> str:
        """Yatırım işlemi ekle ve investment stats'ı güncelle"""
        try:
            doc_ref = self.get_user_investment_transactions_ref(user_id, investment_id).document()
            transaction_data['id'] = doc_ref.id
            transaction_data['createdAt'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.set(transaction_data)
            
            # Investment stats'ı güncelle (hata olsa bile transaction eklenmiş olur)
            try:
                await self._update_investment_stats(user_id, investment_id)
            except Exception as stats_error:
                # Stats güncelleme hatası transaction eklenmesini engellemesin
                logger.error(f"Investment stats güncellenirken hata (transaction eklendi): {stats_error}", exc_info=True)
            
            return doc_ref.id
        except Exception as e:
            logger.error(f"Investment transaction eklenirken hata: {e}", exc_info=True)
            raise
    
    async def _update_investment_stats(self, user_id: str, investment_id: str):
        """Investment istatistiklerini güncelle (quantity, averagePrice, totalValue, profitLoss, etc.)"""
        try:
            # Tüm transaction'ları getir
            transactions = await self.get_investment_transactions(user_id, investment_id)
            
            # Investment'ı getir
            investment_ref = self.get_user_investments_ref(user_id).document(investment_id)
            investment_doc = investment_ref.get()
            
            if not investment_doc.exists:
                return
            
            investment_data = investment_doc.to_dict()
            current_price = investment_data.get('currentPrice', 0)
            
            # Quantity ve totalCost hesapla
            total_quantity = 0
            total_cost = 0
            
            for transaction in transactions:
                transaction_type = transaction.get('type', 'buy')
                quantity = float(transaction.get('quantity', 0))
                total_amount = float(transaction.get('totalAmount', 0))
                
                if transaction_type == 'buy':
                    total_quantity += quantity
                    total_cost += total_amount
                else:  # sell
                    total_quantity -= quantity
                    total_cost -= total_amount
            
            # Hesaplamalar
            average_price = total_cost / total_quantity if total_quantity > 0 else 0
            total_value = total_quantity * current_price
            profit_loss = total_value - total_cost
            profit_loss_percentage = (profit_loss / total_cost * 100) if total_cost > 0 else 0
            
            # Investment'ı güncelle
            investment_ref.update({
                'quantity': total_quantity,
                'averagePrice': average_price,
                'totalValue': total_value,
                'profitLoss': profit_loss,
                'profitLossPercentage': profit_loss_percentage,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            
            # Investment bildirimlerini kontrol et
            try:
                await self._check_investment_notifications(user_id, investment_id, total_cost, total_value, profit_loss, profit_loss_percentage)
            except Exception as e:
                # Bildirim hatası stats güncellemeyi engellemesin
                logger.error(f"Investment bildirim kontrolü yapılırken hata: {e}", exc_info=True)
                
        except Exception as e:
            # Stats güncelleme hatası investment oluşturmayı engellemesin
            logger.error(f"Investment stats güncellenirken hata: {e}", exc_info=True)
            raise  # Hata yukarı fırlatılsın ki üst katmanda handle edilebilsin
    
    async def get_investment_transactions(self, user_id: str, investment_id: str) -> List[Dict]:
        """Yatırım işlemlerini getir"""
        docs = self.get_user_investment_transactions_ref(user_id, investment_id).order_by('date', direction=firestore.Query.DESCENDING).stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    async def update_investment_transaction(self, user_id: str, investment_id: str, transaction_id: str, updates: Dict[str, Any]) -> bool:
        """Yatırım işlemini güncelle ve investment stats'ı güncelle"""
        try:
            doc_ref = self.get_user_investment_transactions_ref(user_id, investment_id).document(transaction_id)
            updates['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.update(updates)
            
            # Investment stats'ı güncelle
            try:
                await self._update_investment_stats(user_id, investment_id)
            except Exception as stats_error:
                logger.error(f"Investment stats güncellenirken hata (transaction güncellendi): {stats_error}", exc_info=True)
            
            return True
        except Exception as e:
            logger.error(f"Investment transaction güncellenirken hata: {e}", exc_info=True)
            raise
    
    async def delete_investment_transaction(self, user_id: str, investment_id: str, transaction_id: str) -> bool:
        """Yatırım işlemini sil ve investment stats'ı güncelle"""
        try:
            doc_ref = self.get_user_investment_transactions_ref(user_id, investment_id).document(transaction_id)
            doc_ref.delete()
            
            # Investment stats'ı güncelle
            try:
                await self._update_investment_stats(user_id, investment_id)
            except Exception as stats_error:
                logger.error(f"Investment stats güncellenirken hata (transaction silindi): {stats_error}", exc_info=True)
            
            return True
        except Exception as e:
            logger.error(f"Investment transaction silinirken hata: {e}", exc_info=True)
            raise
    
    # User işlemleri
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Yeni kullanıcı oluştur"""
        doc_ref = self.db.collection('users').document(user_data['id'])
        user_data['createdAt'] = firestore.SERVER_TIMESTAMP
        user_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.set(user_data)
        return doc_ref.id
    
    async def get_user(self, user_id: str) -> Optional[Dict]:
        """Kullanıcı bilgilerini getir"""
        doc = self.db.collection('users').document(user_id).get()
        if doc.exists:
            return {'id': doc.id, **doc.to_dict()}
        return None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Kullanıcı bilgilerini güncelle"""
        doc_ref = self.db.collection('users').document(user_id)
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(updates)
        return True
    
    # Settings işlemleri
    def get_user_settings_ref(self, user_id: str):
        """Kullanıcının settings dokümanını getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('settings').document('user_settings')
    
    async def get_user_settings(self, user_id: str) -> Optional[Dict]:
        """Kullanıcının ayarlarını getir"""
        try:
            doc_ref = self.get_user_settings_ref(user_id)
            doc = doc_ref.get()
            if doc.exists:
                return {'id': doc.id, **doc.to_dict()}
            return None
        except Exception as e:
            logger.error(f"Settings getirilirken hata: {e}", exc_info=True)
            raise
    
    async def create_or_update_user_settings(self, user_id: str, settings_data: Dict[str, Any]) -> bool:
        """Kullanıcının ayarlarını oluştur veya güncelle"""
        try:
            doc_ref = self.get_user_settings_ref(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                # Güncelle
                settings_data['updatedAt'] = firestore.SERVER_TIMESTAMP
                doc_ref.update(settings_data)
            else:
                # Oluştur
                settings_data['createdAt'] = firestore.SERVER_TIMESTAMP
                settings_data['updatedAt'] = firestore.SERVER_TIMESTAMP
                doc_ref.set(settings_data)
            
            return True
        except Exception as e:
            logger.error(f"Settings kaydedilirken hata: {e}", exc_info=True)
            raise
    
    # Quick Transactions işlemleri
    async def create_quick_transaction(self, user_id: str, quick_transaction_data: Dict[str, Any]) -> str:
        """Yeni hızlı işlem oluştur"""
        doc_ref = self.get_user_quick_transactions_ref(user_id).document()
        quick_transaction_data['id'] = doc_ref.id
        quick_transaction_data['createdAt'] = firestore.SERVER_TIMESTAMP
        quick_transaction_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        # Order belirle: Eğer order verilmemişse, en yüksek order + 1
        if 'order' not in quick_transaction_data or quick_transaction_data.get('order') is None:
            existing_docs = self.get_user_quick_transactions_ref(user_id).stream()
            max_order = -1
            for doc in existing_docs:
                data = doc.to_dict()
                if 'order' in data and data['order'] is not None:
                    max_order = max(max_order, data['order'])
            quick_transaction_data['order'] = max_order + 1
        
        doc_ref.set(quick_transaction_data)
        return doc_ref.id
    
    async def get_user_quick_transactions(self, user_id: str) -> List[Dict]:
        """Kullanıcının hızlı işlemlerini getir (order'a göre sıralı)"""
        # Tüm kayıtları al
        docs = self.get_user_quick_transactions_ref(user_id).stream()
        transactions = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        
        # Order'a göre sırala (order yoksa sona koy)
        transactions.sort(key=lambda x: (
            x.get('order') if 'order' in x and x.get('order') is not None else 999999
        ))
        
        return transactions
    
    async def update_quick_transaction(self, user_id: str, quick_transaction_id: str, updates: Dict[str, Any]) -> bool:
        """Hızlı işlem güncelle"""
        doc_ref = self.get_user_quick_transactions_ref(user_id).document(quick_transaction_id)
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(updates)
        return True
    
    async def delete_quick_transaction(self, user_id: str, quick_transaction_id: str) -> bool:
        """Hızlı işlem sil"""
        doc_ref = self.get_user_quick_transactions_ref(user_id).document(quick_transaction_id)
        doc_ref.delete()
        return True
    
    # Quick Investments işlemleri
    async def create_quick_investment(self, user_id: str, quick_investment_data: Dict[str, Any]) -> str:
        """Yeni hızlı yatırım oluştur"""
        doc_ref = self.get_user_quick_investments_ref(user_id).document()
        quick_investment_data['id'] = doc_ref.id
        quick_investment_data['createdAt'] = firestore.SERVER_TIMESTAMP
        quick_investment_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.set(quick_investment_data)
        return doc_ref.id
    
    async def get_user_quick_investments(self, user_id: str) -> List[Dict]:
        """Kullanıcının hızlı yatırımlarını getir"""
        docs = self.get_user_quick_investments_ref(user_id).order_by('createdAt', direction=firestore.Query.DESCENDING).stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    async def update_quick_investment(self, user_id: str, quick_investment_id: str, updates: Dict[str, Any]) -> bool:
        """Hızlı yatırım güncelle"""
        doc_ref = self.get_user_quick_investments_ref(user_id).document(quick_investment_id)
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.update(updates)
        return True
    
    async def delete_quick_investment(self, user_id: str, quick_investment_id: str) -> bool:
        """Hızlı yatırım sil"""
        doc_ref = self.get_user_quick_investments_ref(user_id).document(quick_investment_id)
        doc_ref.delete()
        return True
    
    # Notifications işlemleri
    def get_user_notifications_ref(self, user_id: str):
        """Kullanıcının bildirimler koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('notifications')
    
    def get_user_events_ref(self, user_id: str):
        """Kullanıcının etkinlikler koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('events')
    
    async def create_notification(self, user_id: str, notification_data: Dict[str, Any]) -> str:
        """Yeni bildirim oluştur"""
        doc_ref = self.get_user_notifications_ref(user_id).document()
        notification_data['id'] = doc_ref.id
        notification_data['read'] = False
        notification_data['createdAt'] = firestore.SERVER_TIMESTAMP
        
        doc_ref.set(notification_data)
        
        # 30 günden eski bildirimleri temizle
        await self._cleanup_old_notifications(user_id)
        
        return doc_ref.id
    
    async def get_user_notifications(self, user_id: str) -> List[Dict]:
        """Kullanıcının bildirimlerini getir (son 30 gün)"""
        from datetime import datetime, timedelta
        
        # 30 gün öncesini hesapla
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        # Firestore datetime objesini direkt kabul eder, Timestamp'e çevirmeye gerek yok
        
        # Son 30 günün bildirimlerini getir
        query = self.get_user_notifications_ref(user_id).where(
            'createdAt', '>=', thirty_days_ago
        ).order_by('createdAt', direction=firestore.Query.DESCENDING)
        
        docs = query.stream()
        notifications = [{'id': doc.id, **doc.to_dict()} for doc in docs]
        
        # 30 günden eski bildirimleri temizle (async olarak)
        await self._cleanup_old_notifications(user_id)
        
        return notifications
    
    async def _cleanup_old_notifications(self, user_id: str):
        """30 günden eski bildirimleri sil"""
        from datetime import datetime, timedelta
        
        try:
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            # Firestore datetime objesini direkt kabul eder, Timestamp'e çevirmeye gerek yok
            
            # 30 günden eski bildirimleri bul
            old_notifications = self.get_user_notifications_ref(user_id).where(
                'createdAt', '<', thirty_days_ago
            ).stream()
            
            # Eski bildirimleri sil
            batch = self.db.batch()
            batch_count = 0
            for doc in old_notifications:
                batch.delete(doc.reference)
                batch_count += 1
                
                # Firestore batch limit: 500
                if batch_count >= 500:
                    batch.commit()
                    batch = self.db.batch()
                    batch_count = 0
            
            if batch_count > 0:
                batch.commit()
                
        except Exception as e:
            logger.error(f"Eski bildirimler temizlenirken hata: {e}", exc_info=True)
            # Hata olsa bile devam et
    
    async def mark_notification_as_read(self, user_id: str, notification_id: str) -> bool:
        """Bildirimi okundu olarak işaretle"""
        doc_ref = self.get_user_notifications_ref(user_id).document(notification_id)
        doc_ref.update({'read': True})
        return True
    
    async def mark_all_notifications_as_read(self, user_id: str) -> bool:
        """Tüm bildirimleri okundu olarak işaretle"""
        notifications_ref = self.get_user_notifications_ref(user_id)
        unread_notifications = notifications_ref.where('read', '==', False).stream()
        
        batch = self.db.batch()
        batch_count = 0
        for doc in unread_notifications:
            batch.update(doc.reference, {'read': True})
            batch_count += 1
            
            if batch_count >= 500:
                batch.commit()
                batch = self.db.batch()
                batch_count = 0
        
        if batch_count > 0:
            batch.commit()
        
        return True
    
    async def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Bildirimi sil"""
        doc_ref = self.get_user_notifications_ref(user_id).document(notification_id)
        doc_ref.delete()
        return True
    
    async def delete_all_read_notifications(self, user_id: str) -> bool:
        """Tüm okunmuş bildirimleri sil"""
        notifications_ref = self.get_user_notifications_ref(user_id)
        read_notifications = notifications_ref.where('read', '==', True).stream()
        
        batch = self.db.batch()
        batch_count = 0
        for doc in read_notifications:
            batch.delete(doc.reference)
            batch_count += 1
            
            if batch_count >= 500:
                batch.commit()
                batch = self.db.batch()
                batch_count = 0
        
        if batch_count > 0:
            batch.commit()
        
        return True
    
    async def _check_transaction_notifications(self, user_id: str, new_transaction: Dict[str, Any]):
        """Transaction oluşturulduğunda bildirim kontrolü yap"""
        from datetime import datetime
        
        try:
            # Kullanıcı bütçe/hedef bildirimlerini kapattıysa (Ayarlar > Bütçe uyarıları)
            user_settings = await self.get_user_settings(user_id)
            if user_settings is not None and user_settings.get('budgetAlerts', True) is False:
                return

            # Bu ayın başlangıç ve bitiş tarihlerini hesapla
            now = datetime.utcnow()
            month_start = datetime(now.year, now.month, 1)
            month_end = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)
            
            # Bu ayın tüm transaction'larını getir
            all_transactions = await self.get_user_transactions(user_id)
            
            # Bu ayın transaction'larını filtrele
            month_transactions = []
            for trans in all_transactions:
                trans_date = trans.get('date')
                if trans_date:
                    try:
                        if isinstance(trans_date, str):
                            # ISO format: "2024-12-10" veya "2024-12-10T10:00:00Z"
                            if 'T' in trans_date:
                                trans_date = datetime.fromisoformat(trans_date.replace('Z', '+00:00').replace('+00:00', ''))
                            else:
                                trans_date = datetime.strptime(trans_date, '%Y-%m-%d')
                        elif hasattr(trans_date, 'to_datetime'):
                            trans_date = trans_date.to_datetime()
                        elif hasattr(trans_date, 'timestamp'):
                            trans_date = datetime.fromtimestamp(trans_date.timestamp())
                        
                        # Sadece tarih kısmını karşılaştır (saat bilgisi olmadan)
                        trans_date_only = datetime(trans_date.year, trans_date.month, trans_date.day)
                        month_start_only = datetime(month_start.year, month_start.month, month_start.day)
                        month_end_only = datetime(month_end.year, month_end.month, month_end.day)
                        
                        if month_start_only <= trans_date_only < month_end_only:
                            month_transactions.append(trans)
                    except Exception as e:
                        logger.warning(f"Transaction tarihi parse edilemedi: {trans_date}, hata: {e}")
                        continue
            
            # Gelir ve gider toplamlarını hesapla
            total_income = 0
            total_expense = 0
            
            for trans in month_transactions:
                amount = float(trans.get('amount', 0))
                if trans.get('type') == 'income':
                    total_income += amount
                elif trans.get('type') == 'expense':
                    total_expense += amount
            
            # Aylık durum (gelir - gider)
            monthly_balance = total_income - total_expense
            
            # Net durum için tüm transaction'ları hesapla
            all_income = sum(float(t.get('amount', 0)) for t in all_transactions if t.get('type') == 'income')
            all_expense = sum(float(t.get('amount', 0)) for t in all_transactions if t.get('type') == 'expense')
            net_balance = all_income - all_expense
            
            # Bu ay için daha önce gönderilen bildirimleri kontrol et
            month_key = f"{now.year}-{now.month:02d}"
            sent_notifications = await self._get_sent_notification_thresholds(user_id, month_key)
            
            # 1. Aylık durum negatif olduğunda
            # Eğer daha önce negatif bildirimi gönderildiyse, son durumu kontrol et
            # Eğer pozitif olduysa ve tekrar negatif olduysa, tekrar bildirim gönder
            if monthly_balance < 0:
                should_send = False
                
                # Son negatif bildirimini bul
                last_notif_balance = None
                last_notif_created_at = None
                notifications_ref = self.get_user_notifications_ref(user_id)
                notifications = notifications_ref.where('category', '==', 'transaction').stream()
                
                for doc in notifications:
                    notif_data = doc.to_dict()
                    metadata = notif_data.get('metadata', {})
                    notif_type = metadata.get('type', '')
                    if notif_type.startswith('monthly_negative_') and metadata.get('month') == month_key:
                        notif_balance = metadata.get('balance')
                        notif_created = notif_data.get('createdAt')
                        
                        # En son bildirimi bul
                        if last_notif_created_at is None:
                            last_notif_balance = notif_balance
                            last_notif_created_at = notif_created
                        else:
                            # Tarih karşılaştırması
                            current_created = None
                            if hasattr(notif_created, 'timestamp'):
                                current_created = notif_created
                            elif isinstance(notif_created, str):
                                try:
                                    current_created = datetime.fromisoformat(notif_created.replace('Z', '+00:00'))
                                except:
                                    pass
                            
                            last_created = None
                            if hasattr(last_notif_created_at, 'timestamp'):
                                last_created = last_notif_created_at
                            elif isinstance(last_notif_created_at, str):
                                try:
                                    last_created = datetime.fromisoformat(last_notif_created_at.replace('Z', '+00:00'))
                                except:
                                    pass
                            
                            if current_created and last_created and current_created > last_created:
                                last_notif_balance = notif_balance
                                last_notif_created_at = notif_created
                
                if last_notif_balance is None:
                    # İlk kez negatif oldu
                    should_send = True
                else:
                    # Son bildirimden sonra pozitif olmuş mu kontrol et
                    # Son bildirimden sonraki transaction'ları kontrol et
                    # Eğer aralarında pozitif bir durum varsa, tekrar negatif oldu demektir
                    if last_notif_created_at:
                        # Son bildirimden sonraki transaction'ları bul
                        last_notif_timestamp = None
                        if hasattr(last_notif_created_at, 'timestamp'):
                            last_notif_timestamp = last_notif_created_at.timestamp()
                        elif isinstance(last_notif_created_at, str):
                            try:
                                last_notif_timestamp = datetime.fromisoformat(last_notif_created_at.replace('Z', '+00:00')).timestamp()
                            except:
                                pass
                        
                        if last_notif_timestamp:
                            # Son bildirimden sonraki transaction'ları kontrol et
                            # Her transaction'dan sonra balance'ı hesapla
                            # Eğer aralarında pozitif bir durum varsa, tekrar negatif oldu demektir
                            temp_income = 0
                            temp_expense = 0
                            had_positive = False
                            
                            # Transaction'ları tarihe göre sırala
                            sorted_transactions = sorted(month_transactions, key=lambda t: self._get_transaction_timestamp(t))
                            
                            for trans in sorted_transactions:
                                trans_timestamp = self._get_transaction_timestamp(trans)
                                if trans_timestamp and trans_timestamp > last_notif_timestamp:
                                    amount = float(trans.get('amount', 0))
                                    if trans.get('type') == 'income':
                                        temp_income += amount
                                    elif trans.get('type') == 'expense':
                                        temp_expense += amount
                                    
                                    temp_balance = temp_income - temp_expense
                                    if temp_balance > 0:
                                        had_positive = True
                                        break
                            
                            if had_positive:
                                # Son bildirimden sonra pozitif olmuş ve tekrar negatif oldu
                                should_send = True
                            elif monthly_balance < last_notif_balance:
                                # Pozitif olmamış ama daha kötü bir duruma düştü
                                should_send = True
                    else:
                        # Tarih bilgisi yok, sadece balance karşılaştırması yap
                        if monthly_balance < last_notif_balance:
                            should_send = True
                
                if should_send:
                    notification_key = f'monthly_negative_{month_key}_{int(abs(monthly_balance))}'
                    await self.create_notification(user_id, {
                        'category': 'transaction',
                        'title': 'Aylık Durum Negatif',
                        'message': f'Bu ayın toplam durumu {monthly_balance:,.2f}₺ oldu. Gelirlerinizi artırmayı veya giderlerinizi azaltmayı düşünün.',
                        'metadata': {
                            'type': notification_key,
                            'month': month_key,
                            'balance': monthly_balance
                        }
                    })
                    sent_notifications.add(notification_key)
            
            # 1.1. Aylık durum pozitif olduğunda (daha önce negatif bildirimi gönderilmişse)
            elif monthly_balance > 0:
                # Daha önce negatif bildirimi gönderilmiş mi kontrol et
                had_negative_notification = False
                notifications_ref = self.get_user_notifications_ref(user_id)
                notifications = notifications_ref.where('category', '==', 'transaction').stream()
                
                for doc in notifications:
                    notif_data = doc.to_dict()
                    metadata = notif_data.get('metadata', {})
                    notif_type = metadata.get('type', '')
                    if notif_type.startswith('monthly_negative_') and metadata.get('month') == month_key:
                        had_negative_notification = True
                        break
                
                # Eğer daha önce negatif bildirimi gönderilmişse ve şimdi pozitif olduysa
                if had_negative_notification and f'monthly_positive_{month_key}' not in sent_notifications:
                    await self.create_notification(user_id, {
                        'category': 'transaction',
                        'title': 'Aylık Durum Pozitif',
                        'message': f'Tebrikler! Bu ayın toplam durumu {monthly_balance:,.2f}₺ oldu. Finansal durumunuz iyileşti.',
                        'metadata': {
                            'type': f'monthly_positive_{month_key}',
                            'month': month_key,
                            'balance': monthly_balance
                        }
                    })
                    sent_notifications.add(f'monthly_positive_{month_key}')
            
            # 2. 10.000₺ ve üstünde harcama
            if new_transaction.get('type') == 'expense':
                expense_amount = float(new_transaction.get('amount', 0))
                if expense_amount >= 10000 and 'large_expense' not in sent_notifications:
                    await self.create_notification(user_id, {
                        'category': 'transaction',
                        'title': 'Büyük Harcama',
                        'message': f'{expense_amount:,.2f}₺ tutarında bir harcama kaydedildi. ({new_transaction.get("category", "Kategori belirtilmemiş")})',
                        'metadata': {
                            'type': 'large_expense',
                            'month': month_key,
                            'amount': expense_amount,
                            'category': new_transaction.get('category', '')
                        }
                    })
                    sent_notifications.add('large_expense')
            
            # 3. Net durum negatif olduğunda
            if net_balance < 0 and 'net_negative' not in sent_notifications:
                await self.create_notification(user_id, {
                    'category': 'transaction',
                    'title': 'Net Durum Negatif',
                    'message': f'Toplam net durumunuz {net_balance:,.2f}₺ oldu. Finansal durumunuzu gözden geçirmenizi öneririz.',
                    'metadata': {
                        'type': 'net_negative',
                        'month': month_key,
                        'balance': net_balance
                    }
                })
                sent_notifications.add('net_negative')
            
            # 4. Gider/Gelir oranı kontrolü (%50, %80, %100)
            if total_income > 0:
                expense_ratio = (total_expense / total_income) * 100
                
                # Hangi eşikler geçildi?
                thresholds = [50, 80, 100]
                passed_thresholds = [t for t in thresholds if expense_ratio >= t]
                
                # Daha önce bildirimi gönderilen eşikleri bul
                sent_thresholds = [t for t in passed_thresholds if f'expense_ratio_{t}' in sent_notifications]
                
                # Yeni geçilen en yüksek eşik (daha önce bildirimi gönderilmemiş)
                new_thresholds = [t for t in passed_thresholds if f'expense_ratio_{t}' not in sent_notifications]
                
                if new_thresholds:
                    # En yüksek yeni eşik için bildirim gönder
                    highest_new_threshold = max(new_thresholds)
                    
                    await self.create_notification(user_id, {
                        'category': 'transaction',
                        'title': f'Giderler Gelirin %{highest_new_threshold}\'ini Aştı',
                        'message': f'Bu ay toplam giderleriniz ({total_expense:,.2f}₺), toplam gelirlerinizin ({total_income:,.2f}₺) %{expense_ratio:.1f}\'ini oluşturuyor.',
                        'metadata': {
                            'type': f'expense_ratio_{highest_new_threshold}',
                            'month': month_key,
                            'ratio': expense_ratio,
                            'income': total_income,
                            'expense': total_expense
                        }
                    })
                    sent_notifications.add(f'expense_ratio_{highest_new_threshold}')
            
            # 5. Hedef bildirimleri kontrolü
            await self._check_target_notifications(user_id, month_key, total_income, total_expense, monthly_balance)
            
            # 6. Ayın ilk günü aylık durum bildirimi (geçen ayın verisi)
            if now.day == 1:
                await self._check_monthly_summary_notification(user_id, now)
                    
        except Exception as e:
            logger.error(f"Transaction bildirim kontrolü yapılırken hata: {e}", exc_info=True)
            # Hata olsa bile devam et
    
    async def _get_sent_notification_thresholds(self, user_id: str, month_key: str) -> set:
        """Belirli bir ay için gönderilen bildirim eşiklerini getir"""
        try:
            from datetime import datetime
            
            # Bu ay için transaction kategorisindeki bildirimleri getir
            notifications_ref = self.get_user_notifications_ref(user_id)
            notifications = notifications_ref.where('category', '==', 'transaction').stream()
            
            sent_thresholds = set()
            for doc in notifications:
                notif_data = doc.to_dict()
                metadata = notif_data.get('metadata', {})
                notif_month = metadata.get('month', '')
                
                # Aynı ay için bildirimler
                if notif_month == month_key:
                    notif_type = metadata.get('type', '')
                    if notif_type:
                        sent_thresholds.add(notif_type)
            
            return sent_thresholds
            
        except Exception as e:
            logger.error(f"Gönderilen bildirim eşikleri getirilirken hata: {e}", exc_info=True)
            return set()
    
    def _get_transaction_timestamp(self, transaction: Dict[str, Any]) -> Optional[float]:
        """Transaction'ın timestamp'ini döndür"""
        try:
            trans_date = transaction.get('date')
            if not trans_date:
                return None
            
            if isinstance(trans_date, str):
                if 'T' in trans_date:
                    dt = datetime.fromisoformat(trans_date.replace('Z', '+00:00').replace('+00:00', ''))
                else:
                    dt = datetime.strptime(trans_date, '%Y-%m-%d')
                return dt.timestamp()
            elif hasattr(trans_date, 'timestamp'):
                return trans_date.timestamp()
            elif hasattr(trans_date, 'to_datetime'):
                return trans_date.to_datetime().timestamp()
            
            return None
        except Exception as e:
            logger.warning(f"Transaction timestamp parse edilemedi: {e}")
            return None
    
    async def _check_target_notifications(self, user_id: str, month_key: str, total_income: float, total_expense: float, monthly_balance: float):
        """Hedef bildirimlerini kontrol et"""
        try:
            # Settings'ten hedefleri al
            settings = await self.get_user_settings(user_id)
            if not settings:
                return
            if settings.get('budgetAlerts', True) is False:
                return
            
            targets = settings.get('targets', {})
            monthly_target = targets.get('monthly', 0)
            savings_target = targets.get('savings', 0)
            accumulation_target = targets.get('accumulation', 0)
            
            # Bu ay için gönderilen target bildirimlerini kontrol et
            sent_target_notifications = await self._get_sent_target_notifications(user_id, month_key)
            
            # 1. Aylık gelir hedefi kontrolü (%50, %80, %100)
            # Aylık durum (gelir - gider) bazlı kontrol edilmeli
            if monthly_target > 0 and monthly_balance > 0:
                balance_percentage = (monthly_balance / monthly_target) * 100
                thresholds = [50, 80, 100]
                
                for threshold in thresholds:
                    if balance_percentage >= threshold:
                        notification_key = f'monthly_income_target_{threshold}'
                        if notification_key not in sent_target_notifications:
                            await self.create_notification(user_id, {
                                'category': 'target',
                                'title': f'Aylık Durum Hedefi %{threshold}\'e Ulaştı',
                                'message': f'Tebrikler! Bu ayın durumu {monthly_balance:,.2f}₺ oldu. Hedefinizin %{balance_percentage:.1f}\'ini tamamladınız. (Hedef: {monthly_target:,.2f}₺, Gelir: {total_income:,.2f}₺, Gider: {total_expense:,.2f}₺)',
                                'metadata': {
                                    'type': notification_key,
                                    'month': month_key,
                                    'threshold': threshold,
                                    'balance': monthly_balance,
                                    'income': total_income,
                                    'expense': total_expense,
                                    'target': monthly_target,
                                    'percentage': balance_percentage
                                }
                            })
                            sent_target_notifications.add(notification_key)
            
            # 2. Tasarruf hedefi kontrolü (%50, %80, %100)
            # Tasarruf = Gelir - Gider (aylık balance)
            if savings_target > 0 and monthly_balance > 0:
                savings_percentage = (monthly_balance / savings_target) * 100
                thresholds = [50, 80, 100]
                
                for threshold in thresholds:
                    if savings_percentage >= threshold:
                        notification_key = f'savings_target_{threshold}'
                        if notification_key not in sent_target_notifications:
                            await self.create_notification(user_id, {
                                'category': 'target',
                                'title': f'Tasarruf Hedefi %{threshold}\'e Ulaştı',
                                'message': f'Tebrikler! Bu ay {monthly_balance:,.2f}₺ tasarruf ettiniz. Hedefinizin %{savings_percentage:.1f}\'ini tamamladınız. (Hedef: {savings_target:,.2f}₺)',
                                'metadata': {
                                    'type': notification_key,
                                    'month': month_key,
                                    'threshold': threshold,
                                    'savings': monthly_balance,
                                    'target': savings_target,
                                    'percentage': savings_percentage
                                }
                            })
                            sent_target_notifications.add(notification_key)
            
            # 3. Birikim hedefi kontrolü (%30, %50, %80, %100)
            # Birikim = Tüm zamanların toplam net durumu (tüm gelirler - tüm giderler)
            if accumulation_target > 0:
                # Tüm transaction'ları getir
                all_transactions = await self.get_user_transactions(user_id)
                all_income = sum(float(t.get('amount', 0)) for t in all_transactions if t.get('type') == 'income')
                all_expense = sum(float(t.get('amount', 0)) for t in all_transactions if t.get('type') == 'expense')
                total_accumulation = all_income - all_expense
                
                if total_accumulation > 0:
                    accumulation_percentage = (total_accumulation / accumulation_target) * 100
                    thresholds = [30, 50, 80, 100]
                    
                    for threshold in thresholds:
                        if accumulation_percentage >= threshold:
                            notification_key = f'accumulation_target_{threshold}'
                            if notification_key not in sent_target_notifications:
                                await self.create_notification(user_id, {
                                    'category': 'target',
                                    'title': f'Birikim Hedefi %{threshold}\'e Ulaştı',
                                    'message': f'Tebrikler! Toplam birikiminiz {total_accumulation:,.2f}₺ oldu. Hedefinizin %{accumulation_percentage:.1f}\'ini tamamladınız. (Hedef: {accumulation_target:,.2f}₺)',
                                    'metadata': {
                                        'type': notification_key,
                                        'month': month_key,
                                        'threshold': threshold,
                                        'accumulation': total_accumulation,
                                        'target': accumulation_target,
                                        'percentage': accumulation_percentage
                                    }
                                })
                                sent_target_notifications.add(notification_key)
                                
        except Exception as e:
            logger.error(f"Hedef bildirim kontrolü yapılırken hata: {e}", exc_info=True)
            # Hata olsa bile devam et
    
    async def _get_sent_target_notifications(self, user_id: str, month_key: str) -> set:
        """Belirli bir ay için gönderilen target bildirimlerini getir"""
        try:
            # Bu ay için target kategorisindeki bildirimleri getir
            notifications_ref = self.get_user_notifications_ref(user_id)
            notifications = notifications_ref.where('category', '==', 'target').stream()
            
            sent_notifications = set()
            for doc in notifications:
                notif_data = doc.to_dict()
                metadata = notif_data.get('metadata', {})
                notif_month = metadata.get('month', '')
                
                # Aynı ay için bildirimler
                if notif_month == month_key:
                    notif_type = metadata.get('type', '')
                    if notif_type:
                        sent_notifications.add(notif_type)
            
            return sent_notifications
            
        except Exception as e:
            logger.error(f"Gönderilen target bildirimleri getirilirken hata: {e}", exc_info=True)
            return set()
    
    async def _check_investment_notifications(self, user_id: str, investment_id: str, total_cost: float, total_value: float, profit_loss: float, profit_loss_percentage: float):
        """Yatırım bildirimlerini kontrol et"""
        try:
            user_settings = await self.get_user_settings(user_id)
            if user_settings is not None and user_settings.get('budgetAlerts', True) is False:
                return

            from datetime import datetime
            
            now = datetime.utcnow()
            month_key = f"{now.year}-{now.month:02d}"
            
            # Tüm yatırımları getir (portföy toplam değeri için)
            all_investments = await self.get_user_investments(user_id)
            
            # Portföy toplam değeri ve toplam maliyet
            portfolio_total_value = 0
            portfolio_total_cost = 0
            
            for inv in all_investments:
                inv_value = float(inv.get('totalValue', 0))
                portfolio_total_value += inv_value
                
                # Toplam maliyet = averagePrice * quantity
                # (averagePrice zaten transaction'lardan hesaplanan ortalama fiyat)
                inv_quantity = float(inv.get('quantity', 0))
                inv_avg_price = float(inv.get('averagePrice', 0))
                if inv_quantity > 0 and inv_avg_price > 0:
                    inv_cost = inv_avg_price * inv_quantity
                    portfolio_total_cost += inv_cost
            
            # Bu ay için gönderilen investment bildirimlerini kontrol et
            sent_investment_notifications = await self._get_sent_investment_notifications(user_id, month_key)
            
            # 1. Portföy değeri toplam maliyetin %20, %50, %80, %100 fazlası olduğunda
            if portfolio_total_cost > 0:
                portfolio_gain_percentage = ((portfolio_total_value - portfolio_total_cost) / portfolio_total_cost) * 100
                thresholds = [20, 50, 80, 100]
                
                for threshold in thresholds:
                    if portfolio_gain_percentage >= threshold:
                        notification_key = f'portfolio_gain_{threshold}'
                        if notification_key not in sent_investment_notifications:
                            await self.create_notification(user_id, {
                                'category': 'investment',
                                'title': f'Portföy Değeri %{threshold} Kazanç Sağladı',
                                'message': f'Tebrikler! Portföyünüz toplam maliyetinizin %{portfolio_gain_percentage:.1f} fazlasına ulaştı. (Toplam Değer: {portfolio_total_value:,.2f}₺, Toplam Maliyet: {portfolio_total_cost:,.2f}₺)',
                                'metadata': {
                                    'type': notification_key,
                                    'month': month_key,
                                    'threshold': threshold,
                                    'portfolio_value': portfolio_total_value,
                                    'portfolio_cost': portfolio_total_cost,
                                    'gain_percentage': portfolio_gain_percentage
                                }
                            })
                            sent_investment_notifications.add(notification_key)
            
            # 2. Kar/zarar belirli bir yüzdeye ulaştığında (%20, %50, %80, %100)
            # Bu, tek bir yatırım için kar/zarar yüzdesi
            if total_cost > 0:
                profit_loss_thresholds = [20, 50, 80, 100]
                
                for threshold in profit_loss_thresholds:
                    if abs(profit_loss_percentage) >= threshold:
                        # Pozitif veya negatif olabilir
                        is_profit = profit_loss >= 0
                        notification_key = f'investment_profit_loss_{threshold}_{"profit" if is_profit else "loss"}'
                        
                        if notification_key not in sent_investment_notifications:
                            investment_ref = self.get_user_investments_ref(user_id).document(investment_id)
                            investment_doc = investment_ref.get()
                            investment_name = investment_doc.to_dict().get('name', 'Yatırım') if investment_doc.exists else 'Yatırım'
                            
                            title = f'{investment_name} %{threshold} {"Kazanç" if is_profit else "Zarar"} Sağladı'
                            message = f'{investment_name} yatırımınız toplam maliyetinizin %{abs(profit_loss_percentage):.1f} {"fazlasına" if is_profit else "altına"} ulaştı. (Kar/Zarar: {profit_loss:,.2f}₺)'
                            
                            await self.create_notification(user_id, {
                                'category': 'investment',
                                'title': title,
                                'message': message,
                                'metadata': {
                                    'type': notification_key,
                                    'month': month_key,
                                    'threshold': threshold,
                                    'investment_id': investment_id,
                                    'investment_name': investment_name,
                                    'profit_loss': profit_loss,
                                    'profit_loss_percentage': profit_loss_percentage,
                                    'is_profit': is_profit
                                }
                            })
                            sent_investment_notifications.add(notification_key)
            
            # 3. Her ayın ilk günü portföy değerini bildir
            if now.day == 1:
                notification_key = f'monthly_portfolio_report_{month_key}'
                if notification_key not in sent_investment_notifications:
                    # Tüm yatırımların toplam değeri (zaten yukarıda hesaplandı)
                    total_portfolio_profit = portfolio_total_value - portfolio_total_cost
                    total_portfolio_profit_percentage = (total_portfolio_profit / portfolio_total_cost * 100) if portfolio_total_cost > 0 else 0
                    
                    await self.create_notification(user_id, {
                        'category': 'investment',
                        'title': f'{month_key} Aylık Portföy Raporu',
                        'message': f'Bu ayın portföy özeti: Toplam Değer: {portfolio_total_value:,.2f}₺, Toplam Maliyet: {portfolio_total_cost:,.2f}₺, Kar/Zarar: {total_portfolio_profit:,.2f}₺ (%{total_portfolio_profit_percentage:.1f})',
                        'metadata': {
                            'type': notification_key,
                            'month': month_key,
                            'portfolio_value': portfolio_total_value,
                            'portfolio_cost': portfolio_total_cost,
                            'portfolio_profit': total_portfolio_profit,
                            'portfolio_profit_percentage': total_portfolio_profit_percentage
                        }
                    })
                    sent_investment_notifications.add(notification_key)
                    
        except Exception as e:
            logger.error(f"Yatırım bildirim kontrolü yapılırken hata: {e}", exc_info=True)
            # Hata olsa bile devam et
    
    async def _get_sent_investment_notifications(self, user_id: str, month_key: str) -> set:
        """Belirli bir ay için gönderilen investment bildirimlerini getir"""
        try:
            # Bu ay için investment kategorisindeki bildirimleri getir
            notifications_ref = self.get_user_notifications_ref(user_id)
            notifications = notifications_ref.where('category', '==', 'investment').stream()
            
            sent_notifications = set()
            for doc in notifications:
                notif_data = doc.to_dict()
                metadata = notif_data.get('metadata', {})
                notif_month = metadata.get('month', '')
                
                # Aynı ay için bildirimler
                if notif_month == month_key:
                    notif_type = metadata.get('type', '')
                    if notif_type:
                        sent_notifications.add(notif_type)
            
            return sent_notifications
            
        except Exception as e:
            logger.error(f"Gönderilen investment bildirimleri getirilirken hata: {e}", exc_info=True)
            return set()
    
    # Events işlemleri
    def get_user_events_ref(self, user_id: str):
        """Kullanıcının etkinlikler koleksiyonunu getir"""
        if not self.db:
            raise Exception("Firestore veritabanı bağlantısı bulunamadı")
        if not user_id or not isinstance(user_id, str):
            raise ValueError('Geçersiz user_id')
        return self.db.collection('users').document(user_id).collection('events')
    
    async def create_event(self, user_id: str, event_data: Dict[str, Any]) -> str:
        """Yeni etkinlik oluştur"""
        try:
            doc_ref = self.get_user_events_ref(user_id).document()
            event_data['id'] = doc_ref.id
            event_data['createdAt'] = firestore.SERVER_TIMESTAMP
            event_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.set(event_data)
            return doc_ref.id
        except Exception as e:
            logger.error(f"Event oluşturulurken hata: {e}", exc_info=True)
            raise
    
    async def get_user_events(self, user_id: str, filters: Optional[Dict] = None) -> List[Dict]:
        """Kullanıcının etkinliklerini getir"""
        try:
            query = self.get_user_events_ref(user_id).order_by('date', direction=firestore.Query.ASCENDING)
            
            if filters:
                if filters.get('startDate'):
                    query = query.where('date', '>=', filters['startDate'])
                if filters.get('endDate'):
                    query = query.where('date', '<=', filters['endDate'])
            
            docs = query.stream()
            events = []
            for doc in docs:
                data = doc.to_dict()
                # Timestamp'leri ISO string'e çevir
                if 'createdAt' in data and hasattr(data['createdAt'], 'toDate'):
                    data['createdAt'] = data['createdAt'].toDate().isoformat()
                if 'updatedAt' in data and hasattr(data['updatedAt'], 'toDate'):
                    data['updatedAt'] = data['updatedAt'].toDate().isoformat()
                events.append({'id': doc.id, **data})
            
            return events
        except Exception as e:
            logger.error(f"Events getirilirken hata: {e}", exc_info=True)
            raise
    
    async def update_event(self, user_id: str, event_id: str, updates: Dict[str, Any]) -> bool:
        """Etkinlik güncelle"""
        try:
            doc_ref = self.get_user_events_ref(user_id).document(event_id)
            updates['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.update(updates)
            return True
        except Exception as e:
            logger.error(f"Event güncellenirken hata: {e}", exc_info=True)
            raise
    
    async def delete_event(self, user_id: str, event_id: str) -> bool:
        """Etkinlik sil"""
        try:
            doc_ref = self.get_user_events_ref(user_id).document(event_id)
            doc_ref.delete()
            return True
        except Exception as e:
            logger.error(f"Event silinirken hata: {e}", exc_info=True)
            raise
    
    async def _check_monthly_summary_notification(self, user_id: str, current_date):
        """Ayın ilk günü geçen ayın aylık durum özetini bildir"""
        try:
            from datetime import datetime
            
            # Geçen ayın başlangıç ve bitiş tarihlerini hesapla
            if current_date.month == 1:
                prev_month = 12
                prev_year = current_date.year - 1
            else:
                prev_month = current_date.month - 1
                prev_year = current_date.year
            
            prev_month_start = datetime(prev_year, prev_month, 1)
            if prev_month == 12:
                prev_month_end = datetime(prev_year + 1, 1, 1)
            else:
                prev_month_end = datetime(prev_year, prev_month + 1, 1)
            
            prev_month_key = f"{prev_year}-{prev_month:02d}"
            
            # Geçen ay için bildirim gönderilmiş mi kontrol et
            notifications_ref = self.get_user_notifications_ref(user_id)
            notifications = notifications_ref.where('category', '==', 'transaction').stream()
            
            already_sent = False
            for doc in notifications:
                notif_data = doc.to_dict()
                metadata = notif_data.get('metadata', {})
                notif_type = metadata.get('type', '')
                if notif_type == f'monthly_summary_{prev_month_key}':
                    already_sent = True
                    break
            
            if already_sent:
                return
            
            # Geçen ayın transaction'larını getir
            all_transactions = await self.get_user_transactions(user_id)
            
            # Geçen ayın transaction'larını filtrele
            prev_month_transactions = []
            for trans in all_transactions:
                trans_date = trans.get('date')
                if trans_date:
                    try:
                        if isinstance(trans_date, str):
                            if 'T' in trans_date:
                                trans_date = datetime.fromisoformat(trans_date.replace('Z', '+00:00').replace('+00:00', ''))
                            else:
                                trans_date = datetime.strptime(trans_date, '%Y-%m-%d')
                        elif hasattr(trans_date, 'to_datetime'):
                            trans_date = trans_date.to_datetime()
                        elif hasattr(trans_date, 'timestamp'):
                            trans_date = datetime.fromtimestamp(trans_date.timestamp())
                        
                        trans_date_only = datetime(trans_date.year, trans_date.month, trans_date.day)
                        prev_month_start_only = datetime(prev_month_start.year, prev_month_start.month, prev_month_start.day)
                        prev_month_end_only = datetime(prev_month_end.year, prev_month_end.month, prev_month_end.day)
                        
                        if prev_month_start_only <= trans_date_only < prev_month_end_only:
                            prev_month_transactions.append(trans)
                    except Exception as e:
                        logger.warning(f"Transaction tarihi parse edilemedi: {trans_date}, hata: {e}")
                        continue
            
            # Geçen ayın gelir ve gider toplamlarını hesapla
            prev_month_income = 0
            prev_month_expense = 0
            
            for trans in prev_month_transactions:
                amount = float(trans.get('amount', 0))
                if trans.get('type') == 'income':
                    prev_month_income += amount
                elif trans.get('type') == 'expense':
                    prev_month_expense += amount
            
            prev_month_balance = prev_month_income - prev_month_expense
            
            # Bir önceki aya göre değişim hesapla (2 ay önce)
            if prev_month == 1:
                prev_prev_month = 12
                prev_prev_year = prev_year - 1
            else:
                prev_prev_month = prev_month - 1
                prev_prev_year = prev_year
            
            prev_prev_month_start = datetime(prev_prev_year, prev_prev_month, 1)
            if prev_prev_month == 12:
                prev_prev_month_end = datetime(prev_prev_year + 1, 1, 1)
            else:
                prev_prev_month_end = datetime(prev_prev_year, prev_prev_month + 1, 1)
            
            # Bir önceki ayın transaction'larını getir
            prev_prev_month_transactions = []
            for trans in all_transactions:
                trans_date = trans.get('date')
                if trans_date:
                    try:
                        if isinstance(trans_date, str):
                            if 'T' in trans_date:
                                trans_date = datetime.fromisoformat(trans_date.replace('Z', '+00:00').replace('+00:00', ''))
                            else:
                                trans_date = datetime.strptime(trans_date, '%Y-%m-%d')
                        elif hasattr(trans_date, 'to_datetime'):
                            trans_date = trans_date.to_datetime()
                        elif hasattr(trans_date, 'timestamp'):
                            trans_date = datetime.fromtimestamp(trans_date.timestamp())
                        
                        trans_date_only = datetime(trans_date.year, trans_date.month, trans_date.day)
                        prev_prev_month_start_only = datetime(prev_prev_month_start.year, prev_prev_month_start.month, prev_prev_month_start.day)
                        prev_prev_month_end_only = datetime(prev_prev_month_end.year, prev_prev_month_end.month, prev_prev_month_end.day)
                        
                        if prev_prev_month_start_only <= trans_date_only < prev_prev_month_end_only:
                            prev_prev_month_transactions.append(trans)
                    except Exception as e:
                        continue
            
            prev_prev_month_income = sum(float(t.get('amount', 0)) for t in prev_prev_month_transactions if t.get('type') == 'income')
            prev_prev_month_expense = sum(float(t.get('amount', 0)) for t in prev_prev_month_transactions if t.get('type') == 'expense')
            prev_prev_month_balance = prev_prev_month_income - prev_prev_month_expense
            
            # Değişim hesapla
            balance_change = prev_month_balance - prev_prev_month_balance
            balance_change_percentage = (balance_change / abs(prev_prev_month_balance) * 100) if prev_prev_month_balance != 0 else 0
            
            # Ay isimleri
            month_names = {
                1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
                5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
                9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
            }
            
            prev_month_name = month_names.get(prev_month, f'{prev_month}. Ay')
            
            # Bildirim mesajı oluştur
            change_text = ""
            if balance_change > 0:
                change_text = f"Bir önceki aya göre {balance_change:,.2f}₺ artış (%{abs(balance_change_percentage):.1f})"
            elif balance_change < 0:
                change_text = f"Bir önceki aya göre {abs(balance_change):,.2f}₺ azalış (%{abs(balance_change_percentage):.1f})"
            else:
                change_text = "Bir önceki ay ile aynı"
            
            message = f"{prev_month_name} {prev_year} aylık durumunuz: {prev_month_balance:,.2f}₺ (Gelir: {prev_month_income:,.2f}₺, Gider: {prev_month_expense:,.2f}₺). {change_text}."
            
            await self.create_notification(user_id, {
                'category': 'transaction',
                'title': f'{prev_month_name} {prev_year} Aylık Durum Özeti',
                'message': message,
                'metadata': {
                    'type': f'monthly_summary_{prev_month_key}',
                    'month': prev_month_key,
                    'income': prev_month_income,
                    'expense': prev_month_expense,
                    'balance': prev_month_balance,
                    'prev_balance': prev_prev_month_balance,
                    'balance_change': balance_change,
                    'balance_change_percentage': balance_change_percentage
                }
            })
            
        except Exception as e:
            logger.error(f"Aylık özet bildirimi kontrolü yapılırken hata: {e}", exc_info=True)
            # Hata olsa bile devam et

# Global Firestore service instance
firestore_service = FirestoreService() 