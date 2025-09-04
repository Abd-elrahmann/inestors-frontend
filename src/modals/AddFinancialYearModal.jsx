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
  Autocomplete
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
      totalProfit: 0,
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0], 
    },
    validationSchema: Yup.object({
      year: Yup.number().required('السنة مطلوبة'),
      periodName: Yup.string().required('اسم الفترة مطلوب'),
      totalProfit: Yup.number().min(1, 'يجب أن يكون الربح أكبر من 0').required('إجمالي الربح مطلوب'),
      startDate: Yup.date().required('تاريخ البداية مطلوب'),
      endDate: Yup.date()
        .required('تاريخ النهاية مطلوب')
        .min(Yup.ref('startDate'), 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        
        const formattedValues = {
          ...values,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString()
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
              value={formik.values.totalProfit}
              onChange={formik.handleChange}
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