import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

import PhoneIcon from '@mui/icons-material/Phone';
import MoneyIcon from '@mui/icons-material/AccountBalance';
import { toast } from 'react-toastify';
import { investorsAPI } from '../utils/apiHelpers';

const AddInvestorModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    phoneCountryCode: '+964',
    contribution: '',
    currency: 'IQD',
    address: '',
    notes: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});

  const currencies = [
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' }
  ];

  const countryCodes = [
    { code: '+964', name: 'العراق', flag: '🇮🇶' }
  ];

  const validateForm = () => {
    const newErrors = {};

    // التحقق من الاسم
    if (!formData.name.trim()) {
      newErrors.name = 'اسم المساهم مطلوب';
    }

    // التحقق من الرقم الوطني
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'الرقم الوطني مطلوب';
    }

    // التحقق من مبلغ المساهمة
    if (!formData.contribution) {
      newErrors.contribution = 'مبلغ المساهمة مطلوب';
    } else if (isNaN(formData.contribution) || parseFloat(formData.contribution) <= 0) {
      newErrors.contribution = 'يجب أن يكون مبلغ المساهمة رقماً موجباً';
    }

    // التحقق من تاريخ الانضمام
    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ الانضمام مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for the field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Format the data for API (matching backend schema)
      const investorData = {
        fullName: formData.name.trim(),
        nationalId: formData.nationalId.trim(),
        phone: formData.phone.trim() ? `${formData.phoneCountryCode}${formData.phone.trim()}` : '',
        amountContributed: parseFloat(formData.contribution),
        currency: formData.currency,
        startDate: formData.startDate,
        address: formData.address?.trim(),
        notes: formData.notes?.trim()
      };

      // Call API using the existing helper
      const result = await investorsAPI.create(investorData);
      
      toast.success('تم إضافة المساهم بنجاح');
      
      // Reset form
      setFormData({
        name: '',
        nationalId: '',
        phone: '',
        phoneCountryCode: '+964',
        contribution: '',
        currency: 'IQD',
        address: '',
        notes: '',
        startDate: new Date().toISOString().split('T')[0]
      });
      
      // Close modal and refresh data
      onClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error adding investor:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة المساهم');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        nationalId: '',
        phone: '',
        phoneCountryCode: '+964',
        contribution: '',
        currency: 'IQD',
        address: '',
        notes: '',
        startDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      onClose();
    }
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '';
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{
        timeout: { enter: 200, exit: 150 } // ✅ انتقالات أسرع
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh', // ✅ ارتفاع أقل
          width: '50%'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#28a745',
        color: 'white',
        fontFamily: 'Cairo',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <span>إضافة مساهم جديد</span>
        </Box>
        <IconButton 
          onClick={handleClose}
          disabled={loading}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 2, px: 3 }}>
          <Grid container spacing={6} sx={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            {/* العمود الأيمن */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* الاسم الكامل */}
                <TextField
                  fullWidth
                  label="اسم المساهم"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#28a745' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Cairo'
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Cairo'
                    }
                  }}
                />



                {/* مبلغ المساهمة */}
                <TextField
                  fullWidth
                  type="number"
                  label="مبلغ المساهمة"
                  value={formData.contribution}
                  onChange={(e) => handleInputChange('contribution', e.target.value)}
                  error={!!errors.contribution}
                  helperText={errors.contribution}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon sx={{ color: '#28a745' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="body2" sx={{ color: '#28a745', fontWeight: 600 }}>
                          {getCurrencySymbol(formData.currency)}
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Cairo'
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Cairo'
                    }
                  }}
                />

              </Box>
            </Grid>

            {/* العمود الأيسر */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* رقم الهوية */}
                <TextField
                  fullWidth
                  label="رقم الهوية"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  error={!!errors.nationalId}
                  helperText={errors.nationalId}
                  disabled={loading}
                  inputProps={{ maxLength: 14 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Cairo'
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Cairo'
                    }
                  }}
                />

                {/* رقم الهاتف */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ fontFamily: 'Cairo', fontSize: '0.9rem' }}>كود الدولة</InputLabel>
                    <Select
                      value={formData.phoneCountryCode}
                      label="كود الدولة"
                      onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                      disabled={loading}
                      sx={{
                        fontFamily: 'Cairo',
                        fontSize: '0.9rem'
                      }}
                    >
                      {countryCodes.map((country) => (
                        <MenuItem key={country.code} value={country.code} sx={{ fontFamily: 'Cairo' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{country.flag}</span>
                            <Typography variant="body2" sx={{ fontFamily: 'Cairo' }}>
                              {country.code}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="رقم الهاتف (اختياري)"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    disabled={loading}
                    placeholder="123456789"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: '#28a745' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Cairo'
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'Cairo'
                      }
                    }}
                  />
                </Box>

                {/* العملة */}
                <FormControl fullWidth>
                  <InputLabel sx={{ fontFamily: 'Cairo' }}>العملة</InputLabel>
                  <Select
                    value={formData.currency}
                    label="العملة"
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    disabled={loading}
                    sx={{
                      fontFamily: 'Cairo'
                    }}
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code} sx={{ fontFamily: 'Cairo' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontFamily: 'Cairo' }}>
                            {currency.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Cairo' }}>
                            ({currency.code})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* تاريخ الانضمام */}
                <FormControl fullWidth>
                  <TextField
                    type="date"
                    label="تاريخ الانضمام"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    disabled={loading}
                    error={!!errors.startDate}
                    helperText={errors.startDate}
                    InputLabelProps={{
                      shrink: true,
                      sx: { fontFamily: 'Cairo' }
                    }}
                    sx={{
                      fontFamily: 'Cairo'
                    }}
                  />
                </FormControl>


              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          gap: 3,
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            size="large"
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 500,
              color: '#6c757d',
              borderColor: '#6c757d',
              px: 4,
              py: 1.5,
              minWidth: 120,
              '&:hover': {
                borderColor: '#495057',
                backgroundColor: 'rgba(108, 117, 125, 0.04)'
              }
            }}
          >
            إلغاء
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            size="large"
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 600,
              backgroundColor: '#28a745',
              px: 4,
              py: 1.5,
              minWidth: 140,
              '&:hover': {
                backgroundColor: '#218838'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>جاري الحفظ...</span>
              </Box>
            ) : (
              'إضافة المساهم'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddInvestorModal; 