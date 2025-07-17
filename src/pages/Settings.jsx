import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CurrencyExchange as CurrencyIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { settingsAPI } from '../services/apiHelpers';
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import { showSuccessAlert, showDeleteConfirmation } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

// تنسيق رمز العملة
const formatCurrencySymbol = (currency) => {
  return currency === 'USD' ? '$' : 'د.ع';
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [lastAutoUpdate, setLastAutoUpdate] = useState(null);
  
  // 💰 استخدام مدير العملة المركزي
  const { updateSettings: updateCurrencySettings, refreshPage } = useCurrencyManager();
  const [settings, setSettings] = useState({
    defaultCurrency: 'IQD',
    autoConvertCurrency: false,
    displayCurrency: 'IQD',
    exchangeRates: {
      USD_TO_IQD: 0,
      IQD_TO_USD: 0,
    },
    systemName: 'نظام إدارة المساهمين',
    lastRateUpdate: new Date()
  });

  const [tempExchangeRate, setTempExchangeRate] = useState('');
  const [conversionTest, setConversionTest] = useState({
    amount: '',
    fromCurrency: 'USD',
    toCurrency: 'IQD',
    result: null
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // تحديث تلقائي لسعر الصرف
  useEffect(() => {
    let intervalId;

    const updateExchangeRate = async () => {
      try {
        const response = await settingsAPI.getLatestExchangeRate();
        if (response.success && response.data?.rate) {
          const newRate = response.data.rate;
          // تحديث فقط إذا كان السعر مختلف
          if (newRate !== settings.exchangeRates.USD_TO_IQD) {
            setSettings(prev => ({
              ...prev,
              exchangeRates: {
                USD_TO_IQD: newRate,
                IQD_TO_USD: 1 / newRate
              },
              lastRateUpdate: new Date()
            }));
            setLastAutoUpdate(new Date());
          }
        }
      } catch (error) {
        console.error('Error fetching latest exchange rate:', error);
        toast.error('فشل في تحديث سعر الصرف التلقائي');
      }
    };

    // تحديث فوري عند تحميل الصفحة
    updateExchangeRate();
    
    // تحديث كل 5 دقائق
    intervalId = setInterval(updateExchangeRate, 5 * 60 * 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await settingsAPI.getSettings();
      
      if (response.data && response.data.settings) {
        setSettings(response.data.settings);
        setTempExchangeRate(response.data.settings.exchangeRates.USD_TO_IQD.toString());
      } else {
        throw new Error('تنسيق البيانات غير صحيح');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('خطأ في تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    if (field === 'defaultCurrency') {
      const shouldAutoConvert = value === 'USD';
      setSettings(prev => ({
        ...prev,
        defaultCurrency: value,
        autoConvertCurrency: shouldAutoConvert,
        displayCurrency: value
      }));

      if (shouldAutoConvert) {
        toast.info('تم تفعيل التحويل التلقائي للعملة لضمان عرض جميع المبالغ بالدولار الأمريكي');
      }
    } else if (field === 'displayCurrency') {
      setSettings(prev => ({
        ...prev,
        displayCurrency: value
      }));
    } else if (field === 'autoConvertCurrency' && !value && settings.defaultCurrency === 'USD') {
      toast.warning('لا يمكن إيقاف التحويل التلقائي عندما تكون العملة الافتراضية هي الدولار');
      return;
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        autoConvertCurrency: settings.defaultCurrency === 'USD' ? true : settings.autoConvertCurrency
      };
      
      // تحديث مدير العملة المركزي أولاً
      const currencyUpdateSuccess = await updateCurrencySettings(updatedSettings);
      
      if (currencyUpdateSuccess) {
        // ثم تحديث الإعدادات في قاعدة البيانات
        const response = await settingsAPI.updateSettings(updatedSettings);
        
        if (response.success) {
          await showSuccessAlert('تم حفظ الإعدادات بنجاح وسيتم تحديث جميع الصفحات');
          // تحديث الصفحة لتطبيق التغييرات على جميع المكونات
          refreshPage();
        } else {
          throw new Error(response.message || 'فشل في حفظ الإعدادات');
        }
      } else {
        throw new Error('فشل في تحديث إعدادات العملة');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExchangeRate = async () => {
    try {
      setSaving(true);
      
      const response = await settingsAPI.getLatestExchangeRate();
      if (response.success && response.data?.rate) {
        const newRate = response.data.rate;
        
        // تحديث في قاعدة البيانات
        const updateResponse = await settingsAPI.updateExchangeRates({
          USD_TO_IQD: newRate
        });
        
        if (updateResponse.success) {
          setSettings(prev => ({
            ...prev,
            exchangeRates: {
              USD_TO_IQD: newRate,
              IQD_TO_USD: 1 / newRate
            },
            lastRateUpdate: new Date()
          }));
          toast.success('تم تحديث سعر الصرف بنجاح');
        } else {
          throw new Error(updateResponse.message || 'فشل في تحديث أسعار الصرف');
        }
      } else {
        throw new Error('فشل في الحصول على سعر الصرف الحالي');
      }
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحديث أسعار الصرف');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConversion = async () => {
    try {
      if (!conversionTest.amount || parseFloat(conversionTest.amount) <= 0) {
        toast.error('يرجى إدخال مبلغ صحيح للتحويل');
        return;
      }

      const response = await settingsAPI.convertCurrency({
        amount: parseFloat(conversionTest.amount),
        fromCurrency: conversionTest.fromCurrency,
        toCurrency: conversionTest.toCurrency
      });

      if (response.success && response.data) {
        const { originalAmount, convertedAmount, fromCurrency, toCurrency } = response.data;
        const formattedResult = `${originalAmount.toLocaleString()} ${formatCurrencySymbol(fromCurrency)} = ${convertedAmount.toLocaleString()} ${formatCurrencySymbol(toCurrency)}`;
        
        setConversionTest(prev => ({
          ...prev,
          result: formattedResult
        }));
      } else {
        throw new Error(response.message || 'فشل في تحويل العملة');
      }
    } catch (error) {
      console.error('Error testing conversion:', error);
      toast.error(error.message || 'حدث خطأ أثناء تحويل العملة');
      setConversionTest(prev => ({
        ...prev,
        result: null
      }));
    }
  };

  const handleResetSettings = async () => {
    const confirmed = await showDeleteConfirmation(
      'إعدادات النظام',
      'الإعدادات',
      'هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟'
    );

    if (confirmed) {
      try {
        setSaving(true);
        
        const response = await settingsAPI.resetSettings();
        
        if (response.success) {
          await showSuccessAlert('تم إعادة تعيين الإعدادات بنجاح');
          fetchSettings();
        } else {
          throw new Error(response.message || 'فشل في إعادة تعيين الإعدادات');
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        toast.error(error.message || 'حدث خطأ أثناء إعادة تعيين الإعدادات');
      } finally {
        setSaving(false);
      }
    }
  };

  const formatLastUpdate = (date) => {
    return new Date(date).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <PageLoadingSpinner message="جاري تحميل إعدادات النظام..." />;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={fetchSettings} />;
  }

  return (
    <Box className="content-area">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        </Box>
    
      </Box>

      <Grid container spacing={4} sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        {/* Currency Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '330px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CurrencyIcon sx={{ color: '#28a745' }} />
                <Typography variant="h6" sx={{ fontFamily: 'Cairo', fontWeight: 600 }}>
                  إعدادات العملة
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Default Currency */}
                <FormControl fullWidth>
                  <InputLabel sx={{ fontFamily: 'Cairo' }}>العملة الافتراضية</InputLabel>
                  <Select
                    value={settings.defaultCurrency}
                    label="العملة الافتراضية"
                    onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                    sx={{ fontFamily: 'Cairo' }}
                  >
                    <MenuItem value="IQD" sx={{ fontFamily: 'Cairo' }}>
                      دينار عراقي (د.ع)
                    </MenuItem>
                    <MenuItem value="USD" sx={{ fontFamily: 'Cairo' }}>
                      دولار أمريكي ($)
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Display Currency */}
                <FormControl fullWidth>
                  <InputLabel sx={{ fontFamily: 'Cairo' }}>عرض العملة</InputLabel>
                  <Select
                    value={settings.displayCurrency}
                    label="عرض العملة"
                    onChange={(e) => handleSettingChange('displayCurrency', e.target.value)}
                    sx={{ fontFamily: 'Cairo' }}
                  >
                    <MenuItem value="IQD" sx={{ fontFamily: 'Cairo' }}>
                      دينار عراقي فقط
                    </MenuItem>
                    <MenuItem value="USD" sx={{ fontFamily: 'Cairo' }}>
                      دولار أمريكي فقط
                    </MenuItem>
                    <MenuItem value="BOTH" sx={{ fontFamily: 'Cairo' }}>
                      كلاهما
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Auto Convert */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoConvertCurrency}
                      onChange={(e) => handleSettingChange('autoConvertCurrency', e.target.checked)}
                      color="success"
                    />
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Exchange Rates */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '330px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <RefreshIcon sx={{ color: '#28a745' }} />
                <Typography variant="h6" sx={{ fontFamily: 'Cairo', fontWeight: 600 }}>
                  أسعار الصرف
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Current Rates */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'Cairo', mb: 1 }}>
                    الأسعار الحالية:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, direction: 'ltr' }}>
                    <Chip 
                      label={`1 USD = ${settings.exchangeRates.USD_TO_IQD} IQD`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip 
                      label={`1 IQD = ${settings.exchangeRates.IQD_TO_USD.toFixed(6)} USD`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {lastAutoUpdate && (
                      <Typography variant="caption" sx={{ fontFamily: 'Cairo', color: 'text.secondary' }}>
                        آخر تحديث تلقائي: {formatLastUpdate(lastAutoUpdate)}
                      </Typography>
                    )}
                  </Box>
                </Box>

               
                {/* Update Rate */}
                <TextField
                  fullWidth
                  label="سعر الدولار بالدينار العراقي"
                  value={tempExchangeRate}
                  disabled={true}
                  onChange={(e) => setTempExchangeRate(e.target.value)}
                  type="number"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          onClick={handleUpdateExchangeRate}
                          size="small"
                          disabled={true}
                          sx={{ fontFamily: 'Cairo' }}
                        >
                          تحديث يدوي
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                    '& .MuiInputBase-input': { fontFamily: 'Cairo' }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Currency Converter Test */}
        <Grid item xs={12} md={6}>
          <Card sx={{height: '170px'}}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Cairo', fontWeight: 600, mb: 3 ,textAlign: 'center'}}>
                اختبار تحويل العملة
              </Typography>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="المبلغ"
                    value={conversionTest.amount}
                    onChange={(e) => setConversionTest(prev => ({ ...prev, amount: e.target.value }))}
                    type="number"
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                      '& .MuiInputBase-input': { fontFamily: 'Cairo' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontFamily: 'Cairo' }}>من</InputLabel>
                    <Select
                      value={conversionTest.fromCurrency}
                      label="من"
                      onChange={(e) => setConversionTest(prev => ({ ...prev, fromCurrency: e.target.value }))}
                      sx={{ fontFamily: 'Cairo' }}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="IQD">IQD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontFamily: 'Cairo' }}>إلى</InputLabel>
                    <Select
                      value={conversionTest.toCurrency}
                      label="إلى"
                      onChange={(e) => setConversionTest(prev => ({ ...prev, toCurrency: e.target.value }))}
                      sx={{ fontFamily: 'Cairo' }}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="IQD">IQD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleTestConversion}
                    sx={{ fontFamily: 'Cairo', backgroundColor: '#28a745' }}
                  >
                    تحويل
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  {conversionTest.result && (
                    <Alert severity="info" sx={{ fontFamily: 'Cairo',fontSize: '13px' }}>
                      النتيجة: {conversionTest.result}
                    </Alert>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center',flexDirection: 'column',height: '120px' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
                sx={{
                  fontFamily: 'Cairo',
                  backgroundColor: '#28a745',
                  px: 4,
                  '&:hover': { backgroundColor: '#218838' }
                }}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleResetSettings}
                disabled={saving}
                sx={{
                  fontFamily: 'Cairo',
                  borderColor: '#dc3545',
                  color: '#dc3545',
                  px: 4,
                  '&:hover': { 
                    borderColor: '#c82333',
                    backgroundColor: 'rgba(220, 53, 69, 0.04)'
                  }
                }}
              >
                إعادة تعيين
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 