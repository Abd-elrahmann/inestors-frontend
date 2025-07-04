// 🧠 محسن الذاكرة لتسريع الجداول والمودالز

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// 🎯 Hook لتحسين أداء الجداول الكبيرة
export const useOptimizedTable = (data, searchTerm, pageSize = 20) => {
  // 📦 تخزين مؤقت للبيانات المفلترة
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchLower)
      )
    );
  }, [data, searchTerm]);

  // 📄 تقسيم البيانات إلى صفحات
  const paginatedData = useMemo(() => {
    return {
      data: filteredData,
      totalPages: Math.ceil(filteredData.length / pageSize),
      totalItems: filteredData.length
    };
  }, [filteredData, pageSize]);

  return paginatedData;
};

// ⚡ Hook لتحسين البحث مع Debouncing
export const useDebouncedSearch = (initialValue = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  const updateSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  return [debouncedValue, updateSearch, searchTerm];
};

// 🔄 Hook لتحسين إعادة التحميل
export const useOptimizedRefresh = (fetchFunction, dependencies = []) => {
  const [loading, setLoading] = useState(false);
  const lastFetchTime = useRef(0);
  const MINIMUM_INTERVAL = 1000; // ثانية واحدة على الأقل بين الطلبات

  const optimizedFetch = useCallback(async (...args) => {
    const now = Date.now();
    
    // منع الطلبات المتكررة
    if (now - lastFetchTime.current < MINIMUM_INTERVAL) {
      return;
    }

    try {
      setLoading(true);
      lastFetchTime.current = now;
      await fetchFunction(...args);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  return { loading, fetch: optimizedFetch };
};

// 🎨 Hook لتحسين عرض البيانات المالية
export const useFormattedCurrency = (amount, currency = 'IQD') => {
  return useMemo(() => {
    if (typeof amount !== 'number') return '0 ' + currency;
    return amount.toLocaleString() + ' ' + currency;
  }, [amount, currency]);
};

// 🗂️ Hook لتحسين إدارة النماذج
export const useOptimizedForm = (initialState) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // مسح الخطأ عند البدء بالكتابة
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
  }, [initialState]);

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  return {
    formData,
    errors,
    updateField,
    resetForm,
    setFieldError,
    setErrors
  };
};

// 🎯 Hook لتحسين أداء المودالز
export const useModalOptimization = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timeoutRef = useRef(null);

  const openModal = useCallback(() => {
    if (isClosing) return;
    setIsOpen(true);
  }, [isClosing]);

  const closeModal = useCallback(() => {
    setIsClosing(true);
    
    // تأخير قصير لضمان smooth animation
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isOpen, openModal, closeModal, isClosing };
};

// 📊 Hook لتحسين عرض الإحصائيات
export const useOptimizedStats = (data) => {
  return useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        total: 0,
        average: 0,
        max: 0,
        min: 0
      };
    }

    const numbers = data.map(item => Number(item.amount || item.value || 0));
    const total = numbers.reduce((sum, num) => sum + num, 0);

    return {
      total,
      average: total / numbers.length,
      max: Math.max(...numbers),
      min: Math.min(...numbers)
    };
  }, [data]);
};

// 🎮 مدير الذاكرة للتطبيق
class MemoryManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.maxCacheSize = 100;
  }

  // حفظ في التخزين المؤقت
  set(key, value, ttl = 5 * 60 * 1000) { // 5 دقائق افتراضياً
    // إزالة العناصر القديمة إذا امتلأ التخزين
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    this.cache.set(key, value);
    
    // تعيين مؤقت للحذف التلقائي
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  // استرجاع من التخزين المؤقت
  get(key) {
    return this.cache.get(key);
  }

  // التحقق من وجود العنصر
  has(key) {
    return this.cache.has(key);
  }

  // حذف عنصر محدد
  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  // مسح جميع العناصر
  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  // الحصول على حجم التخزين المؤقت
  size() {
    return this.cache.size;
  }
}

// إنشاء instance مشترك
export const memoryManager = new MemoryManager();

// 🚀 Hook لاستخدام التخزين المؤقت
export const useCachedData = (key, fetchFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // التحقق من التخزين المؤقت أولاً
        if (memoryManager.has(key)) {
          const cachedData = memoryManager.get(key);
          setData(cachedData);
          setLoading(false);
          return;
        }

        // جلب البيانات إذا لم تكن موجودة في التخزين المؤقت
        const result = await fetchFunction();
        
        // حفظ في التخزين المؤقت
        memoryManager.set(key, result);
        setData(result);
        
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, fetchFunction, ...dependencies]);

  // دالة إعادة التحميل مع تخطي التخزين المؤقت
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // حذف من التخزين المؤقت
      memoryManager.delete(key);
      
      const result = await fetchFunction();
      memoryManager.set(key, result);
      setData(result);
      
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFunction]);

  return { data, loading, error, refresh };
};

// 🎯 Hook لتحسين أداء القوائم المنسدلة
export const useOptimizedSelect = (options, searchable = true) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm) return options;
    
    const searchLower = searchTerm.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      option.value.toString().toLowerCase().includes(searchLower)
    );
  }, [options, searchTerm, searchable]);

  const updateSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  return { filteredOptions, searchTerm, updateSearch };
};

export default {
  useOptimizedTable,
  useDebouncedSearch,
  useOptimizedRefresh,
  useFormattedCurrency,
  useOptimizedForm,
  useModalOptimization,
  useOptimizedStats,
  memoryManager,
  useCachedData,
  useOptimizedSelect
}; 