import { Transaction, Investment, InvestmentTransaction, QuickTransaction, UserSettings, Notification, Event } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000/api';

// JWT token'ı localStorage'dan al
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// API headers'ı hazırla
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// API isteği yap
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: getHeaders(),
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // 401/403 durumunda kullanıcıyı login ekranına yönlendirmek için oturumu temizle
      if (response.status === 401 || response.status === 403) {
        try {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refreshToken');
          await signOut(auth);
        } catch (e) {
          // Silent fail
        }
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    throw error;
  }
};

// Transaction API'leri
export const transactionAPI = {
  // Tüm işlemleri getir
  async getAll(filters?: { type?: 'income' | 'expense'; category?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.category) queryParams.append('category', filters.category);
    
    const endpoint = `/auth/transactions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiRequest(endpoint);
  },

  // Yeni işlem oluştur
  async create(transaction: Omit<Transaction, 'id'>) {
    return await apiRequest('/auth/transactions/', {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  },

  // İşlem güncelle
  async update(id: string, updates: Partial<Transaction>) {
    return await apiRequest(`/auth/transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // İşlem sil
  async delete(id: string) {
    return await apiRequest(`/auth/transactions/${id}/`, {
      method: 'DELETE'
    });
  }
};

// Quick Transaction API'leri
export const quickTransactionAPI = {
  // Tüm hızlı işlemleri getir
  async getAll() {
    return await apiRequest('/auth/quick-transactions/');
  },

  // Yeni hızlı işlem oluştur
  async create(quickTransaction: Omit<QuickTransaction, 'id' | 'createdAt' | 'updatedAt'>) {
    return await apiRequest('/auth/quick-transactions/', {
      method: 'POST',
      body: JSON.stringify(quickTransaction)
    });
  },

  // Hızlı işlem güncelle
  async update(id: string, updates: Partial<QuickTransaction>) {
    return await apiRequest(`/auth/quick-transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Hızlı işlem sil
  async delete(id: string) {
    return await apiRequest(`/auth/quick-transactions/${id}/`, {
      method: 'DELETE'
    });
  }
};

// Investment API'leri
export const investmentAPI = {
  // Tüm yatırımları getir
  async getAll() {
    return await apiRequest('/auth/investments/');
  },

  // Yeni yatırım oluştur
  async create(investment: Omit<Investment, 'id' | 'transactions'>) {
    return await apiRequest('/auth/investments/', {
      method: 'POST',
      body: JSON.stringify(investment)
    });
  },

  // Yatırım güncelle
  async update(id: string, updates: Partial<Investment>) {
    return await apiRequest(`/auth/investments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Yatırım sil
  async delete(id: string) {
    return await apiRequest(`/auth/investments/${id}/`, {
      method: 'DELETE'
    });
  }
};

// Investment Transaction API'leri
export const investmentTransactionAPI = {
  // Yatırım işlemlerini getir
  async getByInvestment(investmentId: string) {
    return await apiRequest(`/auth/investments/${investmentId}/transactions/`);
  },

  // Yeni yatırım işlemi ekle
  async create(investmentId: string, transaction: Omit<InvestmentTransaction, 'id'>) {
    return await apiRequest(`/auth/investments/${investmentId}/transactions/`, {
      method: 'POST',
      body: JSON.stringify(transaction)
    });
  },

  // Yatırım işlemini güncelle
  async update(investmentId: string, transactionId: string, updates: Partial<InvestmentTransaction>) {
    return await apiRequest(`/auth/investments/${investmentId}/transactions/${transactionId}/`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Yatırım işlemini sil
  async delete(investmentId: string, transactionId: string) {
    return await apiRequest(`/auth/investments/${investmentId}/transactions/${transactionId}/`, {
      method: 'DELETE'
    });
  }
};

// Auth API'leri
export const authAPI = {
  // Firebase login ile JWT token al
  async firebaseLogin(idToken: string) {
    const response = await apiRequest('/auth/firebase-login/', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken })
    });
    
    // Token'ı localStorage'a kaydet
    if (response.access) {
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refreshToken', response.refresh);
    }
    
    return response;
  },

  // Token yenile
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('Refresh token bulunamadı');
    
    const response = await apiRequest('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    if (response.access) {
      localStorage.setItem('access_token', response.access);
    }
    
    return response;
  },

  // Çıkış yap
  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      } catch (error) {
        // Silent fail
      }
    }
    
    // Local storage'ı temizle
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
  }
};

// API durumunu kontrol et
export const checkAPIStatus = async () => {
  try {
    await apiRequest('/auth/me/');
    return true;
  } catch (error) {
    return false;
  }
};

// Token durumunu kontrol et
export const checkTokenStatus = () => {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  return {
    hasAuthToken: !!token,
    hasRefreshToken: !!refreshToken,
    authToken: token,
    refreshToken: refreshToken
  };
};

// Finans API Currency API'leri
export const tcmbAPI = {
    // Tüm verileri getir (döviz kurları)
  async getMain() {
    const response = await fetch(`${API_BASE_URL}/currencies/getmain/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Sadece döviz kurları
  async getExchangeRates() {
    const response = await fetch(`${API_BASE_URL}/currencies/exchange-rates/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Sadece altın fiyatları
  async getGoldPrices() {
    const response = await fetch(`${API_BASE_URL}/currencies/gold-prices/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};

// Borsa API'leri
export const borsaAPI = {
  // Borsa verilerini getir (akıllı kontrol ile)
  async getBorsaData(date?: string) {
    const url = date 
      ? `${API_BASE_URL}/currencies/borsa/list/?date=${date}`
      : `${API_BASE_URL}/currencies/borsa/list/`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};

// Settings API'leri
export const settingsAPI = {
  // Kullanıcı ayarlarını getir
  async get() {
    return await apiRequest('/auth/settings/');
  },

  // Kullanıcı ayarlarını güncelle
  async update(settings: Partial<UserSettings>) {
    return await apiRequest('/auth/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};

// Funds API'leri
export const fundsAPI = {
  // Funds verilerini getir (global havuz)
  async getFunds() {
    const response = await fetch(`${API_BASE_URL}/currencies/funds/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('💰 Funds verileri yüklendi');
    return data;
  },

  // Quota bilgisini getir (cache'den okur, istek saymaz)
  async getFundQuota() {
    const url = `${API_BASE_URL}/currencies/fund-quota/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Fon detay bilgilerini getir (RapidAPI - akıllı cache ile)
  async getFundDetail(fundCode: string, date?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('fund_code', fundCode);
    if (date) {
      queryParams.append('date', date);
    }
    
    const url = `${API_BASE_URL}/currencies/fund-detail/?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Fon fiyat kontrolü (cache'den okur, API'ye istek atmaz)
  async checkFundPrice(fundCode: string, date?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('fund_code', fundCode);
    if (date) {
      queryParams.append('date', date);
    }
    
    const url = `${API_BASE_URL}/currencies/fund-price-check/?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};

// Notifications API'leri
export const notificationsAPI = {
  // Tüm bildirimleri getir (son 30 gün)
  async getAll() {
    return await apiRequest('/auth/notifications/');
  },

  // NOT: create metodu yok - Bildirimler sistem tarafından otomatik oluşturulur
  // Kullanıcı sadece okuyup silebilir

  // Bildirimi okundu olarak işaretle
  async markAsRead(id: string) {
    return await apiRequest(`/auth/notifications/${id}/read/`, {
      method: 'PUT'
    });
  },

  // Tüm bildirimleri okundu olarak işaretle
  async markAllAsRead() {
    return await apiRequest('/auth/notifications/read-all/', {
      method: 'PUT'
    });
  },

  // Bildirimi sil
  async delete(id: string) {
    return await apiRequest(`/auth/notifications/${id}/`, {
      method: 'DELETE'
    });
  },

  // Tüm okunmamış bildirimleri sil
  async deleteAllRead() {
    return await apiRequest('/auth/notifications/delete-read/', {
      method: 'DELETE'
    });
  }
};

// Events API'leri
export const eventsAPI = {
  // Tüm etkinlikleri getir
  async getAll(filters?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    
    const endpoint = `/auth/events/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return await apiRequest(endpoint);
  },

  // Yeni etkinlik oluştur
  async create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
    return await apiRequest('/auth/events/', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  },

  // Etkinlik güncelle
  async update(id: string, event: Partial<Event>) {
    return await apiRequest(`/auth/events/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(event)
    });
  },

  // Etkinlik sil
  async delete(id: string) {
    return await apiRequest(`/auth/events/${id}/`, {
      method: 'DELETE'
    });
  }
};