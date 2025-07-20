import { settingsAPI } from './apiHelpers';

let currentSettings = null;
let settingsPromise = null;

export const updateSettings = async () => {
  try {
    const response = await settingsAPI.getSettings();
    if (response.success && response.data?.settings) {
      currentSettings = response.data.settings;
    }
    return currentSettings;
  } catch (error) {
    console.error('Error updating currency settings:', error);
    throw error;
  }
};

export const getSettings = async () => {
  if (!currentSettings && !settingsPromise) {
    settingsPromise = updateSettings();
    currentSettings = await settingsPromise;
    settingsPromise = null;
  }
  return currentSettings;
};

export const formatAmount = (amount, currency) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0
  });

  const formattedAmount = formatter.format(amount);
  const symbol = currency === 'USD' ? '$' : 'د.ع';
  
  return `${formattedAmount} ${symbol}`;
};

export const convertAmount = async (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    amount = parseFloat(amount);
    if (isNaN(amount)) {
      throw new Error('المبلغ غير صالح');
    }

    const response = await settingsAPI.convertCurrency({
      amount,
      fromCurrency,
      toCurrency
    });

    if (response.success) {
      const convertedAmount = response.data.convertedAmount || response.data;
      return typeof convertedAmount === 'number' ? convertedAmount : parseFloat(convertedAmount);
    }

    throw new Error('فشل في تحويل العملة');
  } catch (error) {
    console.error('Error converting amount:', error);
    throw error;
  }
};

export const updateExchangeRate = async () => {
  try {
    const response = await settingsAPI.getLatestExchangeRate();
    if (response.success && response.data?.rate) {
      await settingsAPI.updateExchangeRates({
        USD_TO_IQD: response.data.rate
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return false;
  }
};

export const getCurrencySymbol = (currency) => {
  const symbols = {
    'IQD': 'د.ع',
    'USD': '$'
  };
  return symbols[currency] || currency;
};

export const updateTableCurrency = async (data) => {
  try {
    const settings = await getSettings();
    if (!settings || !settings.autoConvertCurrency) return data;

    const convertField = async (value, originalCurrency, targetCurrency) => {
      if (typeof value !== 'number') return value;
      return await convertAmount(value, originalCurrency, targetCurrency);
    };

    const processObject = async (obj, originalCurrency) => {
      if (!obj || typeof obj !== 'object') return obj;

      const updates = {};
      const fieldsToConvert = [
        'amount', 'contribution', 'totalProfit', 'profit', 'balance',
        'depositAmount', 'withdrawalAmount', 'profitAmount',
        'dailyProfitRate', 'yearlyProfitRate', 'distributedAmount',
            'distributionAmount', 'rolloverAmount',
        ...Object.keys(obj).filter(key => 
          /amount|profit|balance|total|sum|value/i.test(key) && 
          typeof obj[key] === 'number'
        )
      ];

      for (const field of fieldsToConvert) {
        if (field in obj) {
          updates[field] = await convertField(
            obj[field],
            originalCurrency,
            settings.defaultCurrency
          );
        }
      }

      if (Array.isArray(obj.distributions)) {
        updates.distributions = await Promise.all(
          obj.distributions.map(dist => processObject(dist, originalCurrency))
        );
      }

      if (Array.isArray(obj.transactions)) {
        updates.transactions = await Promise.all(
          obj.transactions.map(trans => processObject(trans, originalCurrency))
        );
      }

      if (Array.isArray(obj.profits)) {
        updates.profits = await Promise.all(
          obj.profits.map(profit => processObject(profit, originalCurrency))
        );
      }

      return {
        ...obj,
        ...updates,
        currency: settings.defaultCurrency
      };
    };

    return Promise.all(
      data.map(async (item) => {
        const originalCurrency = item.currency || 'IQD';
        if (originalCurrency === settings.defaultCurrency) return item;
        return processObject(item, originalCurrency);
      })
    );
  } catch (error) {
    console.error('Error updating table currency:', error);
    return data;
  }
};

export const resetSettings = () => {
  currentSettings = null;
  settingsPromise = null;
}; 