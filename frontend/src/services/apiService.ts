import { Transaction, Investment, InvestmentTransaction } from '../types';

// HTTP kullan, HTTPS değil!
const API_BASE_URL = 'http://localhost:8000/api';

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
  
  console.log("🚀 API Request URL:", url);
  console.log("🔧 Config:", config);
  
  try {
    const response = await fetch(url, config);
    
    console.log("📨 Response status:", response.status);
    console.log("📨 Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Success response:", data);
    return data;
    
  } catch (error) {
    console.error('❌ API request failed:', error);
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
    console.log("📝 Transaction getAll endpoint:", endpoint);
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
      console.log("🔑 Tokens saved to localStorage");
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
      console.log("🔄 Token refreshed");
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
        console.error('Logout error:', error);
      }
    }
    
    // Local storage'ı temizle
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    console.log("🚪 Logged out, tokens cleared");
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
  
  console.log("🔍 Token Status Check:");
  console.log("- Auth Token:", token ? "✅ Var" : "❌ Yok");
  console.log("- Refresh Token:", refreshToken ? "✅ Var" : "❌ Yok");
  
  return {
    hasAuthToken: !!token,
    hasRefreshToken: !!refreshToken,
    authToken: token,
    refreshToken: refreshToken
  };
};