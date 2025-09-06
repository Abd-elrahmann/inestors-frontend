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
  InputAdornment,
  Switch,
  FormControlLabel,
  Alert,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import Api from '../services/api';
import { toast } from 'react-toastify';
import { useSettings } from '../hooks/useSettings';

const EditRolloverModal = ({ open, onClose, financialYear, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { data: settings } = useSettings();
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    rolloverEnabled: false,
    rolloverPercentage: ''
  });

  useEffect(() => {
    if (financialYear && open) {
      setFormData({
        rolloverEnabled: financialYear.rolloverEnabled || false,
        rolloverPercentage: financialYear.rolloverPercentage || ''
      });
    }
  }, [financialYear, open]);

  const validateForm = () => {
    const newErrors = {};

    if (formData.rolloverEnabled) {
      if (!formData.rolloverPercentage) {
        newErrors.rolloverPercentage = 'نسبة التدوير مطلوبة';
      } else if (formData.rolloverPercentage < 1) {
        newErrors.rolloverPercentage = 'يجب أن تكون النسبة أكبر من 0';
      } else if (formData.rolloverPercentage > 100) {
        newErrors.rolloverPercentage = 'يجب أن تكون النسبة أقل من أو تساوي 100';
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
      await Api.patch(`/api/financial-years/${financialYear.id}/rollover`, {
        rolloverEnabled: formData.rolloverEnabled,
        rolloverPercentage: formData.rolloverPercentage
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
        rolloverEnabled: false,
        rolloverPercentage: ''
      });
      setErrors({});
      onClose();
    }
  };

  const calculateRolloverAmount = () => {
    if (!formData.rolloverEnabled || !financialYear?.totalProfit || !formData.rolloverPercentage) {
      return { rolloverAmount: 0, distributionAmount: 0 };
    }
    const rolloverAmount = (financialYear.totalProfit * formData.rolloverPercentage) / 100;
    const distributionAmount = financialYear.totalProfit - rolloverAmount;
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
          <span>تعديل إعدادات التدوير</span>
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
              يمكنك تعديل إعدادات التدوير للسنة المالية {financialYear?.year}
            </Alert>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.rolloverEnabled}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      rolloverEnabled: e.target.checked,
                      rolloverPercentage: e.target.checked ? prev.rolloverPercentage : ''
                    }));
                  }}
                  disabled={loading}
                />
              }
              label="تفعيل التدوير"
            />

            {formData.rolloverEnabled && (
              <TextField
                fullWidth
                label="نسبة التدوير"
                type="number"
                inputProps={{ 
                  min: 0,
                  max: 100,
                  step: 1,
                  onKeyPress: (e) => {
                    if (e.key === '-' || e.key === '+') {
                      e.preventDefault();
                    }
                  }
                }}
                value={formData.rolloverPercentage}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(100, parseInt(e.target.value) || ''));
                  setFormData(prev => ({
                    ...prev,
                    rolloverPercentage: value
                  }));
                }}
                error={!!errors.rolloverPercentage}
                helperText={
                  errors.rolloverPercentage ||
                  (formData.rolloverPercentage > 0 && financialYear?.totalProfit && 
                    `سيتم توزيع ${distributionAmount.toLocaleString()} ${settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'} على المساهمين وتدوير ${rolloverAmount.toLocaleString()} ${settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}`)
                }
                disabled={loading}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            )}
            
            {financialYear && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  إجمالي أرباح السنة: {financialYear.totalProfit?.toLocaleString()} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                </Typography>
                <Typography variant="body2">
                  الحالة الحالية: {financialYear.rolloverEnabled ? `مفعل (${financialYear.rolloverPercentage}%)` : 'غير مفعل'}
                </Typography>
              </Box>
            )}
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

export default EditRolloverModal;