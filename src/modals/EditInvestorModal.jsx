import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
 
} from '@mui/icons-material'; 
import { investorsAPI } from '../services/apiHelpers';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';

const EditInvestorModal = ({ open, onClose, onSuccess, investor }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    phone: '',
    phoneCountryCode: '+964',
    contribution: '',
    currency: 'IQD',
    startDate: ''
  });

 
  const countryCodes = [
    { code: '+964', name: 'العراق', flag: '🇮🇶' }
  ];

  const currencies = [
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' }
  ];

 
  useEffect(() => {
    if (open && investor) {
     
      let phoneNumber = '';
      let phoneCountryCode = '+964';
      
      if (investor.phone) {
        const phoneMatch = investor.phone.match(/(\+\d{1,4})?(\d+)/);
        if (phoneMatch) {
          phoneCountryCode = phoneMatch[1] || '+964';
          phoneNumber = phoneMatch[2] || '';
        }
      }
      
     
      let contributionAmount = '';
      if (typeof investor.contribution === 'string') {
        const contributionMatch = investor.contribution.match(/[\d,]+/);
        contributionAmount = contributionMatch ? contributionMatch[0].replace(/,/g, '') : '';
      } else if (typeof investor.contribution === 'number') {
        contributionAmount = investor.contribution.toString();
      }

      setFormData({
        name: investor.name || '',
        nationalId: investor.nationalId || '',
        phone: phoneNumber,
        phoneCountryCode: phoneCountryCode,
        contribution: contributionAmount,
        currency: investor.currency || 'IQD',
        startDate: investor.startDate ? new Date(investor.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setErrors({});
    }
  }, [open, investor]);

  const validateForm = () => {
    const newErrors = {};

   
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

   
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (!/^\d{10,14}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون بين 10-14 رقم';
    }

   
    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ انضمام المساهم مطلوب';
    }

   
    if (formData.phone.trim() && !/^\d{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف يجب أن يكون بين 7-15 رقم';
    }

   
    if (!formData.contribution || formData.contribution <= 0) {
      newErrors.contribution = 'مبلغ المساهمة مطلوب ويجب أن يكون أكبر من صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

   
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

    try {
      setLoading(true);

     
      const updateData = {
        fullName: formData.name.trim(),
        nationalId: formData.nationalId.trim(),
        phone: formData.phone.trim() ? formData.phoneCountryCode + formData.phone.trim() : '',
        amountContributed: parseFloat(formData.contribution),
        currency: formData.currency,
        startDate: formData.startDate
      };

      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await investorsAPI.update(investor.id, updateData);

      if (response.success) {
        await showSuccessAlert('تم تعديل بيانات المساهم بنجاح');
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.message || 'فشل في تعديل المساهم');
      }
    } catch (error) {
      console.error('Error updating investor:', error);
      showErrorAlert(error.message || 'حدث خطأ أثناء تعديل المساهم');
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
        startDate: ''
      });
      setErrors({});
      onClose();
    }
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm" 
      fullWidth
      TransitionProps={{
        timeout: { enter: 200, exit: 150 }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh',
          width: '50%'
        }
      }}
    >
      <DialogTitle >
        <IconButton 
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            color: 'green',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 2, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '60%', mx: 'auto' }}>
           
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

           
            <TextField
              fullWidth
              label="رقم الهاتف"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Select
                      value={formData.phoneCountryCode}
                      onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                      sx={{ mr: 1, minWidth: 100 }}
                    >
                      {countryCodes.map(country => (
                        <MenuItem key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </MenuItem>
                      ))}
                    </Select>
                  </InputAdornment>
                )
              }}
            />

           
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {currency.symbol}
                      </Typography>
                      <Typography variant="body2">
                        {currency.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

                
            <TextField
              fullWidth
              type="date"
              label="تاريخ الانضمام"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          gap: 3,
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
          direction:'ltr'
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
              'تعديل المساهم'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditInvestorModal; 