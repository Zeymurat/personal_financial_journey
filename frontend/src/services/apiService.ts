import {
  Transaction,
  Investment,
  InvestmentTransaction,
  QuickTransaction,
  UserSettings,
  Notification,
  Event,
} from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  clearStoredAuthTokens,
  getStoredAccessToken,
  setStoredAccessToken,
} from './authTokenStore';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000/api';

type ApiRequestOptions = RequestInit & {
  /** Login gibi auth gerektirmeyen uçlar */
  skipAuth?: boolean;
};

/**
 * Firebase oturumundan taze ID token alıp store'a yazar.
 * forceRefresh=true → Firebase'e zorla yenileme (süresi dolmuş token sonrası).
 *
 * Big-O: O(1) local iş + 1 network (Firebase) — istek başına en fazla 2 kez (retry).
 */
async function resolveAccessToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(forceRefresh);
    setStoredAccessToken(token);
    return token;
  }
  return getStoredAccessToken();
}

async function clearSessionAndSignOut(): Promise<void> {
  clearStoredAuthTokens();
  try {
    await signOut(auth);
  } catch {
    // Zaten çıkışlı olabilir
  }
}

function mergeHeaders(
  base: Record<string, string>,
  extra?: HeadersInit
): Record<string, string> {
  if (!extra) return base;
  if (extra instanceof Headers) {
    const out = { ...base };
    extra.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(extra)) {
    const out = { ...base };
    for (const [key, value] of extra) out[key] = value;
    return out;
  }
  return { ...base, ...extra };
}

/**
 * Tek HTTP giriş noktası (DRY + Open/Closed: yeni endpoint apiRequest üzerine eklenir).
 *
 * Akış:
 * 1) Taze token (varsa)
 * 2) İstek
 * 3) 401/403 → bir kez forceRefresh + retry
 * 4) Hâlâ 401/403 → oturumu kapat
 */
