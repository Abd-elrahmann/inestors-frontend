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
import PhoneIcon from '@mui/icons-material/Phone';
import { toast } from 'react-toastify';

const AddInvestorModal = ({ open, onClose, onSuccess, userData = null, mode = 'normal' }) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    defaultCurrency: 'USD',
    USDtoIQD: 0
  });
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    phone: '',
    amount: ''
  });

  useEffect(() => {
    if (mode === 'fromUser' && userData) {
      setFormData({
        id: userData.id || '',
        fullName: userData.fullName || userData.userName || '',
        phone: userData.phone || '',
        amount: ''
      });
    } else {
      setFormData({
        id: '',
        fullName: '',
        phone: '',
        amount: ''
      });
    }
    fetchSettings();
  }, [mode, userData]);

  const [errors, setErrors] = useState({});

  const fetchSettings = async () => {
      const response = await Api.get('/api/settings');
      if (response.data) {
      setSettings({
        defaultCurrency: response.data.defaultCurrency,
        USDtoIQD: response.data.USDtoIQD
      });
    }
  };  

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'يجب أن يكون المبلغ رقماً موجباً';
    }

    if (mode !== 'fromUser') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'اسم المستثمر مطلوب';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'رقم الهاتف مطلوب';
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

      const result = await Api.post(`/api/investors/${userData.id}`, payload);
      toast.success('تم إضافة المستثمر بنجاح');
      
      setFormData({
        fullName: '',
        phone: '',
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
        fullName: '',
        phone: '',
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
          <span>إضافة مستثمر جديد</span>
        </Box>
        <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'black' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 1, px: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            
            <TextField
              sx={{width:'300px'}}
              label="مسلسل المستثمر"
              value={formData.id}
              onChange={(e) => handleInputChange('userId', e.target.value)}
              error={!!errors.id}
              helperText={errors.id}
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
              label="رقم الهاتف"
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
              label="المبلغ"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {settings.defaultCurrency === 'USD' ? '$' : 'د.ع'}
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
              'إضافة'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddInvestorModal;