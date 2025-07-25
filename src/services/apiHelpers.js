
import { performanceMonitor } from '../utils/performanceOptimization';

export const apiConfig = {
  baseURL: 'http://localhost:5000/api',
  defaultHeaders: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return apiConfig.defaultHeaders;
  }
  
  return {
    ...apiConfig.defaultHeaders,
    'Authorization': `Bearer ${token}`
  };
};

export const apiRequest = async (endpoint, options = {}) => {
  const operationId = performanceMonitor.start(`API Request: ${endpoint}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);
    
    const config = {
      method: 'GET',
      headers: options.skipAuth ? apiConfig.defaultHeaders : getAuthHeaders(),
      signal: controller.signal,
      ...options
    };

    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config);
    clearTimeout(timeoutId);

    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى');
    }

    if (!response.ok) {
      let errorMessage = `خطأ في الطلب: ${response.status} - ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        if (errorData.details) {
          errorMessage += ` - تفاصيل: ${errorData.details}`;
        }
        
        console.error('🚨 خطأ مفصل من الخادم:', errorData);
      } catch (parseError) {
        console.error('🚨 لا يمكن تحليل رسالة الخطأ:', parseError);
        
        try {
          const errorText = await response.text();
          console.error('🚨 نص الخطأ الخام:', errorText);
          if (errorText && errorText.length < 200) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (textError) {
          console.error('🚨 فشل في الحصول على نص الخطأ:', textError);
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'فشل في معالجة الطلب');
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('انتهت مهلة الطلب - العملية أخذت وقتاً أطول من المتوقع');
    }
    
    console.error(`🚨 API Error for ${endpoint}:`, error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('فشل في الاتصال بالخادم - تحقق من اتصال الإنترنت');
    }
    
    throw error;
  } finally {
    performanceMonitor.end(operationId);
  }
};

