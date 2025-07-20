
import React from 'react';
import { settingsAPI } from '../services/apiHelpers';

const DEFAULT_SETTINGS = {
  defaultCurrency: 'IQD',
  displayCurrency: 'IQD',
  autoConvertCurrency: false,
  exchangeRates: {
    USD_TO_IQD: 0,
    IQD_TO_USD: 0
  }
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
      const response = await settingsAPI.getSettings();
      if (response.success && response.data?.settings) {
        this.currentSettings = response.data.settings;
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
    return this.currentSettings.displayCurrency || this.currentSettings.defaultCurrency || DEFAULT_SETTINGS.defaultCurrency;
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    const rates = this.currentSettings.exchangeRates;
    
    if (fromCurrency === 'USD' && toCurrency === 'IQD') {
      return rates.USD_TO_IQD || DEFAULT_SETTINGS.exchangeRates.USD_TO_IQD;
    }
    
    if (fromCurrency === 'IQD' && toCurrency === 'USD') {
      return rates.IQD_TO_USD || DEFAULT_SETTINGS.exchangeRates.IQD_TO_USD;
    }

    return 1;
  }

  convertAmount(amount, fromCurrency, toCurrency = null) {
    if (!amount || isNaN(amount)) return 0;

    const targetCurrency = toCurrency || this.getCurrentDisplayCurrency();
    
    if (fromCurrency === targetCurrency) return Number(amount);

    const rate = this.getExchangeRate(fromCurrency, targetCurrency);
    // Convert to decimal if USD is target currency
    return targetCurrency === 'USD' ? Number(amount) * rate / 100 : Number(amount) * rate;
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

  async updateCurrencySettings(newSettings) {
    try {
      const response = await settingsAPI.updateSettings({
        ...this.currentSettings,
        ...newSettings
      });

      if (response.success) {
        this.currentSettings = { ...this.currentSettings, ...newSettings };
        this.notifyListeners();
        
        localStorage.setItem('currencySettings', JSON.stringify(this.currentSettings));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating currency settings:', error);
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

  shouldAutoConvert() {
    return this.currentSettings.autoConvertCurrency;
  }

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
      globalCurrencyManager.updateCurrencySettings(newSettings),
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