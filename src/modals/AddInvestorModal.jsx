import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import Api from '../services/api';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { toast } from 'react-toastify';
import PhoneIcon from '@mui/icons-material/Phone';

const AddInvestorModal = ({ open, onClose, onSuccess, mode = 'normal', investorData = null }) => {
  const [loading, setLoading] = useState(false);
  const { currentCurrency, convertAmount } = useCurrencyManager();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    amount: '',
    createdAt: ''
  });

  useEffect(() => {
    if (mode === 'fromUser') {
      setFormData({
        id: '',
        fullName: '',
        phone: '',
        amount: '',
        createdAt: ''
      });
    } else if (mode === 'edit' && investorData) {
      const convertedAmount = convertAmount(investorData.amount, 'IQD', currentCurrency);
      const formattedDate = investorData.createdAt
      ? new Date(investorData.createdAt).toISOString().split('T')[0]
      : '';
      setFormData({
        id: investorData.id || '',
        fullName: investorData.fullName || '',
        phone: investorData.phone || '',
        amount: convertedAmount?.toString() || '',
        createdAt: formattedDate || ''
      });
    } else {
      setFormData({
        id: '',
        fullName: '',
        phone: '',
        amount: '',
        createdAt: ''
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, investorData, currentCurrency, open]); // Added open dependency to reset form when modal opens

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) < 0) {
      newErrors.amount = 'يجب أن يكون المبلغ رقماً موجباً';
    }
 
    if (mode !== 'fromUser' && mode !== 'edit') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'اسم المستثمر مطلوب';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'الهاتف مطلوب';
      } else if (!/^[0-9]+$/.test(formData.phone)) {
        newErrors.phone = 'الهاتف غير صحيح';
      }
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

    setLoading(true);
    
    try {
      const convertedAmount = convertAmount(parseFloat(formData.amount), currentCurrency, 'IQD');
      
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        amount: convertedAmount,
        createdAt: new Date(formData.createdAt)
      };

      let result;
      if (mode === 'edit') {
        result = await Api.put(`/api/investors/${investorData.id}`, payload);
        toast.success('تم تعديل المستثمر بنجاح');
      } else {
        result = await Api.post('/api/investors', payload);
        toast.success('تم إضافة المستثمر بنجاح');
      }
      
      // Reset form data after successful submission
      setFormData({
        id: '',
        fullName: '',
        phone: '',
        amount: '',
        createdAt: ''
      });
      
      onClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error:', error);
        if (error.response?.data) {
        const { message, error: errorMessage } = error.response.data;
        toast.error(message || errorMessage || 'حدث خطأ');
      } else {
        toast.error(error.message || 'حدث خطأ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        id: '',
        fullName: '',
        phone: '',
        amount: '',
        createdAt: ''
      });
      setErrors({});
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '40vh',
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
        fontWeight: 500
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <span>{mode === 'edit' ? 'تعديل مستثمر' : 'إضافة مستثمر جديد'}</span>
        </Box>
        <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'black' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 1, px: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            {mode === 'edit' && (
            <TextField
              sx={{width:'300px'}}
              label="المستثمر المرتبط"
              value={formData.id}
              onChange={(e) => handleInputChange('id', e.target.value)}
              error={!!errors.id} 
              helperText={errors.id}
              disabled={mode === 'edit'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#28a745' }} />
                  </InputAdornment>
                ),
              }}
            />
            )}
            <TextField
              sx={{width:'300px'}}
              label="اسم المستثمر"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              error={!!errors.fullName}
              helperText={errors.fullName}
              disabled={loading || mode === 'fromUser'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#28a745' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              sx={{width:'300px'}}
              type="number"
              label="الهاتف"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading || mode === 'fromUser'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#28a745' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              sx={{width:'300px'}}
              type="number"
              label={`المبلغ (${currentCurrency})`}
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              disabled={loading}
              inputProps={{
                step: "1",
                min: "0"
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {currentCurrency === 'USD' ? '$' : 'د.ع'}
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              sx={{width:'300px'}}
              type="date"
              label="تاريخ الانضمام"
              value={formData.createdAt}
              onChange={(e) => handleInputChange('createdAt', e.target.value)}
              error={!!errors.createdAt}
              helperText={errors.createdAt}
              disabled={loading}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, 
          gap: 3,
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
          direction:'ltr'
        }}>
          <Button onClick={handleClose} disabled={loading} variant="outlined" size="large" sx={{
            fontFamily: 'Cairo',
            fontWeight: 500,
            color: 'black',
            borderColor: '#6c757d',
          }}>
            إلغاء
          </Button>
          
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              mode === 'edit' ? 'تعديل' : 'إضافة'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddInvestorModal;