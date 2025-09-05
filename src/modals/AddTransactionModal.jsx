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
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import Api from '../services/api';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useSettings } from '../hooks/useSettings';

const AddTransactionModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investors, setInvestors] = useState([]);
  const { data: settings } = useSettings();
  const isMobile = useMediaQuery('(max-width: 480px)');
  const [formData, setFormData] = useState({
    userId: null,
    type: 'deposit',
    amount: ''
  });

  const [errors, setErrors] = useState({});

  const transactionTypes = [
    { value: 'deposit', label: 'إيداع' },
    { value: 'withdrawal', label: 'سحب (رأس المال)' },
    { value: 'withdraw_profit', label: 'سحب أرباح' },
    { value: 'rollover_profit', label: 'تدوير أرباح' },
    { value: 'profit', label: 'أرباح' }
  ];

  useEffect(() => {
    if (open) {
      fetchInvestors();
    }
  }, [open]);

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

    if (!formData.userId) {
      newErrors.userId = 'اختيار المساهم مطلوب';
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'المبلغ يجب أن يكون رقم أكبر من صفر';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
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
        userId: formData.userId,
        type: formData.type,
        amount: parseFloat(formData.amount)
      };

      const result = await Api.post('/api/transactions', transactionData);
      
      toast.success('تم إضافة العملية المالية بنجاح');
      
      setFormData({
        userId: null,
        type: 'deposit',
        amount: ''
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
        userId: null,
        type: 'deposit',
        amount: ''
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
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '50vh',
          width: isMobile ? '90%' : '50%',
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
            width: '80%',
            mx: 'auto'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'center',flexDirection: isMobile ? 'column' : 'row' }}>
              <span>هل تحتاج الي تغيير العملة؟</span>
              <Link to="/settings" target='_blank' style={{textDecoration: 'none', color: 'green'}}>
                الاعدادات
                <ArrowLeftOutlined style={{ marginRight: "10px" }} />
              </Link>
            </Box>

            <Autocomplete
              options={investors}
              getOptionLabel={(option) => option.userId + ' - ' + option.fullName || ''}
              value={investors.find(inv => inv.userId === formData.userId) || null}
              onChange={(event, newValue) => {
                handleInputChange('userId', newValue ? newValue.userId : null);
              }}
              loading={investorsLoading}
              disabled={loading || investorsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="اختر المساهم"
                  error={!!errors.userId}
                  helperText={errors.userId}
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
                    {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                  </InputAdornment>
                ),
              }}
            />

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
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 3, justifyContent: 'center',flexDirection: isMobile ? 'column' : 'row' }}>
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