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
  Switch,
  FormControlLabel,
  FormHelperText,
  Divider,
  Typography,
  Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Api from '../services/api';
import { toast } from 'react-toastify';
import {useSettings} from '../hooks/useSettings';

const AddFinancialYearModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { data: settings } = useSettings();

  const years = Array.from({length: 16}, (_, i) => 2025 + i);
  
  const formik = useFormik({
    initialValues: {
      year: new Date().getFullYear(),
      periodName: '',
      totalProfit: '',
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0],
      rolloverEnabled: false,
      rolloverPercentage: '',
      autoRollover: false,
      autoRolloverDate: null,
      autoRolloverStatus: 'pending'
    },
    validationSchema: Yup.object({
      year: Yup.number().required('السنة مطلوبة'),
      periodName: Yup.string().required('اسم الفترة مطلوب'),
      totalProfit: Yup.number().min(1, 'يجب أن يكون الربح أكبر من 0').required('إجمالي الربح مطلوب'),
      startDate: Yup.date().required('تاريخ البداية مطلوب'),
      endDate: Yup.date()
        .required('تاريخ النهاية مطلوب')
        .min(Yup.ref('startDate'), 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية'),
      rolloverPercentage: Yup.number()
        .when('rolloverEnabled', {
          is: true,
          then: Yup.number()
            .min(1, 'يجب أن تكون النسبة أكبر من 0')
            .max(100, 'يجب أن تكون النسبة أقل من أو تساوي 100')
            .required('نسبة التدوير مطلوبة')
        }),
      autoRolloverDate: Yup.date()
        .when(['rolloverEnabled', 'autoRollover'], {
          is: (rolloverEnabled, autoRollover) => rolloverEnabled && !autoRollover,
          then: Yup.date()
            .required('تاريخ التدوير مطلوب')
            .min(Yup.ref('startDate'), 'يجب أن يكون تاريخ التدوير بعد تاريخ البداية')
        })
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const formattedValues = {
          ...values,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          autoRolloverDate: values.autoRolloverDate ? new Date(values.autoRolloverDate).toISOString() : null
        };
        
        await Api.post('/api/financial-years', formattedValues);
        toast.success('تم إضافة السنة المالية بنجاح');
        onSuccess();
        formik.resetForm();
      } catch (error) {
        console.error('Error adding financial year:', error);
        toast.error('فشل في إضافة السنة المالية');
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
    if (!formik.values.rolloverEnabled || !formik.values.totalProfit || !formik.values.rolloverPercentage) {
      return { rolloverAmount: 0, distributionAmount: 0 };
    }
    const rolloverAmount = (formik.values.totalProfit * formik.values.rolloverPercentage) / 100;
    const distributionAmount = formik.values.totalProfit - rolloverAmount;
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
          minHeight: '50vh',
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
      
      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ mt: 2, px: 3 }}>
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
              value={formik.values.year}
              onChange={(_, newValue) => {
                formik.setFieldValue('year', newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="السنة"
                  name="year"
                  error={formik.touched.year && Boolean(formik.errors.year)}
                  helperText={formik.touched.year && formik.errors.year}
                  disabled={loading}
                />
              )}
            />
            
            <TextField
              fullWidth
              label="اسم الفترة"
              name="periodName"
              value={formik.values.periodName}
              onChange={formik.handleChange}
              error={formik.touched.periodName && Boolean(formik.errors.periodName)}
              helperText={formik.touched.periodName && formik.errors.periodName}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="إجمالي الربح"
              name="totalProfit"
              type="number"
              inputProps={{ 
                min: 0,
                step: 1,
                onKeyPress: (e) => {
                  if (e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }
              }}
              value={formik.values.totalProfit}
              onChange={(e) => {
                const value = Math.max(0, parseInt(e.target.value) || 0);
                formik.setFieldValue('totalProfit', value);
              }}
              error={formik.touched.totalProfit && Boolean(formik.errors.totalProfit)}
              helperText={formik.touched.totalProfit && formik.errors.totalProfit}
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
              name="startDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formik.values.startDate}
              onChange={formik.handleChange}
              error={formik.touched.startDate && Boolean(formik.errors.startDate)}
              helperText={formik.touched.startDate && formik.errors.startDate}
              disabled={loading}
            />
            
            <TextField
              fullWidth
              label="تاريخ النهاية"
              name="endDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formik.values.endDate}
              onChange={formik.handleChange}
              error={formik.touched.endDate && Boolean(formik.errors.endDate)}
              helperText={formik.touched.endDate && formik.errors.endDate}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="الفترة"
              name="periodType"
              value={formik.values.endDate && formik.values.startDate ? 
                `${Math.ceil((new Date(formik.values.endDate) - new Date(formik.values.startDate)) / (1000 * 60 * 60 * 24))} يوم` : ''}
              disabled={true}
            />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                إعدادات التدوير
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                التدوير التلقائي يتم في نهاية السنة المالية. إذا تم تعطيله، يمكنك تحديد تاريخ مخصص للتدوير.
              </Alert>

              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.rolloverEnabled}
                    onChange={(e) => {
                      formik.setFieldValue('rolloverEnabled', e.target.checked);
                      if (!e.target.checked) {
                        formik.setFieldValue('autoRollover', false);
                        formik.setFieldValue('rolloverPercentage', '');
                        formik.setFieldValue('autoRolloverDate', null);
                      }
                    }}
                    disabled={loading}
                  />
                }
                label="تفعيل التدوير"
              />

              {formik.values.rolloverEnabled && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.autoRollover}
                        onChange={(e) => {
                          formik.setFieldValue('autoRollover', e.target.checked);
                          if (e.target.checked) {
                            formik.setFieldValue('autoRolloverDate', null);
                          }
                        }}
                        disabled={loading}
                      />
                    }
                    label="تدوير تلقائي"
                  />

                  <TextField
                    fullWidth
                    label="نسبة التدوير"
                    name="rolloverPercentage"
                    type="number"
                    inputProps={{ 
                      min: 0,
                      step: 1,
                      onKeyPress: (e) => {
                        if (e.key === '-' || e.key === '+') {
                          e.preventDefault();
                        }
                      }
                    }}
                    value={formik.values.rolloverPercentage}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || '');
                      formik.setFieldValue('rolloverPercentage', value);
                    }}
                    error={formik.touched.rolloverPercentage && Boolean(formik.errors.rolloverPercentage)}
                    helperText={
                      (formik.touched.rolloverPercentage && formik.errors.rolloverPercentage) ||
                      (formik.values.rolloverPercentage > 0 && 
                        `سيتم توزيع ${distributionAmount} ${settings?.defaultCurrency} على المساهمين وتدوير ${rolloverAmount} ${settings?.defaultCurrency}`)
                    }
                    disabled={loading}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{ mt: 2 }}
                  />

                  {!formik.values.autoRollover && (
                    <TextField
                      fullWidth
                      label="تاريخ التدوير"
                      name="autoRolloverDate"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.autoRolloverDate || ''}
                      onChange={formik.handleChange}
                      error={formik.touched.autoRolloverDate && Boolean(formik.errors.autoRolloverDate)}
                      helperText={formik.touched.autoRolloverDate && formik.errors.autoRolloverDate}
                      disabled={loading}
                      sx={{ mt: 2 }}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 3, justifyContent: 'space-between',flexDirection:'row-reverse' }}>
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