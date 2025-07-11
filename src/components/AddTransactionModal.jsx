import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { toast } from 'react-toastify';
import { transactionsAPI, investorsAPI } from '../services/apiHelpers';

const AddTransactionModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [formData, setFormData] = useState({
    investorId: null,
    type: 'deposit',
    amount: '',
    currency: 'IQD',
    description: '',
    transactionDate: new Date()
  });

  const [errors, setErrors] = useState({});

  const transactionTypes = [
    { value: 'deposit', label: 'إيداع' },
    { value: 'withdrawal', label: 'سحب' },
    { value: 'profit', label: 'أرباح' }
  ];

  const currencies = [
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' }
  ];

  // Load investors when modal opens
  useEffect(() => {
    if (open) {
      fetchInvestors();
    }
  }, [open]);

  const fetchInvestors = async () => {
    try {
      setInvestorsLoading(true);
      const response = await investorsAPI.getAll();
      if (response.data && response.data.investors) {
        setInvestors(response.data.investors.map(investor => ({
          id: investor._id,
          name: investor.fullName,
          label: `${investor.fullName} `
        })));
      }
    } catch (error) {
      console.error('Error fetching investors:', error);
      toast.error('خطأ في تحميل قائمة المساهمين');
    } finally {
      setInvestorsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Investor validation
    if (!formData.investorId) {
      newErrors.investorId = 'اختيار المساهم مطلوب';
    }

    // Amount validation
    if (!formData.amount.trim()) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون رقم أكبر من صفر';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'وصف العملية مطلوب';
    }

    // Date validation
    if (!formData.transactionDate) {
      newErrors.transactionDate = 'تاريخ العملية مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
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
      // Format the data for API
      const transactionData = {
        investorId: formData.investorId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description.trim(),
        transactionDate: formData.transactionDate
      };

      // Call API using the existing helper
      const result = await transactionsAPI.create(transactionData);
      
      toast.success('تم إضافة العملية المالية بنجاح');
      
      // Reset form
      setFormData({
        investorId: null,
        type: 'deposit',
        amount: '',
        currency: 'IQD',
        description: '',
        transactionDate: new Date()
      });
      
      // Close modal and refresh data
      onClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة العملية المالية');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        investorId: null,
        type: 'deposit',
        amount: '',
        currency: 'IQD',
        description: '',
        transactionDate: new Date()
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{
        timeout: { enter: 200, exit: 150 } 
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '60vh', 
          width: '50%',
          scrollbarWidth: 'none'
        }
      }}
    >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: '#28a745',
          color: 'white',
          fontFamily: 'Cairo',
          fontSize: '1.2rem',
          fontWeight: 600
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon />
            <span>إضافة عملية مالية جديدة</span>
          </Box>
          <IconButton 
            onClick={handleClose}
            disabled={loading}
            sx={{ color: 'white' }}
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
              width: '60%',
              mx: 'auto'
            }}>
              {/* اختيار المساهم */}
              <Autocomplete
                options={investors}
                getOptionLabel={(option) => option.label || ''}
                value={investors.find(inv => inv.id === formData.investorId) || null}
                onChange={(event, newValue) => {
                  handleInputChange('investorId', newValue ? newValue.id : null);
                }}
                loading={investorsLoading}
                disabled={loading || investorsLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="اختر المساهم"
                    error={!!errors.investorId}
                    helperText={errors.investorId}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#28a745' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {investorsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Cairo'
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'Cairo'
                      }
                    }}
                  />
                )}
              />

              {/* المبلغ */}
              <TextField
                fullWidth
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
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body2" sx={{ color: '#28a745', fontWeight: 600 }}>
                        {currencies.find(c => c.code === formData.currency)?.symbol || 'د.ع'}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'Cairo'
                  },
                  '& .MuiInputLabel-root': {
                    fontFamily: 'Cairo'
                  }
                }}
              />

              {/* نوع العملية */}
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Cairo' }}>نوع العملية</InputLabel>
                <Select
                  value={formData.type}
                  label="نوع العملية"
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  disabled={loading}
                  sx={{
                    fontFamily: 'Cairo'
                  }}
                >
                  {transactionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value} sx={{ fontFamily: 'Cairo' }}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* العملة */}
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Cairo' }}>العملة</InputLabel>
                <Select
                  value={formData.currency}
                  label="العملة"
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  disabled={loading}
                  sx={{
                    fontFamily: 'Cairo'
                  }}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code} sx={{ fontFamily: 'Cairo' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {currency.symbol}
                        </Typography>
                        <Typography variant="body2">
                          {currency.name}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* تاريخ العملية */}
              <DatePicker
                label="تاريخ العملية"
                value={formData.transactionDate}
                onChange={(newValue) => handleInputChange('transactionDate', newValue)}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    error={!!errors.transactionDate}
                    helperText={errors.transactionDate}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Cairo'
                      },
                      '& .MuiInputLabel-root': {
                        fontFamily: 'Cairo'
                      }
                    }}
                  />
                )}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            p: 3, 
            gap: 3,
            justifyContent: 'center',
            display: 'flex',
            alignItems: 'center',
            direction:'ltr'
          }}>
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="outlined"
              size="large"
              sx={{
                fontFamily: 'Cairo',
                fontWeight: 500,
                color: '#6c757d',
                borderColor: '#6c757d',
                px: 4,
                py: 1.5,
                minWidth: 120,
                '&:hover': {
                  borderColor: '#495057',
                  backgroundColor: 'rgba(108, 117, 125, 0.04)'
                }
              }}
            >
              إلغاء
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              size="large"
              sx={{
                fontFamily: 'Cairo',
                fontWeight: 600,
                backgroundColor: '#28a745',
                px: 4,
                py: 1.5,
                minWidth: 140,
                '&:hover': {
                  backgroundColor: '#218838'
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>جاري الحفظ...</span>
                </Box>
              ) : (
                'إضافة العملية'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddTransactionModal; 