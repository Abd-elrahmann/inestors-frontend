import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// eslint-disable-next-line no-unused-vars
import { toast } from 'react-toastify';
import { financialYearsAPI } from '../services/apiHelpers';
import { showErrorAlert, showSuccessAlert } from '../utils/sweetAlert';

const EditFinancialYearModal = ({ open, onClose, onSuccess, financialYear }) => {
  const [loading, setLoading] = useState(false);
  const [latestFinancialYear, setLatestFinancialYear] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    startDate: null,
    endDate: null,
    totalProfit: '',
    currency: 'IQD',
    rolloverSettings: {
      percentage: 100,
      autoRollover: false,
      autoRolloverDate: null
    }
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (financialYear && open) {
      fetchLatestFinancialYearData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYear, open]);

  const fetchLatestFinancialYearData = async () => {
    try {
      setLoading(true);
      const response = await financialYearsAPI.getById(financialYear._id);
             if (response.success) {
         const latestData = response.data.financialYear;
         setLatestFinancialYear(latestData);
         setFormData({
           year: latestData.year || '',
           startDate: latestData.startDate ? new Date(latestData.startDate) : null,
           endDate: latestData.endDate ? new Date(latestData.endDate) : null,
           totalProfit: latestData.totalProfit?.toString() || '',
           currency: latestData.currency || 'IQD',
           rolloverSettings: {
             percentage: latestData.rolloverSettings?.rolloverPercentage || latestData.rolloverSettings?.percentage || 100,
             autoRollover: latestData.rolloverSettings?.autoRollover || false,
             autoRolloverDate: latestData.rolloverSettings?.autoRolloverDate 
               ? new Date(latestData.rolloverSettings.autoRolloverDate) 
               : null
           }
         });
         setErrors({});
       }
    } catch (error) {
      console.error('Error fetching latest financial year data:', error);
      
      setFormData({
        year: financialYear.year || '',
        startDate: financialYear.startDate ? new Date(financialYear.startDate) : null,
        endDate: financialYear.endDate ? new Date(financialYear.endDate) : null,
        totalProfit: financialYear.totalProfit?.toString() || '',
        currency: financialYear.currency || 'IQD',
        rolloverSettings: {
          percentage: financialYear.rolloverSettings?.rolloverPercentage || financialYear.rolloverSettings?.percentage || 100,
          autoRollover: financialYear.rolloverSettings?.autoRollover || false,
          autoRolloverDate: financialYear.rolloverSettings?.autoRolloverDate 
            ? new Date(financialYear.rolloverSettings.autoRolloverDate) 
            : null
        }
      });
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleRolloverSettingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      rolloverSettings: {
        ...prev.rolloverSettings,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.year) {
      newErrors.year = 'السنة مطلوبة';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'تاريخ البداية مطلوب';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'تاريخ النهاية مطلوب';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    }

    if (!formData.totalProfit || parseFloat(formData.totalProfit) <= 0) {
      newErrors.totalProfit = 'إجمالي الربح يجب أن يكون أكبر من صفر';
    }

    if (!formData.currency) {
      newErrors.currency = 'العملة مطلوبة';
    }

    if (formData.rolloverSettings.percentage < 0 || formData.rolloverSettings.percentage > 100) {
      newErrors.rolloverPercentage = 'نسبة التدوير يجب أن تكون بين 0 و 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        totalProfit: parseFloat(formData.totalProfit)
      };

      const response = await financialYearsAPI.update(financialYear._id, submitData);
      
      if (response.success) {
        showSuccessAlert('تم تحديث السنة المالية بنجاح');
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error updating financial year:', error);
      showErrorAlert(error.response?.data?.message || 'حدث خطأ أثناء تحديث السنة المالية');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const diffTime = Math.abs(formData.endDate - formData.startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };


  const formatCurrency = (amount, currency) => {
    const symbols = { 'IQD': 'د.ع', 'USD': '$' };
    return `${symbols[currency] || currency}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': 'default',
      'calculated': 'info',
      'approved': 'warning',
      'distributed': 'success',
      'closed': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'draft': 'مسودة',
      'calculated': 'محسوب',
      'approved': 'موافق عليه',
      'distributed': 'موزع',
      'closed': 'مغلق'
    };
    return statusMap[status] || status;
  };

  const canEdit = () => {
    const currentYear = latestFinancialYear || financialYear;
    return currentYear?.status === 'draft';
  };

  const getCurrentFinancialYear = () => {
    return latestFinancialYear || financialYear;
  };

  if (!financialYear) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { fontFamily: 'Cairo' }
        }}
      >
        <DialogTitle sx={{ fontFamily: 'Cairo', fontWeight: 600, borderBottom: '1px solid #e0e0e0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div" fontWeight="bold">
              تعديل السنة المالية {financialYear.year}
            </Typography>
            <Chip 
              label={getStatusText(getCurrentFinancialYear().status)} 
              color={getStatusColor(getCurrentFinancialYear().status)}
              size="small"
            />
          </Box>
        </DialogTitle>

        {!canEdit() && (
          <Alert severity="warning" sx={{ m: 2, fontFamily: 'Cairo' }}>
            لا يمكن تعديل السنة المالية في حالتها الحالية. يمكن تعديل السنوات المالية في حالة "مسودة" فقط.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={3}>
             
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="السنة المالية"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', parseInt(e.target.value))}
                  error={!!errors.year}
                  helperText={errors.year}
                  disabled={!canEdit()}
                  required
                  sx={{ fontFamily: 'Cairo' }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="إجمالي الربح للفترة"
                  type="number"
                  value={formData.totalProfit}
                  onChange={(e) => handleChange('totalProfit', e.target.value)}
                  error={!!errors.totalProfit}
                  helperText={errors.totalProfit || "سيتم توزيعه حسب: المبلغ × الأيام × (الربح ÷ (إجمالي رؤوس الأموال × 365))"}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  disabled={!canEdit()}
                  sx={{ fontFamily: 'Cairo' }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth error={!!errors.currency} disabled={!canEdit()}>
                  <InputLabel sx={{ fontFamily: 'Cairo' }}>العملة</InputLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    label="العملة"
                    sx={{ fontFamily: 'Cairo' }}
                  >
                    <MenuItem value="IQD" sx={{ fontFamily: 'Cairo' }}>
                      دينار عراقي (د.ع)
                    </MenuItem>
                    <MenuItem value="USD" sx={{ fontFamily: 'Cairo' }}>
                      دولار أمريكي ($)
                    </MenuItem>
                  </Select>
                  {errors.currency && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, fontFamily: 'Cairo' }}>
                      {errors.currency}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

             
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="تاريخ بداية الفترة"
                  value={formData.startDate}
                  onChange={(date) => handleChange('startDate', date)}
                  disabled={!canEdit()}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.startDate}
                      helperText={errors.startDate}
                      required
                      sx={{ fontFamily: 'Cairo' }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="تاريخ نهاية الفترة"
                  value={formData.endDate}
                  onChange={(date) => handleChange('endDate', date)}
                  disabled={!canEdit()}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.endDate}
                      helperText={errors.endDate}
                      required
                      sx={{ fontFamily: 'Cairo' }}
                    />
                  )}
                />
              </Grid>

             
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="نوع الفترة"
                  value="فترة مخصصة"
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled
                  sx={{ fontFamily: 'Cairo' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="مدة الفترة"
                  value={`${calculateDays()} يوم`}
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText={(() => {
                    const days = calculateDays();
                    if (days >= 365 && days <= 366) return 'سنة كاملة ✅';
                    if (days >= 89 && days <= 92) return 'ربع سنة ✅';
                    if (days >= 28 && days <= 31) return 'شهر واحد ✅';
                    if (days >= 178 && days <= 184) return 'نصف سنة';
                    return 'فترة مخصصة';
                  })()}
                  disabled
                  sx={{ fontFamily: 'Cairo' }}
                />
              </Grid>

             
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="نسبة التدوير (%)"
                  type="number"
                  value={formData.rolloverSettings.percentage}
                  onChange={(e) => handleRolloverSettingChange('percentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  error={!!errors.rolloverPercentage}
                  helperText={errors.rolloverPercentage || 'النسبة المئوية من الأرباح التي سيتم تدويرها إلى رأس المال'}
                  inputProps={{ min: 0, max: 100 }}
                  disabled={!canEdit()}
                  sx={{ fontFamily: 'Cairo' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.rolloverSettings.autoRollover}
                        onChange={(e) => handleRolloverSettingChange('autoRollover', e.target.checked)}
                        disabled={!canEdit()}
                      />
                    }
                    label="تفعيل التدوير التلقائي"
                    sx={{ fontFamily: 'Cairo' }}
                  />
                </Box>
              </Grid>

              {formData.rolloverSettings.autoRollover && (
                <Grid item xs={12}>
                  <DatePicker
                    label="تاريخ التدوير التلقائي"
                    value={formData.rolloverSettings.autoRolloverDate}
                    onChange={(date) => handleRolloverSettingChange('autoRolloverDate', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        helperText="التاريخ الذي سيتم فيه تدوير الأرباح تلقائياً"
                      />
                    )}
                  />
                </Grid>
              )}

              
              <Grid item xs={12}>
                <Alert 
                  severity={
                    getCurrentFinancialYear()?.status === 'draft' ? 'info' :
                    getCurrentFinancialYear()?.status === 'active' ? 'success' :
                    getCurrentFinancialYear()?.status === 'calculated' ? 'warning' :
                    getCurrentFinancialYear()?.status === 'approved' ? 'warning' :
                    getCurrentFinancialYear()?.status === 'distributed' ? 'success' : 'default'
                  } 
                  sx={{ fontFamily: 'Cairo' }}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'Cairo' }}>
                    <strong>الحالة الحالية:</strong> {
                      getCurrentFinancialYear()?.status === 'draft' ? 'مسودة' :
                      getCurrentFinancialYear()?.status === 'active' ? 'نشطة' :
                      getCurrentFinancialYear()?.status === 'calculated' ? 'محسوبة' :
                      getCurrentFinancialYear()?.status === 'approved' ? 'موافق عليها' :
                      getCurrentFinancialYear()?.status === 'distributed' ? 'موزعة' :
                      getCurrentFinancialYear()?.status === 'closed' ? 'مغلقة' : 'غير محدد'
                    }
                  </Typography>
                  {getCurrentFinancialYear()?.dailyProfitRate && (
                    <Typography variant="body2" sx={{ fontFamily: 'Cairo', mt: 1 }}>
                      <strong>معدل الربح اليومي:</strong> {getCurrentFinancialYear().dailyProfitRate.toFixed(6)} {formatCurrency(0, formData.currency)}/وحدة/يوم
                    </Typography>
                  )}
                </Alert>
              </Grid>

          
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
            <Button 
              onClick={handleClose} 
              disabled={loading}
              sx={{ fontFamily: 'Cairo' }}
            >
              إلغاء
            </Button>
            {canEdit() && (
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ 
                  fontFamily: 'Cairo',
                  backgroundColor: '#28a745',
                  '&:hover': { backgroundColor: '#218838' }
                }}
              >
                {loading ? 'جاري التحديث...' : 'تحديث السنة المالية'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditFinancialYearModal; 