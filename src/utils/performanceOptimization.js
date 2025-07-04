// 🚀 ملف تحسين الأداء الشامل

import { debounce, throttle } from 'lodash';

// ⚡ تحسين البحث - منع الكثير من الاستعلامات
export const createDebouncedSearch = (searchFunction, delay = 300) => {
  return debounce(searchFunction, delay);
};

// 🔄 تحسين التمرير - منع التحديث المفرط
export const createThrottledScroll = (scrollFunction, delay = 100) => {
  return throttle(scrollFunction, delay);
};

// 💾 ذاكرة التخزين المؤقت البسيطة
class SimpleCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) { // 5 دقائق افتراضياً
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {
    // إزالة العنصر الأقدم إذا تم الوصول للحد الأقصى
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // التحقق من انتهاء الصلاحية
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// إنشاء ذاكرة تخزين مؤقت عامة
export const appCache = new SimpleCache();

// 🎯 تحسين تحميل البيانات مع التخزين المؤقت
export const createCachedFetcher = (fetchFunction, cacheKey) => {
  return async (...args) => {
    const key = `${cacheKey}_${JSON.stringify(args)}`;
    
    // التحقق من وجود البيانات في الذاكرة المؤقتة
    const cachedData = appCache.get(key);
    if (cachedData) {
      console.log(`📦 تم تحميل البيانات من الذاكرة المؤقتة: ${cacheKey}`);
      return cachedData;
    }

    // تحميل البيانات الجديدة
    console.log(`🌐 تحميل بيانات جديدة: ${cacheKey}`);
    const data = await fetchFunction(...args);
    
    // حفظ في الذاكرة المؤقتة
    appCache.set(key, data);
    return data;
  };
};

// 🎯 تحسين الجداول الكبيرة
export const optimizeTable = (data, pageSize = 50) => {
  return {
    currentPage: 1,
    pageSize,
    totalPages: Math.ceil(data.length / pageSize),
    getCurrentPageData: function(page = this.currentPage) {
      const start = (page - 1) * this.pageSize;
      const end = start + this.pageSize;
      return data.slice(start, end);
    }
  };
};

// 🔍 تحسين البحث
export const optimizedSearch = debounce((searchTerm, data, searchFields) => {
  if (!searchTerm.trim()) return data;
  
  const term = searchTerm.toLowerCase().trim();
  
  return data.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      if (typeof value === 'number') {
        return value.toString().includes(term);
      }
      return false;
    });
  });
}, 300);

// 🎮 تحكم في الذاكرة
export const memoryManager = {
  // تنظيف البيانات غير المستخدمة
  cleanup: () => {
    appCache.clear();
    
    // إجبار تنظيف الذاكرة إذا كان متاحاً
    if (window.gc) {
      window.gc();
    }
  },
  
};

// 🚀 Performance Optimization Utilities
// تحسينات الأداء والتحكم في سرعة التطبيق

// إعدادات الأداء الافتراضية
export const PERFORMANCE_CONFIG = {
  // حدود الـ pagination
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
    smallLimit: 20  // للمكونات الصغيرة
  },
  
  // إعدادات الـ debouncing
  debounce: {
    search: 300,      // تأخير البحث
    apiCalls: 200,    // تأخير API calls
    ui: 100          // تأخير تحديثات UI
  },
  
  // إعدادات الـ caching
  cache: {
    ttl: 5 * 60 * 1000,  // 5 دقائق
    maxEntries: 50
  },
  
  // حدود الشبكة
  network: {
    timeout: 30000,   // 30 ثانية
    retries: 3,
    retryDelay: 1000
  }
};

// 📊 مراقب الأداء
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.isMonitoring = false;
  }

  start(operation) {
    const startTime = performance.now();
    this.metrics.set(operation, { startTime, endTime: null, duration: null });
    return operation;
  }

  end(operation) {
    const metric = this.metrics.get(operation);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      // تسجيل العمليات البطيئة
      if (metric.duration > 1000) {
        console.warn(`⚠️ Slow operation detected: ${operation} took ${metric.duration.toFixed(2)}ms`);
      }
    }
    return metric?.duration || 0;
  }

  getMetrics() {
    const result = {};
    this.metrics.forEach((value, key) => {
      result[key] = value.duration;
    });
    return result;
  }

  clear() {
    this.metrics.clear();
  }
}

