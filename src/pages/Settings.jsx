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
  Tooltip,
  CardHeader,
  Stack
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CurrencyExchange as CurrencyIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  RestartAlt as ResetIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { settingsAPI } from '../services/apiHelpers';
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import { showSuccessAlert, showDeleteConfirmation } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

const formatCurrencySymbol = (currency) => {
  return currency === 'USD' ? '$' : 'د.ع';
};

const styles = {
  card: {
    height: '100%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transform: 'translateY(-2px)'
    }
  },
  cardHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #eee',
    '& .MuiCardHeader-title': {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: '#2c3e50',
      
    }
  },
  cardContent: {
    padding: 3,
    '&:last-child': {
      paddingBottom: 3
    }
  },
  formControl: {
    width: '100%',
    marginBottom: 2
  },
  button: {
    fontFamily: 'Cairo',
    textTransform: 'none',
    borderRadius: '8px',
    boxShadow: 'none',
    '&:hover': {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  },
  primaryButton: {
    backgroundColor: '#28a745',
    color: 'white',
    '&:hover': {
      backgroundColor: '#218838'
    }
  },
  warningButton: {
    borderColor: '#dc3545',
    color: '#dc3545',
    '&:hover': {
      backgroundColor: 'rgba(220, 53, 69, 0.04)',
      borderColor: '#c82333'
    }
  },
  chip: {
    borderRadius: '6px',
    '& .MuiChip-label': {
      fontFamily: 'Cairo'
    }
  }
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    fetchSettings();
  }, []);

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
      
      const currencyUpdateSuccess = await updateCurrencySettings(updatedSettings);
      
      if (currencyUpdateSuccess) {
        const response = await settingsAPI.updateSettings(updatedSettings);
        
        if (response.success) {
          await showSuccessAlert('تم حفظ الإعدادات بنجاح وسيتم تحديث جميع الصفحات');
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
      const newRate = parseFloat(tempExchangeRate);
      
      if (!newRate || newRate <= 0) {
        toast.error('يرجى إدخال سعر صرف صحيح (أكبر من صفر)');
        return;
      }

      if (newRate < 1000 || newRate > 2000) {
        const confirmed = await showDeleteConfirmation(
          'تأكيد سعر الصرف',
          'سعر الصرف',
          'سعر الصرف المدخل غير معتاد. هل أنت متأكد من صحة هذا السعر؟'
        );
        if (!confirmed) return;
      }

      setSaving(true);
      
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

        await updateCurrencySettings({
          exchangeRates: {
            USD_TO_IQD: newRate,
            IQD_TO_USD: 1 / newRate
          }
        });

        toast.success('تم تحديث سعر الصرف بنجاح');
        

        refreshPage();
      } else {
        throw new Error(updateResponse.message || 'فشل في تحديث أسعار الصرف');
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

  if (loading) {
    return <PageLoadingSpinner message="جاري تحميل إعدادات النظام..." />;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={fetchSettings} />;
  }

  return (
    <Box className="content-area">
  

      <Grid container spacing={3} sx={{display: 'flex', justifyContent: 'center', alignItems: 'center',mt: 10}}>
        <Grid item xs={12} md={6}>
          <Card sx={styles.card}>
            <CardHeader
              avatar={<CurrencyIcon sx={{ color: '#28a745' }} />}
              title="إعدادات العملة"
              sx={styles.cardHeader}
            />
            <CardContent sx={styles.cardContent}>
              <Stack spacing={3}>
                <FormControl sx={styles.formControl}>
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

                <FormControl sx={styles.formControl}>
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

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoConvertCurrency}
                      onChange={(e) => handleSettingChange('autoConvertCurrency', e.target.checked)}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontFamily: 'Cairo' }}>
                        تحويل تلقائي للعملة
                      </Typography>
                      <Tooltip title="تحويل جميع المبالغ تلقائياً إلى العملة المحددة" arrow>
                        <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={styles.card}>
            <CardHeader
              avatar={<MoneyIcon sx={{ color: '#28a745' }} />}
              title="أسعار الصرف"
              sx={styles.cardHeader}
            />
            <CardContent sx={styles.cardContent}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontFamily: 'Cairo', mb: 1, color: '#2c3e50' }}>
                    الأسعار الحالية:
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip 
                      label={`1 USD = ${settings.exchangeRates.USD_TO_IQD} IQD`}
                      color="success"
                      variant="outlined"
                      sx={styles.chip}
                    />
                    <Chip 
                      label={`1 IQD = ${settings.exchangeRates.IQD_TO_USD.toFixed(6)} USD`}
                      color="primary"
                      variant="outlined"
                      sx={styles.chip}
                    />
                  </Stack>
                </Box>

                <TextField
                  fullWidth
                  label="سعر الدولار بالدينار العراقي"
                  value={tempExchangeRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value || /^\d*\.?\d*$/.test(value)) {
                      setTempExchangeRate(value);
                    }
                  }}
                  type="text"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          onClick={handleUpdateExchangeRate}
                          size="small"
                          disabled={saving}
                          sx={{ ...styles.button, ...styles.primaryButton }}
                        >
                          {saving ? 'جاري التحديث...' : 'تحديث'}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                    '& .MuiInputBase-input': { fontFamily: 'Cairo' }
                  }}
                  helperText="أدخل سعر صرف الدولار مقابل الدينار العراقي"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={styles.card}>
            <CardHeader
              avatar={<RefreshIcon sx={{ color: '#28a745' }} />}
              title="اختبار تحويل العملة"
              sx={styles.cardHeader}
            />
            <CardContent sx={styles.cardContent}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
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
                <Grid item xs={12} sm={3}>
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
                <Grid item xs={12} sm={3}>
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
                <Grid item xs={12} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleTestConversion}
                    sx={{ ...styles.button, ...styles.primaryButton }}
                  >
                    تحويل
                  </Button>
                </Grid>
                {conversionTest.result && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="info" 
                      sx={{ 
                        fontFamily: 'Cairo',
                        fontSize: '13px',
                        backgroundColor: '#e8f4fd',
                        '& .MuiAlert-icon': {
                          color: '#0288d1'
                        }
                      }}
                    >
                      النتيجة: {conversionTest.result}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              backgroundColor: '#f8f9fa',
              borderRadius: '12px'
            }}
          >
            <Stack direction="row" spacing={6} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<SaveIcon sx={{marginLeft: 1}} />}
                onClick={handleSaveSettings}
                disabled={saving}
                sx={{ 
                  ...styles.button, 
                  ...styles.primaryButton,
                  minWidth: '180px'
                }}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ResetIcon sx={{marginLeft: 1}} />}
                onClick={handleResetSettings}
                disabled={saving}
                sx={{ 
                  ...styles.button, 
                  ...styles.warningButton,
                  minWidth: '180px'
                }}
              >
                إعادة تعيين
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 