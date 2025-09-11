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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { useQueryClient } from 'react-query';

const EditFinancialYearModal = ({ open, onClose, financialYear, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    periodName: '',
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    if (financialYear && open) {
      setFormData({
        periodName: financialYear.periodName || '',
        startDate: financialYear.startDate ? dayjs(financialYear.startDate) : null,
        endDate: financialYear.endDate ? dayjs(financialYear.endDate) : null
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
      const startDateStr = formData.startDate ? formData.startDate.format('YYYY-MM-DD') : null;
      const endDateStr = formData.endDate ? formData.endDate.format('YYYY-MM-DD') : null;

      await Api.put(`/api/financial-years/${financialYear.id}`, {
        periodName: formData.periodName,
        startDate: startDateStr,
        endDate: endDateStr
      });

      toast.success('تم تحديث السنة المالية بنجاح');
      queryClient.invalidateQueries('financial-years');
      queryClient.invalidateQueries('distributions');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating financial year:', error);
      toast.error('فشل في تحديث السنة المالية');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        periodName: '',
        startDate: null,
        endDate: null
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
              يمكنك تعديل السنة المالية {financialYear?.year} في حاله انها لم تتم الموافقة عليها.
            </Alert>

            <TextField
              fullWidth
              label="اسم الفترة"
              value={formData.periodName}
              onChange={(e) => setFormData(prev => ({ ...prev, periodName: e.target.value }))}
              disabled={loading}
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="تاريخ البدء"
                value={formData.startDate}
                onChange={(newValue) => setFormData(prev => ({ ...prev, startDate: newValue }))}
                disabled={loading}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />

              <DatePicker
                label="تاريخ النهاية"
                value={formData.endDate}
                onChange={(newValue) => setFormData(prev => ({ ...prev, endDate: newValue }))}
                disabled={loading}
                format="YYYY-MM-DD"
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
                <TextField
              fullWidth
              label="الفترة"
              value={formData.endDate && formData.startDate ? 
                `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1} يوم` : ''}
              disabled={true}
            />
            </LocalizationProvider>
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