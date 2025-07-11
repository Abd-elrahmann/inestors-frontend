// 💰 مدير العملة المركزي للنظام

import React from 'react';
import { settingsAPI } from '../services/apiHelpers';

// 🎯 مدير العملة المركزي
class GlobalCurrencyManager {
  constructor() {
    this.currentSettings = {
      defaultCurrency: 'IQD',
      displayCurrency: 'IQD',
      autoConvertCurrency: false,
      exchangeRates: {
        USD_TO_IQD: 1310.32,
        IQD_TO_USD: 0.0007634
      }
    };
    this.listeners = new Set();
    this.isInitialized = false;
  }

  // تهيئة المدير مع جلب الإعدادات
  async initialize() {
    if (this.isInitialized) return;

    try {
      const response = await settingsAPI.getSettings();
      if (response.success && response.data?.settings) {
        this.currentSettings = response.data.settings;
      }
      this.isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing currency manager:', error);
      // استخدام الإعدادات الافتراضية في حالة الخطأ
      this.isInitialized = true;
    }
  }

  // الحصول على العملة الحالية للعرض
  getCurrentDisplayCurrency() {
    return this.currentSettings.displayCurrency || this.currentSettings.defaultCurrency || 'IQD';
  }

  // الحصول على سعر الصرف
  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    const rates = this.currentSettings.exchangeRates;
    
    if (fromCurrency === 'USD' && toCurrency === 'IQD') {
      return rates.USD_TO_IQD || 1310.32;
    }
    
    if (fromCurrency === 'IQD' && toCurrency === 'USD') {
      return rates.IQD_TO_USD || 0.0007634;
    }

    return 1;
  }

  // تحويل المبلغ حسب العملة المطلوبة
  convertAmount(amount, fromCurrency, toCurrency = null) {
    if (!amount || isNaN(amount)) return 0;

    const targetCurrency = toCurrency || this.getCurrentDisplayCurrency();
    
    if (fromCurrency === targetCurrency) return Number(amount);

    const rate = this.getExchangeRate(fromCurrency, targetCurrency);
    return Number(amount) * rate;
  }

  // تنسيق المبلغ مع العملة
  formatAmount(amount, originalCurrency = 'IQD', targetCurrency = null) {
    const displayCurrency = targetCurrency || this.getCurrentDisplayCurrency();
    const convertedAmount = this.convertAmount(amount, originalCurrency, displayCurrency);
    
    const formatted = convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: displayCurrency === 'USD' ? 2 : 0,
      maximumFractionDigits: displayCurrency === 'USD' ? 2 : 0
    });

    const symbol = this.getCurrencySymbol(displayCurrency);
    return `${formatted} ${symbol}`;
  }

  // الحصول على رمز العملة
  getCurrencySymbol(currency) {
    const symbols = {
      'IQD': 'د.ع',
      'USD': '$'
    };
    return symbols[currency] || currency;
  }

  // تحديث إعدادات العملة
  async updateCurrencySettings(newSettings) {
    try {
      const response = await settingsAPI.updateSettings({
        ...this.currentSettings,
        ...newSettings
      });

      if (response.success) {
        this.currentSettings = { ...this.currentSettings, ...newSettings };
        this.notifyListeners();
        
        // حفظ في localStorage للوصول السريع
        localStorage.setItem('currencySettings', JSON.stringify(this.currentSettings));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating currency settings:', error);
      return false;
    }
  }

  // إضافة مستمع للتغييرات
  addListener(callback) {
    this.listeners.add(callback);
    
    // إرجاع دالة إلغاء الاشتراك
    return () => {
      this.listeners.delete(callback);
    };
  }

  // إشعار جميع المستمعين
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentSettings);
      } catch (error) {
        console.error('Error notifying currency listener:', error);
      }
    });
  }

  // تحديث الصفحة بعد تغيير العملة
  refreshPage() {
    // إشعار جميع المكونات قبل إعادة التحميل
    this.notifyListeners();
    
    // تأخير قصير للسماح للمكونات بالتحديث
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // الحصول على جميع الإعدادات
  getSettings() {
    return { ...this.currentSettings };
  }

  // التحقق من الحاجة للتحويل التلقائي
  shouldAutoConvert() {
    return this.currentSettings.autoConvertCurrency;
  }

  // تحديث أسعار الصرف
  async updateExchangeRates(newRates) {
    try {
      const response = await settingsAPI.updateExchangeRates(newRates);
      
      if (response.success) {
        this.currentSettings.exchangeRates = {
          ...this.currentSettings.exchangeRates,
          ...newRates
        };
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      return false;
    }
  }
}

// إنشاء instance واحد للاستخدام في جميع أنحاء التطبيق
export const globalCurrencyManager = new GlobalCurrencyManager();

// Hook للاستخدام في React Components
export const useCurrencyManager = () => {
  const [settings, setSettings] = React.useState(globalCurrencyManager.getSettings());

  React.useEffect(() => {
    // تهيئة المدير
    globalCurrencyManager.initialize();

    // الاشتراك في التغييرات
    const unsubscribe = globalCurrencyManager.addListener((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  return {
    currentCurrency: globalCurrencyManager.getCurrentDisplayCurrency(),
    settings,
    formatAmount: (amount, originalCurrency = 'IQD') => 
      globalCurrencyManager.formatAmount(amount, originalCurrency),
    convertAmount: (amount, fromCurrency, toCurrency) => 
      globalCurrencyManager.convertAmount(amount, fromCurrency, toCurrency),
    updateSettings: (newSettings) => 
      globalCurrencyManager.updateCurrencySettings(newSettings),
    refreshPage: () => globalCurrencyManager.refreshPage()
  };
};

// دالة مساعدة للتنسيق السريع
export const formatCurrency = (amount, originalCurrency = 'IQD') => {
  return globalCurrencyManager.formatAmount(amount, originalCurrency);
};

// دالة مساعدة للتحويل السريع
export const convertCurrency = (amount, fromCurrency, toCurrency = null) => {
  return globalCurrencyManager.convertAmount(amount, fromCurrency, toCurrency);
};

export default globalCurrencyManager; 