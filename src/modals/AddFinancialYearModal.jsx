import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Switch,
  FormControlLabel,
  FormHelperText,
  Divider,
  Typography,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Api from '../services/api';
import { toast } from 'react-toastify';
import {useSettings} from '../hooks/useSettings';

const AddFinancialYearModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { data: settings } = useSettings();
  const years = Array.from({length: 16}, (_, i) => 2025 + i);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    periodName: '',
    totalProfit: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    rolloverEnabled: false,
    rolloverPercentage: '',
    autoRollover: false,
    autoRolloverDate: null,
    autoRolloverStatus: 'pending'
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.year) {
      newErrors.year = 'السنة مطلوبة';
    }

    if (!formData.periodName.trim()) {
      newErrors.periodName = 'اسم الفترة مطلوب';
    }

    if (!formData.totalProfit || formData.totalProfit < 1) {
      newErrors.totalProfit = 'يجب أن يكون الربح أكبر من 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ البداية مطلوب';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'تاريخ النهاية مطلوب';
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية';
    }

    if (formData.rolloverEnabled) {
      if (formData.autoRollover) {
        if (!formData.autoRolloverDate) {
          newErrors.autoRolloverDate = 'تاريخ التدوير مطلوب';
        } else if (new Date(formData.autoRolloverDate) <= new Date(formData.startDate)) {
          newErrors.autoRolloverDate = 'تاريخ التدوير يجب أن يكون بعد تاريخ البداية';
        }
      } else {
        if (!formData.rolloverPercentage || formData.rolloverPercentage < 1 || formData.rolloverPercentage > 100) {
          newErrors.rolloverPercentage = 'يجب أن تكون النسبة بين 1 و 100';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const formattedValues = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        autoRolloverDate: formData.autoRolloverDate ? new Date(formData.autoRolloverDate).toISOString() : null
      };
      
      await Api.post('/api/financial-years', formattedValues);
      toast.success('تم إضافة السنة المالية بنجاح');
      
      onSuccess();
      handleClose();
      
    } catch (error) {
      console.error('Error adding financial year:', error);
      toast.error('فشل في إضافة السنة المالية');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        year: new Date().getFullYear(),
        periodName: '',
        totalProfit: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        rolloverEnabled: false,
        rolloverPercentage: '',
        autoRollover: false,
        autoRolloverDate: null,
        autoRolloverStatus: 'pending'
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateRolloverAmount = () => {
    if (!formData.rolloverEnabled || !formData.totalProfit || !formData.rolloverPercentage) {
      return { rolloverAmount: 0, distributionAmount: 0 };
    }
    const rolloverAmount = (formData.totalProfit * formData.rolloverPercentage) / 100;
    const distributionAmount = formData.totalProfit - rolloverAmount;
    return { rolloverAmount, distributionAmount };
  };

  const { rolloverAmount, distributionAmount } = calculateRolloverAmount();

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '50vh',
          width: '50%',
          scrollbarWidth: 'none',
        }
      }}
      dir={'rtl'}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        color: 'black',
        fontFamily: 'Cairo',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceIcon />
          <span>إضافة سنة مالية جديدة</span>
        </Box>
        <IconButton 
          onClick={handleClose}
          disabled={loading}
          sx={{ color: 'black' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 2, px: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            width: '80%',
            mx: 'auto'
          }}>
            <Autocomplete
              fullWidth
              options={years}
              value={formData.year}
              getOptionLabel={(option) => option?.toString() || ''}
              onChange={(_, newValue) => handleInputChange('year', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="السنة"
                  error={!!errors.year}
                  helperText={errors.year}
                  disabled={loading}
                />
              )}
            />
            
            <TextField
              fullWidth
              label="اسم الفترة"
              value={formData.periodName}
              onChange={(e) => handleInputChange('periodName', e.target.value)}
              error={!!errors.periodName}
              helperText={errors.periodName}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="إجمالي الربح"
              type="number"
              inputProps={{ 
                min: 0,
                step: 1,
                onKeyPress: (e) => {
                  if (e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }
              }}
              value={formData.totalProfit}
              onChange={(e) => {
                const value = Math.max(0, parseInt(e.target.value) || 0);
                handleInputChange('totalProfit', value);
              }}
              error={!!errors.totalProfit}
              helperText={errors.totalProfit}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="تاريخ البداية"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              error={!!errors.startDate}
              helperText={errors.startDate}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="تاريخ النهاية"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              error={!!errors.endDate}
              helperText={errors.endDate}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="الفترة"
              value={formData.endDate && formData.startDate ? 
                `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} يوم` : ''}
              disabled={true}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                إعدادات التدوير
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                التدوير التلقائي يتم في نهاية السنة المالية. إذا تم تعطيله، يمكنك تحديد تاريخ مخصص للتدوير.
              </Alert>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.rolloverEnabled}
                    onChange={(e) => {
                      handleInputChange('rolloverEnabled', e.target.checked);
                      if (!e.target.checked) {
                        handleInputChange('autoRollover', false);
                        handleInputChange('rolloverPercentage', '');
                        handleInputChange('autoRolloverDate', null);
                      }
                    }}
                    disabled={loading}
                  />
                }
                label="تفعيل التدوير"
              />

              {formData.rolloverEnabled && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoRollover}
                        onChange={(e) => {
                          handleInputChange('autoRollover', e.target.checked);
                          if (e.target.checked) {
                            handleInputChange('autoRolloverDate', null);
                          }
                        }}
                        disabled={loading}
                      />
                    }
                    label="تدوير تلقائي"
                  />

                  <TextField
                    fullWidth
                    label="نسبة التدوير"
                    type="number"
                    inputProps={{ 
                      min: 0,
                      step: 1,
                      onKeyPress: (e) => {
                        if (e.key === '-' || e.key === '+') {
                          e.preventDefault();
                        }
                      }
                    }}
                    value={formData.rolloverPercentage}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || '');
                      handleInputChange('rolloverPercentage', value);
                    }}
                    error={!!errors.rolloverPercentage}
                    helperText={
                      errors.rolloverPercentage ||
                      (formData.rolloverPercentage > 0 && 
                        `سيتم توزيع ${distributionAmount} ${settings?.defaultCurrency} على المساهمين وتدوير ${rolloverAmount} ${settings?.defaultCurrency}`)
                    }
                    disabled={loading}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{ mt: 2 }}
                  />

                  {formData.autoRollover && (
                    <TextField
                      fullWidth
                      label="تاريخ التدوير"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.autoRolloverDate || ''}
                      onChange={(e) => handleInputChange('autoRolloverDate', e.target.value)}
                      error={!!errors.autoRolloverDate}
                      helperText={errors.autoRolloverDate}
                      disabled={loading}
                      sx={{ mt: 2 }}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 3, justifyContent: 'space-between',flexDirection:'row-reverse' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            size="large"
          >
            الغاء
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            size="large"
            sx={{ backgroundColor: 'primary.main' }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'اضافة'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
export default AddFinancialYearModal;