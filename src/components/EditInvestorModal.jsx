import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
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

  Phone as PhoneIcon,
  Money as MoneyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { investorsAPI } from '../utils/apiHelpers';
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
    address: '',
    notes: '',
    startDate: ''
  });

  // Country codes with flags
  const countryCodes = [
    { code: '+964', name: 'العراق', flag: '🇮🇶' }
  ];

  const currencies = [
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' }
  ];

  // Load investor data when modal opens
  useEffect(() => {
    if (open && investor) {
      // Extract phone number and country code
      let phoneNumber = '';
      let phoneCountryCode = '+964';
      
      if (investor.phone) {
        const phoneMatch = investor.phone.match(/(\+\d{1,4})?(\d+)/);
        if (phoneMatch) {
          phoneCountryCode = phoneMatch[1] || '+964';
          phoneNumber = phoneMatch[2] || '';
        }
      }
      
      // Extract contribution amount (remove currency symbol and formatting)
      const contributionMatch = investor.contribution?.match(/[\d,]+/);
      const contributionAmount = contributionMatch ? contributionMatch[0].replace(/,/g, '') : '';

      setFormData({
        name: investor.name || '',
        nationalId: investor.nationalId || '',
        phone: phoneNumber,
        phoneCountryCode: phoneCountryCode,
        contribution: contributionAmount,
        currency: investor.currency || 'IQD',
        address: investor.address || '',
        notes: investor.notes || '',
        startDate: investor.startDate ? new Date(investor.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setErrors({});
    }
  }, [open, investor]);

  const validateForm = () => {
    const newErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'الاسم مطلوب';
    }

    // Validate national ID
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (!/^\d{10,14}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون بين 10-14 رقم';
    }

    // Validate start date
    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ انضمام المساهم مطلوب';
    }

    // Validate phone (optional for Iraq)
    if (formData.phone.trim() && !/^\d{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف يجب أن يكون بين 7-15 رقم';
    }

    // Validate contribution
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

    // Clear error when user starts typing
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

      // Prepare data for API
      const updateData = {
        fullName: formData.name.trim(),
        nationalId: formData.nationalId.trim(),
        phone: formData.phone.trim() ? formData.phoneCountryCode + formData.phone.trim() : '',
        amountContributed: parseFloat(formData.contribution),
        currency: formData.currency,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        startDate: formData.startDate
      };

      // Remove undefined values
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
        address: '',
        notes: '',
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
      maxWidth="lg"
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
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          color: 'white',
          position: 'relative',
          textAlign: 'center',
          py: 3
        }}
      >
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            color: 'white',
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

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: 40 }} />
          <Typography variant="h5" sx={{ fontFamily: 'Cairo', fontWeight: 700 }}>
            تعديل بيانات المساهم
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'Cairo', opacity: 0.9 }}>
            تعديل معلومات المساهم في النظام
          </Typography>
        </Box>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={6}>
            {/* العمود الأيمن */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* الاسم */}
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

                {/* العنوان */}
                <TextField
                  fullWidth
                  label="العنوان (اختياري)"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={loading}
                  multiline
                  rows={3}
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
                <Grid item xs={12} sm={6}>
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
                </Grid>

                {/* حقل تاريخ الانضمام */}
                <Grid item xs={12} sm={6}>
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
                </Grid>

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

                {/* ملاحظات */}
                <TextField
                  fullWidth
                  label="ملاحظات (اختياري)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  disabled={loading}
                  multiline
                  rows={3}
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
          </Grid>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          background: 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)',
          borderTop: '1px solid #dee2e6',
          p: 3,
          justifyContent: 'center',
          gap: 2
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{
            fontFamily: 'Cairo',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderColor: '#6c757d',
            color: '#6c757d',
            '&:hover': {
              borderColor: '#5a6268',
              backgroundColor: '#6c757d',
              color: 'white'
            }
          }}
        >
          إلغاء
        </Button>
        
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          sx={{
            fontFamily: 'Cairo',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            backgroundColor: '#28a745',
            '&:hover': {
              backgroundColor: '#218838'
            }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              جاري التحديث...
            </>
          ) : (
            'تعديل المساهم'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditInvestorModal; 