import React from 'react';
import Api from '../services/api';
import { useSettings } from '../hooks/useSettings';

// Default settings in case nothing saved
const DEFAULT_SETTINGS = {
  defaultCurrency: 'USD',
  USDtoIQD: 0
};

class GlobalCurrencyManager {
  constructor() {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    this.listeners = new Set();
    this.isInitialized = false;

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('currencySettings');
    if (savedSettings) {
      try {
        this.currentSettings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing saved currency settings:', error);
      }
    }
  }

  // Initialize with API settings
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

  // Get selected display currency
  getCurrentDisplayCurrency() {
    return this.currentSettings.defaultCurrency || DEFAULT_SETTINGS.defaultCurrency;
  }

  // Calculate exchange rate
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

// Convert value from one currency to another
convertAmount(amount, fromCurrency = 'IQD', toCurrency = null) {
  const targetCurrency = toCurrency || this.getCurrentDisplayCurrency();

  if (fromCurrency === targetCurrency) return amount;
  if (typeof amount !== 'number' || isNaN(amount)) return amount;

  if (fromCurrency === 'IQD' && targetCurrency === 'USD') {
    const rate = this.currentSettings.USDtoIQD;
    return rate && rate > 0 ? amount / rate : amount;
  }

  if (fromCurrency === 'USD' && targetCurrency === 'IQD') {
    const rate = this.currentSettings.USDtoIQD;
    return rate && rate > 0 ? amount * rate : amount;
  }

  return amount;
}

  // Format value to readable currency string
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

  // Currency symbols
  getCurrencySymbol(currency) {
    const symbols = {
      'IQD': 'د.ع',
      'USD': '$'
    };
    return symbols[currency] || currency;
  }

  // Update settings (API + localStorage)
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

  // Subscribe to settings changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentSettings);
      } catch (error) {
        console.error('Error notifying currency listener:', error);
      }
    });
  }

  // Force refresh
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

// React hook for using currency manager
export const useCurrencyManager = () => {
  const { data: settings } = useSettings();
  const [currencySettings, setCurrencySettings] = React.useState(globalCurrencyManager.getSettings());

  React.useEffect(() => {
    if (settings) {
      globalCurrencyManager.currentSettings = {
        defaultCurrency: settings.defaultCurrency,
        USDtoIQD: settings.USDtoIQD
      };
      setCurrencySettings(globalCurrencyManager.getSettings());
    }
  }, [settings]);

  React.useEffect(() => {
    const unsubscribe = globalCurrencyManager.addListener((newSettings) => {
      setCurrencySettings(newSettings);
    });

    return unsubscribe;
  }, []);

  return {
    currentCurrency: globalCurrencyManager.getCurrentDisplayCurrency(),
    settings: currencySettings,
    formatAmount: (amount, originalCurrency = 'IQD') =>
      globalCurrencyManager.formatAmount(amount, originalCurrency),
    convertAmount: (amount, fromCurrency, toCurrency) =>
      globalCurrencyManager.convertAmount(amount, fromCurrency, toCurrency),
    updateSettings: (newSettings) =>
      globalCurrencyManager.updateSettings(newSettings),
    refreshPage: () => globalCurrencyManager.refreshPage()
  };
};

// Utility functions
export const formatCurrency = (amount, originalCurrency = 'IQD') => {
  return globalCurrencyManager.formatAmount(amount, originalCurrency);
};

export const convertCurrency = (amount, fromCurrency, toCurrency = null) => {
  return globalCurrencyManager.convertAmount(amount, fromCurrency, toCurrency);
};

export default globalCurrencyManager;
