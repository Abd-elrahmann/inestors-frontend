import React from 'react';
import Api from '../services/api';

const DEFAULT_SETTINGS = {
  defaultCurrency: 'USD',
  USDtoIQD: 0
};

class GlobalCurrencyManager {
  constructor() {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
    this.isInitialized = false;

    const savedSettings = localStorage.getItem('currencySettings');
    if (savedSettings) {
      try {
        this.currentSettings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing saved currency settings:', error);
      }
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const response = await Api.get('/api/settings');
      if (response.data) {
        this.currentSettings = {
          defaultCurrency: response.data.defaultCurrency,
          USDtoIQD: response.data.USDtoIQD
        };
        localStorage.setItem('currencySettings', JSON.stringify(this.currentSettings));
      }
      this.isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing currency manager:', error);
      this.isInitialized = true;
    }
  }

  getCurrentDisplayCurrency() {
    return this.currentSettings.defaultCurrency || DEFAULT_SETTINGS.defaultCurrency;
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;
    
    if (fromCurrency === 'USD' && toCurrency === 'IQD') {
      return this.currentSettings.USDtoIQD || DEFAULT_SETTINGS.USDtoIQD;
    }
    
    if (fromCurrency === 'IQD' && toCurrency === 'USD') {
      return 1 / (this.currentSettings.USDtoIQD || DEFAULT_SETTINGS.USDtoIQD);
    }

    return 1;
  }

  convertAmount(amount, fromCurrency = 'IQD', toCurrency = null) {
    const targetCurrency = toCurrency || this.getCurrentDisplayCurrency();
    
    if (fromCurrency === targetCurrency) return amount;
    
    // التحويل من IQD إلى USD
    if (fromCurrency === 'IQD' && targetCurrency === 'USD') {
      const exchangeRate = this.currentSettings.USDtoIQD;
      if (exchangeRate && exchangeRate > 0) {
        return amount / exchangeRate;
      }
      return amount; // إذا لم يكن هناك سعر صرف، نعود بالمبلغ كما هو
    }
    
    // التحويل من USD إلى IQD
    if (fromCurrency === 'USD' && targetCurrency === 'IQD') {
      const exchangeRate = this.currentSettings.USDtoIQD;
      if (exchangeRate && exchangeRate > 0) {
        return amount * exchangeRate;
      }
      return amount; // إذا لم يكن هناك سعر صرف، نعود بالمبلغ كما هو
    }
    
    return amount; // للعملات الأخرى أو إذا كان التحويل غير مدعوم
  }
  
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
  getCurrencySymbol(currency) {
    const symbols = {
      'IQD': 'د.ع',
      'USD': '$'
    };
    return symbols[currency] || currency;
  }

  async updateSettings(newSettings) {
    try {
      const response = await Api.patch('/api/settings', {
        defaultCurrency: newSettings.defaultCurrency,
        USDtoIQD: newSettings.USDtoIQD
      });
      
      if (response.data) {
        this.currentSettings = {
          defaultCurrency: response.data.defaultCurrency,
          USDtoIQD: response.data.USDtoIQD
        };
        this.notifyListeners();
        localStorage.setItem('currencySettings', JSON.stringify(this.currentSettings));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentSettings);
      } catch (error) {
        console.error('Error notifying currency listener:', error);
      }
    });
  }

  refreshPage() {
    this.notifyListeners();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  getSettings() {
    return { ...this.currentSettings };
  }
}

export const globalCurrencyManager = new GlobalCurrencyManager();

export const useCurrencyManager = () => {
  const [settings, setSettings] = React.useState(globalCurrencyManager.getSettings());

  React.useEffect(() => {
    globalCurrencyManager.initialize();

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
      globalCurrencyManager.updateSettings(newSettings),
    refreshPage: () => globalCurrencyManager.refreshPage()
  };
};

export const formatCurrency = (amount, originalCurrency = 'IQD') => {
  return globalCurrencyManager.formatAmount(amount, originalCurrency);
};

export const convertCurrency = (amount, fromCurrency, toCurrency = null) => {
  return globalCurrencyManager.convertAmount(amount, fromCurrency, toCurrency);
};

export default globalCurrencyManager;