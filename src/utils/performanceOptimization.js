
import { debounce, throttle } from 'lodash';


export const createDebouncedSearch = (searchFunction, delay = 300) => {
  return debounce(searchFunction, delay);
};


export const createThrottledScroll = (scrollFunction, delay = 100) => {
  return throttle(scrollFunction, delay);
};


class SimpleCache {
  constructor(maxSize = 100, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key, value) {

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


export const appCache = new SimpleCache();


export const createCachedFetcher = (fetchFunction, cacheKey) => {
  return async (...args) => {
    const key = `${cacheKey}_${JSON.stringify(args)}`;
    

    const cachedData = appCache.get(key);
    if (cachedData) {
      return cachedData;
    }



    const data = await fetchFunction(...args);
    

    appCache.set(key, data);
    return data;
  };
};


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

export const memoryManager = {
  cleanup: () => {
    appCache.clear();
    
    if (window.gc) {
      window.gc();
    }
  },
  
};


export const PERFORMANCE_CONFIG = {
  pagination: {
    defaultLimit: 50,
    maxLimit: 100,
    smallLimit: 20
  },
  
  debounce: {
    search: 300,
    apiCalls: 200,
    ui: 100
  },
  
  cache: {
    ttl: 5 * 60 * 1000,
    maxEntries: 50
  },
  
  network: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
  }
};

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

class ApiRequestOptimizer {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.lastCleanup = Date.now();
  }


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


  getCacheKey(url, params) {
    return `${url}?${new URLSearchParams(params).toString()}`;
  }


  getFromCache(cacheKey) {
    this.cleanup();
    const entry = this.cache.get(cacheKey);
    
    if (entry && Date.now() - entry.timestamp < PERFORMANCE_CONFIG.cache.ttl) {
      return entry.data;
    }
    
    return null;
  }


  setCache(cacheKey, data) {

    if (this.cache.size >= PERFORMANCE_CONFIG.cache.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }


  async handleRequest(url, params = {}, fetchFn) {
    const cacheKey = this.getCacheKey(url, params);
    

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }


    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }


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


export const optimizeQuery = (originalParams = {}) => {
  const optimized = { ...originalParams };
  

  if (optimized.limit) {
    optimized.limit = Math.min(
      parseInt(optimized.limit), 
      PERFORMANCE_CONFIG.pagination.maxLimit
    );
  } else {
    optimized.limit = PERFORMANCE_CONFIG.pagination.defaultLimit;
  }
  

  if (!optimized.page) {
    optimized.page = 1;
  }
  
  return optimized;
};


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


export const retryWithBackoff = async (fn, maxRetries = PERFORMANCE_CONFIG.network.retries) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      

      const delay = PERFORMANCE_CONFIG.network.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};


export const performanceMonitor = new PerformanceMonitor();
export const apiOptimizer = new ApiRequestOptimizer();


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


export const cleanup = () => {
  performanceMonitor.clear();
  apiOptimizer.cleanup();
  
    
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