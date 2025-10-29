from firebase_admin import firestore
from django.conf import settings
from typing import Dict, List, Optional, Any
import json

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
    
    # Transaction işlemleri
    async def create_transaction(self, user_id: str, transaction_data: Dict[str, Any]) -> str:
        """Yeni işlem oluştur"""
        doc_ref = self.get_user_transactions_ref(user_id).document()
        transaction_data['id'] = doc_ref.id
        transaction_data['createdAt'] = firestore.SERVER_TIMESTAMP
        transaction_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        await doc_ref.set(transaction_data)
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
        
        await doc_ref.update(updates)
        return True
    
    async def delete_transaction(self, user_id: str, transaction_id: str) -> bool:
        """İşlem sil"""
        doc_ref = self.get_user_transactions_ref(user_id).document(transaction_id)
        await doc_ref.delete()
        return True
    
    # Investment işlemleri
    async def create_investment(self, user_id: str, investment_data: Dict[str, Any]) -> str:
        """Yeni yatırım oluştur"""
        doc_ref = self.get_user_investments_ref(user_id).document()
        investment_data['id'] = doc_ref.id
        investment_data['transactions'] = []
        investment_data['createdAt'] = firestore.SERVER_TIMESTAMP
        investment_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        await doc_ref.set(investment_data)
        return doc_ref.id
    
    async def get_user_investments(self, user_id: str) -> List[Dict]:
        """Kullanıcının yatırımlarını getir"""
        docs = self.get_user_investments_ref(user_id).stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    async def update_investment(self, user_id: str, investment_id: str, updates: Dict[str, Any]) -> bool:
        """Yatırım güncelle"""
        doc_ref = self.get_user_investments_ref(user_id).document(investment_id)
        updates['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        await doc_ref.update(updates)
        return True
    
    async def delete_investment(self, user_id: str, investment_id: str) -> bool:
        """Yatırım sil"""
        doc_ref = self.get_user_investments_ref(user_id).document(investment_id)
        await doc_ref.delete()
        return True
    
    # Investment transaction işlemleri
    async def add_investment_transaction(self, user_id: str, investment_id: str, transaction_data: Dict[str, Any]) -> str:
        """Yatırım işlemi ekle"""
        doc_ref = self.get_user_investment_transactions_ref(user_id, investment_id).document()
        transaction_data['id'] = doc_ref.id
        transaction_data['createdAt'] = firestore.SERVER_TIMESTAMP
        
        await doc_ref.set(transaction_data)
        return doc_ref.id
    
    async def get_investment_transactions(self, user_id: str, investment_id: str) -> List[Dict]:
        """Yatırım işlemlerini getir"""
        docs = self.get_user_investment_transactions_ref(user_id, investment_id).order_by('date', direction=firestore.Query.DESCENDING).stream()
        return [{'id': doc.id, **doc.to_dict()} for doc in docs]
    
    # User işlemleri
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Yeni kullanıcı oluştur"""
        doc_ref = self.db.collection('users').document(user_data['id'])
        user_data['createdAt'] = firestore.SERVER_TIMESTAMP
        user_data['updatedAt'] = firestore.SERVER_TIMESTAMP
        
        await doc_ref.set(user_data)
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
        
        await doc_ref.update(updates)
        return True

# Global Firestore service instance
firestore_service = FirestoreService() 