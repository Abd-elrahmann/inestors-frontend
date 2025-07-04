// 🚀 API محسّن للأداء العالي
import { optimizedApiCall } from './performanceOptimization';

const API_BASE_URL = 'http://localhost:5000/api';

// 🎯 كلاس API محسّن
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.requestCache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 5 * 60 * 1000; 
  }

  // Get authentication headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const method = options.method || 'GET';
    
    return optimizedApiCall(
      endpoint,
      { method, ...options },
      async (url, params) => {
        const fullUrl = `${this.baseURL}${url}`;
        const config = {
          method: params.method || 'GET',
          headers: {
            ...this.getHeaders(params.includeAuth !== false),
            ...params.headers,
          },
          signal: AbortSignal.timeout(30000), // 30 ثانية
        };

        if (params.body) {
          config.body = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);
        }

        const response = await fetch(fullUrl, config);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
      }
    );
  }

  clearCache() {
    this.requestCache.clear();
    this.pendingRequests.clear();
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      includeAuth: false,
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(userData) {
    return this.request('/auth/updatedetails', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async updatePassword(passwordData) {
    return this.request('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async getInvestors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/investors${queryString ? `?${queryString}` : ''}`);
  }

  async createInvestor(investorData) {
    return this.request('/investors', {
      method: 'POST',
      body: JSON.stringify(investorData),
    });
  }

  async updateInvestor(id, investorData) {
    return this.request(`/investors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(investorData),
    });
  }

  async deleteInvestor(id) {
    return this.request(`/investors/${id}`, {
      method: 'DELETE',
    });
  }

  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  async updateTransaction(id, transactionData) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async getProfits(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/profits${queryString ? `?${queryString}` : ''}`);
  }

  async distributeProfits(profitData) {
    return this.request('/profits/distribute', {
      method: 'POST',
      body: JSON.stringify(profitData),
    });
  }

  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports${queryString ? `?${queryString}` : ''}`);
  }

  async generateReport(reportData) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }
}

const apiService = new ApiService();

export const authAPI = {
  login: (credentials) => apiService.login(credentials),
  register: (userData) => apiService.register(userData),
  logout: () => apiService.logout(),
  getProfile: () => apiService.getProfile(),
  updateProfile: (userData) => apiService.updateProfile(userData),
  updatePassword: (passwordData) => apiService.updatePassword(passwordData),
};

export const investorsAPI = {
  getAll: () => apiService.request('/investors'),
  getById: (id) => apiService.request(`/investors/${id}`),
  create: (data) => apiService.request('/investors', {
    method: 'POST',
    data
  }),
  update: (id, data) => apiService.request(`/investors/${id}`, {
    method: 'PUT',
    data
  }),
  delete: (id) => apiService.request(`/investors/${id}`, {
    method: 'DELETE'
  }),
  removeFromDistributions: (id) => apiService.request(`/investors/${id}/remove-from-distributions`, {
    method: 'PUT'
  }),
  reactivate: (id) => apiService.request(`/investors/${id}/reactivate`, {
    method: 'PUT'
  }),
  getBalance: (id) => apiService.request(`/investors/${id}/balance`),
  getTransactions: (id) => apiService.request(`/investors/${id}/transactions`),
  getProfits: (id) => apiService.request(`/investors/${id}/profits`)
};

export const transactionsAPI = {
  getAll: (params) => apiService.getTransactions(params),
  create: (data) => apiService.createTransaction(data),
  update: (id, data) => apiService.updateTransaction(id, data),
  delete: (id) => apiService.deleteTransaction(id),
};

export const profitsAPI = {
  getAll: (params) => apiService.getProfits(params),
  distribute: (data) => apiService.distributeProfits(data),
};

export const reportsAPI = {
  getAll: (params) => apiService.getReports(params),
  generate: (data) => apiService.generateReport(data),
};

export default apiService; 