// 🎯 API Request Optimizer
class ApiRequestOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.lastCleanup = Date.now();
  }

  // تنظيف الكاش القديم
  cleanup() {
    const now = Date.now();
    if (now - this.lastCleanup < PERFORMANCE_CONFIG.cache.ttl) return;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > PERFORMANCE_CONFIG.cache.ttl) {
        this.cache.delete(key);
      }
    }
    
    this.lastCleanup = now;
  }

  // إنشاء مفتاح للكاش
  getCacheKey(url, params) {
    return `${url}?${new URLSearchParams(params).toString()}`;
  }

  // التحقق من الكاش
  getFromCache(cacheKey) {
    this.cleanup();
    const entry = this.cache.get(cacheKey);
    
    if (entry && Date.now() - entry.timestamp < PERFORMANCE_CONFIG.cache.ttl) {
      return entry.data;
    }
    
    return null;
  }

  // حفظ في الكاش
  setCache(cacheKey, data) {
    // تحديد حجم الكاش
    if (this.cache.size >= PERFORMANCE_CONFIG.cache.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // معالجة الطلبات المتكررة
  async handleRequest(url, params = {}, fetchFn) {
    const cacheKey = this.getCacheKey(url, params);
    
    // التحقق من الكاش أولاً
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // التحقق من الطلبات المعلقة
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // إنشاء طلب جديد
    const requestPromise = fetchFn()
      .then(data => {
        this.setCache(cacheKey, data);
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }
}

// 🚀 Query Optimizer
export const optimizeQuery = (originalParams = {}) => {
  const optimized = { ...originalParams };
  
  // تحسين حدود البيانات
  if (optimized.limit) {
    optimized.limit = Math.min(
      parseInt(optimized.limit), 
      PERFORMANCE_CONFIG.pagination.maxLimit
    );
  } else {
    optimized.limit = PERFORMANCE_CONFIG.pagination.defaultLimit;
  }
  
  // إضافة صفحة افتراضية
  if (!optimized.page) {
    optimized.page = 1;
  }
  
  return optimized;
};

// 🎛️ Debounce function مُحسن
export const createDebounce = (func, delay = PERFORMANCE_CONFIG.debounce.apiCalls) => {
  let timeoutId;
  let lastCallTime = 0;
  
  return function debounced(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    clearTimeout(timeoutId);
    
    if (timeSinceLastCall >= delay) {
      lastCallTime = now;
      return func.apply(this, args);
    } else {
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          try {
            resolve(func.apply(this, args));
          } catch (error) {
            reject(error);
          }
        }, delay - timeSinceLastCall);
      });
    }
  };
};

// 🔄 إعادة المحاولة مع تأخير متدرج
export const retryWithBackoff = async (fn, maxRetries = PERFORMANCE_CONFIG.network.retries) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // تأخير متدرج: 1s, 2s, 4s
      const delay = PERFORMANCE_CONFIG.network.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`Retrying operation (attempt ${attempt + 1}/${maxRetries + 1})`);
    }
  }
  
  throw lastError;
};

// إنشاء instances عامة
export const performanceMonitor = new PerformanceMonitor();
export const apiOptimizer = new ApiRequestOptimizer();

// دالة لتحسين API calls
export const optimizedApiCall = async (url, params = {}, fetchFunction) => {
  const operationId = performanceMonitor.start(`API: ${url}`);
  
  try {
    const optimizedParams = optimizeQuery(params);
    
    const result = await apiOptimizer.handleRequest(
      url, 
      optimizedParams, 
      () => retryWithBackoff(() => fetchFunction(url, optimizedParams))
    );
    
    return result;
  } finally {
    performanceMonitor.end(operationId);
  }
};

// 📈 تقرير الأداء
export const getPerformanceReport = () => {
  const metrics = performanceMonitor.getMetrics();
  const cacheStats = {
    cacheSize: apiOptimizer.cache.size,
    pendingRequests: apiOptimizer.pendingRequests.size
  };
  
  return {
    metrics,
    cacheStats,
    config: PERFORMANCE_CONFIG
  };
};

// 🧹 تنظيف الذاكرة
export const cleanup = () => {
  performanceMonitor.clear();
  apiOptimizer.cleanup();
  
  // تنظيف إضافي للذاكرة
  if (typeof window !== 'undefined' && window.gc) {
    window.gc();
  }
};

export default {
  createDebouncedSearch,
  createThrottledScroll,
  appCache,
  createCachedFetcher,
  performanceMonitor,
  apiOptimizer,
  PERFORMANCE_CONFIG,
  createDebounce,
  retryWithBackoff,

  optimizeTable,
  optimizedSearch,
  memoryManager,

  optimizedApiCall,
  getPerformanceReport,
  cleanup,
}; 