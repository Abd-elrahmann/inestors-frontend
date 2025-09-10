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
  });

  const [errors, setErrors] = useState({});
  const formatNumber = (num) => {
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.year) {
      newErrors.year = 'السنة مطلوبة';
    } 

    if (!formData.periodName.trim()) {
      newErrors.periodName = 'اسم الفترة مطلوب';
    }

    if (!formData.totalProfit || formData.totalProfit.replace(/,/g, '') < 1) {
      newErrors.totalProfit = 'يجب أن يكون مبلغ التوزيع أكبر من 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ البداية مطلوب';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'تاريخ النهاية مطلوب';
    } else if (new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية';
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
      const endDate = new Date(formData.endDate);
      endDate.setHours(20, 59, 59, 999);

      const formattedValues = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: endDate.toISOString()
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
      });
      setErrors({});
      onClose();
    }
  };  

  const handleInputChange = (field, value) => {
    if (field === 'totalProfit') {
      const rawValue = value.replace(/,/g, '');
      if (!isNaN(rawValue)) {
        value = formatNumber(rawValue);
      }
    }
      setFormData(prev => ({
      ...prev,
      [field]: value
    }));  
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '40vh',
          width: '40%',
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
        <DialogContent sx={{ mt: -2, px: 3 }}>
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
              label="مبلغ التوزيع"
              value={formData.totalProfit}
              onChange={(e) => handleInputChange('totalProfit', e.target.value)}
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
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 3, justifyContent: 'center',display: 'flex',alignItems: 'center',direction:'ltr' }}>
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