async function apiRequest(
  endpoint: string,
  options: ApiRequestOptions = {},
  retried = false
): Promise<any> {
  const { skipAuth = false, headers: optionHeaders, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = mergeHeaders(
    {
      'Content-Type': 'application/json',
      // Backend trusted first-party muafiyeti (throttle)
      'X-Finance-Client': 'web',
    },
    optionHeaders
  );

  if (!skipAuth) {
    const token = await resolveAccessToken(false);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const isAuthError = response.status === 401 || response.status === 403;

    if (isAuthError && !skipAuth && !retried && auth.currentUser) {
      await resolveAccessToken(true);
      return apiRequest(endpoint, options, true);
    }

    if (isAuthError && !skipAuth) {
      await clearSessionAndSignOut();
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  if (response.status === 204) return null;
  return await response.json();
}

// --- Domain API'leri (Interface Segregation: her obje kendi alanı) ---

export const transactionAPI = {
  async getAll(filters?: { type?: 'income' | 'expense'; category?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.category) queryParams.append('category', filters.category);
    const qs = queryParams.toString();
    return await apiRequest(`/auth/transactions/${qs ? `?${qs}` : ''}`);
  },

  async create(transaction: Omit<Transaction, 'id'>) {
    return await apiRequest('/auth/transactions/', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async update(id: string, updates: Partial<Transaction>) {
    return await apiRequest(`/auth/transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return await apiRequest(`/auth/transactions/${id}/`, { method: 'DELETE' });
  },
};

export const quickTransactionAPI = {
  async getAll() {
    return await apiRequest('/auth/quick-transactions/');
  },

  async create(
    quickTransaction: Omit<QuickTransaction, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    return await apiRequest('/auth/quick-transactions/', {
      method: 'POST',
      body: JSON.stringify(quickTransaction),
    });
  },

  async update(id: string, updates: Partial<QuickTransaction>) {
    return await apiRequest(`/auth/quick-transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return await apiRequest(`/auth/quick-transactions/${id}/`, {
      method: 'DELETE',
    });
  },
};

export const investmentAPI = {
  async getAll() {
    return await apiRequest('/auth/investments/');
  },

  async create(investment: Omit<Investment, 'id' | 'transactions'>) {
    return await apiRequest('/auth/investments/', {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  },

  async update(id: string, updates: Partial<Investment>) {
    return await apiRequest(`/auth/investments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return await apiRequest(`/auth/investments/${id}/`, { method: 'DELETE' });
  },
};

export const investmentTransactionAPI = {
  async getByInvestment(investmentId: string) {
    return await apiRequest(`/auth/investments/${investmentId}/transactions/`);
  },

  async create(
    investmentId: string,
    transaction: Omit<InvestmentTransaction, 'id'>
  ) {
    return await apiRequest(`/auth/investments/${investmentId}/transactions/`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async update(
    investmentId: string,
    transactionId: string,
    updates: Partial<InvestmentTransaction>
  ) {
    return await apiRequest(
      `/auth/investments/${investmentId}/transactions/${transactionId}/`,
      { method: 'PUT', body: JSON.stringify(updates) }
    );
  },

  async delete(investmentId: string, transactionId: string) {
    return await apiRequest(
      `/auth/investments/${investmentId}/transactions/${transactionId}/`,
      { method: 'DELETE' }
    );
  },
};

export const authAPI = {
  /**
   * Backend'e ID token doğrulatır ve access token store'a yazar.
   * skipAuth: henüz store'da token yok / circular bağımlılık olmasın.
   */
  async firebaseLogin(idToken: string) {
    const response = await apiRequest(
      '/auth/firebase-login/',
      {
        method: 'POST',
        body: JSON.stringify({ id_token: idToken }),
        skipAuth: true,
      }
    );

    if (response.access) {
      setStoredAccessToken(response.access);
    }

    return response;
  },

  /**
   * Yerel oturum temizliği. Backend'de ayrı logout route yok (stateless Firebase token).
   * Dependency Inversion: UI AuthContext.logout → signOut; bu fonksiyon store temizler.
   */
  async logout() {
    clearStoredAuthTokens();
  },

  /** Firebase'den token'ı zorla yenile (test / manuel sync). */
  async syncAccessTokenFromFirebase(forceRefresh = false) {
    return await resolveAccessToken(forceRefresh);
  },
};

export const checkAPIStatus = async () => {
  try {
    await apiRequest('/auth/settings/');
    return true;
  } catch {
    return false;
  }
};

export const checkTokenStatus = () => {
  const token = getStoredAccessToken();
  return {
    hasAuthToken: !!token,
    hasRefreshToken: false,
    authToken: token,
    refreshToken: null as string | null,
  };
};

export const tcmbAPI = {
  async getMain() {
    return await apiRequest('/currencies/getmain/');
  },

  async getExchangeRates() {
    return await apiRequest('/currencies/exchange-rates/');
  },

  async getGoldPrices() {
    return await apiRequest('/currencies/gold-prices/');
  },
};

export const borsaAPI = {
  async getBorsaData(date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return await apiRequest(`/currencies/borsa/list/${qs}`);
  },
};

export const settingsAPI = {
  async get() {
    return await apiRequest('/auth/settings/');
  },

  async update(settings: Partial<UserSettings>) {
    return await apiRequest('/auth/settings/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

export const fundsAPI = {
  async getFunds() {
    return await apiRequest('/currencies/funds/');
  },

  async getFundQuota() {
    return await apiRequest('/currencies/fund-quota/');
  },

  async getFundDetail(fundCode: string, date?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('fund_code', fundCode);
    if (date) queryParams.append('date', date);
    return await apiRequest(`/currencies/fund-detail/?${queryParams.toString()}`);
  },

  async checkFundPrice(fundCode: string, date?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('fund_code', fundCode);
    if (date) queryParams.append('date', date);
    return await apiRequest(
      `/currencies/fund-price-check/?${queryParams.toString()}`
    );
  },
};

export const notificationsAPI = {
  async getAll() {
    return await apiRequest('/auth/notifications/');
  },

  async markAsRead(id: string) {
    return await apiRequest(`/auth/notifications/${id}/read/`, {
      method: 'PUT',
    });
  },

  async markAllAsRead() {
    return await apiRequest('/auth/notifications/read-all/', {
      method: 'PUT',
    });
  },

  async delete(id: string) {
    return await apiRequest(`/auth/notifications/${id}/`, {
      method: 'DELETE',
    });
  },

  async deleteAllRead() {
    return await apiRequest('/auth/notifications/delete-read/', {
      method: 'DELETE',
    });
  },
};

export const eventsAPI = {
  async getAll(filters?: { startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    const qs = queryParams.toString();
    return await apiRequest(`/auth/events/${qs ? `?${qs}` : ''}`);
  },

  async create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) {
    return await apiRequest('/auth/events/', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  async update(id: string, event: Partial<Event>) {
    return await apiRequest(`/auth/events/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  },

  async delete(id: string) {
    return await apiRequest(`/auth/events/${id}/`, { method: 'DELETE' });
  },
};

export type PreferenceResource =
  | 'selected-currencies'
  | 'selected-hisse'
  | 'selected-funds'
  | 'followed-currencies'
  | 'followed-hisse'
  | 'followed-funds'
  | 'quick-converts';

export const preferencesAPI = {
  async get(resource: PreferenceResource) {
    return await apiRequest(`/auth/preferences/${resource}/`);
  },

  async put(resource: PreferenceResource, items: unknown[]) {
    return await apiRequest(`/auth/preferences/${resource}/`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
};

export const aiAPI = {
  async chat(
    message: string,
    history?: { role: 'user' | 'assistant'; content: string }[]
  ) {
    return await apiRequest('/auth/ai/chat/', {
      method: 'POST',
      body: JSON.stringify({ message, history: history ?? [] }),
    });
  },
};