export const investorsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/investors${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  getById: (id) => apiRequest(`/investors/${id}`),

  create: (data) => apiRequest('/investors', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/investors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id, options = {}) => {
    const queryParams = new URLSearchParams();

    if (options.forceDelete !== undefined) {
      queryParams.append('forceDelete', options.forceDelete.toString());
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/investors/${id}${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint, {
    method: 'DELETE'
    });
  },

  getBalance: (id) => apiRequest(`/investors/${id}/balance`),

  getTransactions: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/investors/${id}/transactions${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  getProfits: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/investors/${id}/profits${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  }
};

export const transactionsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/transactions${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  getById: (id) => apiRequest(`/transactions/${id}`),

  create: (data) => apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => apiRequest(`/transactions/${id}`, {
    method: 'DELETE'
  })
};

export const profitsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/profits${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  getById: (id) => apiRequest(`/profits/${id}`),

  create: (data) => apiRequest('/profits', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  distribute: (id) => apiRequest(`/profits/${id}/distribute`, {
    method: 'POST'
  }),

  update: (id, data) => apiRequest(`/profits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => apiRequest(`/profits/${id}`, {
    method: 'DELETE'
  })
};

export const usersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  getById: (id) => apiRequest(`/users/${id}`),

  create: (data) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE'
  }),

  toggleStatus: (id) => apiRequest(`/users/${id}/toggle-status`, {
    method: 'PUT'
  })
};

export const settingsAPI = {
  getSettings: () => apiRequest('/settings'),

  updateSettings: (data) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  updateExchangeRates: (data) => apiRequest('/settings/exchange-rates', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  getLatestExchangeRate: () => apiRequest('/settings/latest-exchange-rate', {
    method: 'GET'
  }),

  convertCurrency: (data) => apiRequest('/settings/convert', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getDisplayAmount: (data) => apiRequest('/settings/display-amount', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  resetSettings: () => apiRequest('/settings/reset', {
    method: 'POST'
  }),

  getSupportedCurrencies: () => apiRequest('/settings/currencies')
};

export const financialYearsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/financial-years${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  getById: (id) => apiRequest(`/financial-years/${id}`),

  create: (data) => apiRequest('/financial-years', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => apiRequest(`/financial-years/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => apiRequest(`/financial-years/${id}`, {
    method: 'DELETE'
  }),

  calculateDistributions: (id, data = {}) => apiRequest(`/financial-years/${id}/calculate-distributions`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getDistributions: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/financial-years/${id}/distributions${queryString ? `?${queryString}` : ''}`;
    return apiRequest(endpoint);
  },

  approveDistributions: (id) => apiRequest(`/financial-years/${id}/approve-distributions`, {
    method: 'PUT'
  }),

  distributeProfits: (id) => apiRequest(`/financial-years/${id}/distribute-profits`, {
    method: 'POST'
  }),

  rolloverProfits: (id, data) => apiRequest(`/financial-years/${id}/rollover-profits`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  closeYear: (id) => apiRequest(`/financial-years/${id}/close`, {
    method: 'PUT'
  }),

  getSummary: (id) => apiRequest(`/financial-years/${id}/summary`)
};

export const transformers = {
  investor: (investor) => {
    return {
      id: investor._id,
      name: investor.fullName,
      nationalId: investor.nationalId,
      phone: investor.phone || '-',
      contribution: investor.amountContributed,
      currency: investor.currency || 'IQD',
      originalCurrency: investor.currency || 'IQD',
      startDate: investor.startDate,
      joinDate: investor.startDate ? new Date(investor.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : 'غير محدد',
      sharePercentage: investor.sharePercentage ? 
        `${investor.sharePercentage.toFixed(2)}%` : '0%'
    };
  },

  transaction: (transaction) => {
    return {
      id: transaction._id,
      investorId: transaction.investorId?._id || transaction.investorId,
      investorName: transaction.investorId?.fullName || 'غير محدد',
      type: transaction.type === 'deposit' ? 'إيداع' : 
            transaction.type === 'withdrawal' ? 'سحب' : 
            transaction.type === 'profit' ? 'أرباح' : transaction.type,
      amount: transaction.amount,
      currency: transaction.currency || 'IQD',
      originalCurrency: transaction.currency || 'IQD',
      profitYear: transaction.profitYear,
      date: transaction.transactionDate ? new Date(transaction.transactionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : 'غير محدد',
      status: transaction.status || 'مكتمل'
    };
  },

  financialYear: (financialYear) => {
    const getStatusText = (status) => {
      const statusMap = {
        'draft': 'مسودة',
        'calculated': 'محسوب',
        'approved': 'موافق عليه',
        'distributed': 'موزع',
        'closed': 'مغلق'
      };
      return statusMap[status] || status;
    };

    return {
      id: financialYear._id,
      _id: financialYear._id,
      year: financialYear.year,
      totalProfit: financialYear.totalProfit,
      currency: financialYear.currency || 'IQD',
      dailyProfitRate: financialYear.dailyProfitRate ? financialYear.dailyProfitRate.toFixed(6) : '0',
      totalDays: financialYear.totalDays || 0,
      status: financialYear.status,
      startDate: financialYear.startDate,
      endDate: financialYear.endDate,
      rolloverSettings: financialYear.rolloverSettings,
      distributions: financialYear.distributions || [],
      autoRollover: financialYear.rolloverSettings?.autoRollover ? 'مفعل' : 'غير مفعل',
      displayStatus: getStatusText(financialYear.status)
    };
  },

  user: (user) => ({
    id: user._id || user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    nationalId: user.nationalId,
    role: user.role === 'admin' ? 'مدير' : 'مستخدم',
    
  })
};

export const handleApiError = (error) => {
  if (error.message.includes('401')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
  }
  
  if (error.message.includes('403')) {
    return 'ليس لديك صلاحية للوصول لهذه البيانات';
  }
  
  if (error.message.includes('404')) {
    return 'البيانات المطلوبة غير موجودة';
  }
  
  if (error.message.includes('500')) {
    return 'خطأ في الخادم، يرجى المحاولة لاحقاً';
  }
  
  return error.message || 'حدث خطأ غير متوقع';
}; 