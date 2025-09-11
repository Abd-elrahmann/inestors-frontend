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
  CircularProgress,
  Autocomplete,
  MenuItem,
  useMediaQuery,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import Api from '../services/api';
import { useQueryClient } from 'react-query';
import { useSettings } from '../hooks/useSettings';
const AddTransactionModal = ({ open, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investors, setInvestors] = useState([]);
  const isMobile = useMediaQuery('(max-width: 480px)');
  const { data: settings } = useSettings();
  const [formData, setFormData] = useState({
    investorId: null,
    type: 'DEPOSIT',
    amount: '',
    currency: settings?.defaultCurrency || 'USD',
    date: ''
  });

  const formatNumber = (num) => {
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!settings?.USDtoIQD) return amount;
    
    if (fromCurrency === 'IQD' && toCurrency === 'USD') {
      return amount / settings.USDtoIQD;
    } else if (fromCurrency === 'USD' && toCurrency === 'IQD') {
      return amount * settings.USDtoIQD;
    }
    return amount;
  };

  const [errors, setErrors] = useState({});

  const transactionTypes = [
    { value: 'DEPOSIT', label: 'إيداع' },
    { value: 'WITHDRAWAL', label: 'سحب' },
  ];

  useEffect(() => {
    if (open) {
      fetchInvestors();
    }
  }, [open]);

  useEffect(() => {
    if (settings?.defaultCurrency) {
      setFormData(prev => ({
        ...prev,
        currency: settings.defaultCurrency
      }));
    }
  }, [settings]);

  const fetchInvestors = async () => {
    try {
      setInvestorsLoading(true);
      const response = await Api.get('/api/investors/1');
      if (response.data && response.data.investors) {
        setInvestors(response.data.investors);
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

    if (!formData.investorId) {
      newErrors.userId = 'اختيار المساهم مطلوب';
    }

    if (!formData.amount.toString().trim()) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount.replace(/,/g, '')) || parseFloat(formData.amount.replace(/,/g, '')) < 0) {
      newErrors.amount = 'المبلغ يجب أن يكون رقم أكبر من صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (field === 'amount') {
      // Remove any existing commas first
      const rawValue = value.replace(/,/g, '');
      // Only format if it's a valid number
      if (!isNaN(rawValue)) {
        value = formatNumber(rawValue);
      }
    }

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
      const transactionData = {
        investorId: formData.investorId,
        type: formData.type,
        amount: parseFloat(formData.amount.replace(/,/g, '')),
        currency: formData.currency,
        date: formData.date || undefined
      };

      console.log('Sending transaction data:', transactionData);

      const result = await Api.post('/api/transactions', transactionData);
      
      toast.success('تم إضافة العملية المالية بنجاح');
      queryClient.invalidateQueries('investors');   
      
      setFormData({
        investorId: null,
        type: 'DEPOSIT',
        amount: '',
        currency: settings?.defaultCurrency || 'USD',
        date: ''
      });
      
      onClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error(error.response?.data?.message || 'حدث خطأ أثناء إضافة العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        investorId: null,
        type: 'DEPOSIT',
        amount: '',
        currency: settings?.defaultCurrency || 'USD',
        date: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth={isMobile ? 'md' : 'xs'}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '50vh',
          width: isMobile ? '90%' : '40%',
        }
      }}
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
          <span>إضافة عملية مالية جديدة</span>
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
            width: '70%',
            mx: 'auto'
          }}>
            <Autocomplete
              options={investors}
              getOptionLabel={(option) => option.id + ' - ' + option.fullName || ''}
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
                />
              )}
            />
            <TextField
              fullWidth
              type="text"
              label="المبلغ"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {settings?.defaultCurrency === 'IQD' ? 'د.ع' : '$' }
                  </InputAdornment>
                ),
              }}
            />
            {settings?.defaultCurrency === 'IQD' && parseFloat(formData.amount.replace(/,/g, '')) > 0 && (
              <Alert severity="info">
                {formData.amount && ` سوف يتم استلام ${formatNumber(convertCurrency(parseFloat(formData.amount.replace(/,/g, '')), 'IQD', 'USD').toFixed(2))}$`}
              </Alert>
            )}

            <TextField
              select
              fullWidth
              label="نوع العملية"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={loading}
            >
              {transactionTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="date"
              label="تاريخ العملية"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 3, justifyContent: 'center',flexDirection: isMobile ? 'column' : 'row-reverse' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            size={isMobile ? 'small' : 'large'}
          >
            إلغاء
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            size={isMobile ? 'small' : 'large'}
            sx={{ backgroundColor: 'primary.main' }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'إضافة العملية'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddTransactionModal;