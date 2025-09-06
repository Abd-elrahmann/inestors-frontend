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
import EmailIcon from '@mui/icons-material/Email';
const AddInvestorModal = ({ open, onClose, onSuccess, userData = null, mode = 'normal', investorData = null }) => {
  const [loading, setLoading] = useState(false);
  const { currentCurrency } = useCurrencyManager();
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    email: '',
    amount: ''
  });

  useEffect(() => {
    if (mode === 'fromUser' && userData) {
      setFormData({
        userId: userData.userId || '',
        fullName: userData.fullName || userData.userName || '',
        email: userData.email || '',
        amount: ''
      });
    } else if (mode === 'edit' && investorData) {
      setFormData({
        userId: investorData.userId || '',
        fullName: investorData.fullName || '',
        email: investorData.email || '',
        amount: investorData.amount?.toString() || '' // Convert amount to string
      });
    } else {
      setFormData({
        userId: '',
        fullName: '',
        email: '',
        amount: ''
      });
    }
  }, [mode, userData, investorData]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'يجب أن يكون المبلغ رقماً موجباً';
    }

    if (mode !== 'fromUser' && mode !== 'edit') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'اسم المستثمر مطلوب';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
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
      const payload = {
        amount: parseFloat(formData.amount)
      };

      let result;
      if (mode === 'edit') {
        result = await Api.put(`/api/investors/${investorData.userId}`, payload);
        toast.success('تم تعديل المستثمر بنجاح');
      } else {
        result = await Api.post(`/api/investors/${userData.userId}`, payload);
        toast.success('تم إضافة المستثمر بنجاح');
      }
      
      setFormData({
        userId: '',
        fullName: '',
        email: '',
        amount: ''
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
        userId: '',
        fullName: '',
        email: '',
        amount: ''
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
              label="مسلسل المستثمر"
              value={formData.userId}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              error={!!errors.userId}
              helperText={errors.userId}
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
              disabled={loading || mode === 'fromUser' || mode === 'edit'}
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
              type="email"
              label="البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading || mode === 'fromUser' || mode === 'edit'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#28a745' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              sx={{width:'300px'}}
              type="number"
              label={`المبلغ (${currentCurrency})`}
              value={formData.amount} // Remove formatAmount here
              onChange={(e) => handleInputChange('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {currentCurrency === 'USD' ? '$' : 'د.ع'}
                  </InputAdornment>
                ),
              }}
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