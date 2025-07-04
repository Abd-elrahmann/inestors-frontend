// Date formatting utilities
export const formatDate = (date) => {
  if (!date) return '-';
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('ar-SA', options);
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Date(date).toLocaleDateString('ar-SA', options);
};

// Number formatting utilities
export const formatCurrency = async (amount, currency = 'IQD') => {
  if (amount === null || amount === undefined) return '-';
  
  try {
    // جلب إعدادات النظام
    const response = await settingsAPI.getDisplayAmount({
      amount,
      currency
    });
    
    if (response.success) {
      return response.data.displayText;
    }
    
    // في حالة فشل الطلب، استخدم التنسيق الافتراضي
    const symbols = {
      'IQD': 'د.ع',
      'USD': '$'
    };
    
    const formatted = new Intl.NumberFormat('en-US').format(amount);
    return `${formatted} ${symbols[currency] || currency}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    // استخدم التنسيق الافتراضي في حالة الخطأ
    const formatted = new Intl.NumberFormat('en-US').format(amount);
    return `${formatted} ${currency}`;
  }
};

// دالة تنسيق العملة السريعة (بدون طلب من السيرفر)
export const formatCurrencySync = (amount, currency = 'IQD') => {
  if (amount === null || amount === undefined) return '-';
  
  const symbols = {
    'IQD': 'د.ع',
    'USD': '$'
  };
  
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  return `${formatted} ${symbols[currency] || currency}`;
};

export const formatNumber = (number) => {
  if (number === null || number === undefined) return '-';
  return new Intl.NumberFormat('ar-SA').format(number);
};

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateSaudiId = (id) => {
  // Basic Saudi ID validation (10 digits)
  const re = /^[12]\d{9}$/;
  return re.test(id);
};

export const validatePhone = (phone) => {
  // Saudi phone number validation
  const re = /^(05|009665)\d{8}$/;
  return re.test(phone.replace(/\s+/g, ''));
};

// Local storage utilities
export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

export const setUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

export const removeUser = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// API utilities
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// String utilities
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Array utilities
export const sortByDate = (array, dateField, order = 'desc') => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    
    if (order === 'desc') {
      return dateB - dateA;
    }
    return dateA - dateB;
  });
};

export const filterBySearch = (array, searchTerm, fields) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => 
    fields.some(field => 
      item[field]?.toString().toLowerCase().includes(term)
    )
  );
};

// File utilities
export const downloadCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      return `"${value.toString().replace(/"/g, '""')}"`;
    });
    csvContent += values.join(',') + '\n';
  });
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Status utilities
export const getStatusColor = (status) => {
  const statusColors = {
    'نشط': { bg: '#d4edda', color: '#155724' },
    'متوقف': { bg: '#f8d7da', color: '#721c24' },
    'معلق': { bg: '#fff3cd', color: '#856404' },
    'مكتمل': { bg: '#d4edda', color: '#155724' },
    'قيد المعالجة': { bg: '#d1ecf1', color: '#0c5460' },
    'ملغي': { bg: '#f8d7da', color: '#721c24' },
    'موزع': { bg: '#d4edda', color: '#155724' }
  };
  
  return statusColors[status] || { bg: '#e2e3e5', color: '#383d41' };
};

export const getTransactionTypeColor = (type) => {
  const typeColors = {
    'إيداع': { bg: '#d1ecf1', color: '#0c5460' },
    'سحب': { bg: '#f8d7da', color: '#721c24' },
    'توزيع أرباح': { bg: '#d4edda', color: '#155724' },
    'رسوم': { bg: '#fff3cd', color: '#856404' }
  };
  
  return typeColors[type] || { bg: '#e2e3e5', color: '#383d41' };
};

// Notification utilities
export const showSuccess = (message) => {
  // This would integrate with your notification system (react-toastify, etc.)
  console.log('Success:', message);
};

export const showError = (message) => {
  // This would integrate with your notification system
  console.error('Error:', message);
};

export const showWarning = (message) => {
  // This would integrate with your notification system
  console.warn('Warning:', message);
};

// Default export with all utilities
export default {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  validateEmail,
  validateSaudiId,
  validatePhone,
  getUser,
  setUser,
  removeUser,
  getAuthHeaders,
  truncateText,
  capitalizeFirst,
  sortByDate,
  filterBySearch,
  downloadCSV,
  getStatusColor,
  getTransactionTypeColor,
  showSuccess,
  showError,
  showWarning
};

// Export all utility functions from a single entry point
export * from './api';
export * from './apiHelpers';
export * from './sweetAlert'; 