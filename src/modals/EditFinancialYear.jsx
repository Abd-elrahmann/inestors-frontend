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
  CircularProgress,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const EditFinancialYearModal = ({ open, onClose, financialYear, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    periodName: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (financialYear && open) {
      setFormData({
        periodName: financialYear.periodName || '',
        startDate: financialYear.startDate ? dayjs(financialYear.startDate).format('MM/DD/YYYY') : '',
        endDate: financialYear.endDate ? dayjs(financialYear.endDate).format('MM/DD/YYYY') : ''
      });
    }
  }, [financialYear, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.periodName.trim()) {
      newErrors.periodName = 'اسم الفترة مطلوب';
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await Api.put(`/api/financial-years/${financialYear.id}`, {
        periodName: formData.periodName,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      toast.success('تم تحديث إعدادات التدوير بنجاح');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating rollover:', error);
      toast.error('فشل في تحديث إعدادات التدوير');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        periodName: '',
        startDate: '',
        endDate: ''
      });
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
          width: '50%',
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
          <span>تعديل السنة المالية</span>
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
            <Alert severity="info" sx={{ mb: 2 }}>
              يمكنك تعديل السنة المالية {financialYear?.year} في حاله انها قيد التوزيع.
            </Alert>

            <TextField
              fullWidth
              label="اسم الفترة"
              value={formData.periodName}
              onChange={(e) => setFormData(prev => ({ ...prev, periodName: e.target.value }))}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="تاريخ البدء"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              disabled={loading}
              placeholder="MM/DD/YYYY"
            />

            <TextField
              fullWidth
              label="تاريخ النهاية"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              disabled={loading}
              placeholder="MM/DD/YYYY"
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 3, justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            size="large"
          >
            إلغاء
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
              'حفظ التغييرات'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditFinancialYearModal;