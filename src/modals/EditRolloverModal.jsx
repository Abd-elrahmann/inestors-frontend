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
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Api from '../services/api';
import { toast } from 'react-toastify';
import { useSettings } from '../hooks/useSettings';

const EditRolloverModal = ({ open, onClose, financialYear, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { data: settings } = useSettings();

  useEffect(() => {
    if (financialYear && open) {
      formik.setValues({
        rolloverEnabled: financialYear.rolloverEnabled || false,
        rolloverPercentage: financialYear.rolloverPercentage || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYear, open]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      rolloverEnabled: false,
      rolloverPercentage: '',
    },
    validationSchema: Yup.object({
      rolloverPercentage: Yup.number()
        .when('rolloverEnabled', {
          is: true,
          then: Yup.number()
            .min(1, 'يجب أن تكون النسبة أكبر من 0')
            .max(100, 'يجب أن تكون النسبة أقل من أو تساوي 100')
            .required('نسبة التدوير مطلوبة')
        }),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await Api.patch(`/api/financial-years/${financialYear.id}/rollover`, {
          rolloverEnabled: values.rolloverEnabled,
          rolloverPercentage: values.rolloverPercentage
        });
        toast.success('تم تحديث إعدادات التدوير بنجاح');
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Error updating rollover:', error);
        toast.error('فشل في تحديث إعدادات التدوير');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleClose = () => {
    if (!loading) {
      formik.resetForm();
      onClose();
    }
  };

  const calculateRolloverAmount = () => {
    if (!formik.values.rolloverEnabled || !financialYear?.totalProfit || !formik.values.rolloverPercentage) {
      return { rolloverAmount: 0, distributionAmount: 0 };
    }
    const rolloverAmount = (financialYear.totalProfit * formik.values.rolloverPercentage) / 100;
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
      
      <form onSubmit={formik.handleSubmit}>
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
                  checked={formik.values.rolloverEnabled}
                  onChange={(e) => {
                    formik.setFieldValue('rolloverEnabled', e.target.checked);
                    if (!e.target.checked) {
                      formik.setFieldValue('rolloverPercentage', '');
                    }
                  }}
                  disabled={loading}
                />
              }
              label="تفعيل التدوير"
            />

            {formik.values.rolloverEnabled && (
              <TextField
                fullWidth
                label="نسبة التدوير"
                name="rolloverPercentage"
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
                value={formik.values.rolloverPercentage}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(100, parseInt(e.target.value) || ''));
                  formik.setFieldValue('rolloverPercentage', value);
                }}
                error={formik.touched.rolloverPercentage && Boolean(formik.errors.rolloverPercentage)}
                helperText={
                  (formik.touched.rolloverPercentage && formik.errors.rolloverPercentage) ||
                  (formik.values.rolloverPercentage > 0 && financialYear?.totalProfit && 
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