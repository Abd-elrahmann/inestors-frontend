import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { toast } from 'react-toastify';
import { transactionsAPI, investorsAPI } from '../services/apiHelpers';
import { showErrorAlert } from '../utils/sweetAlert';

const EditTransactionModal = ({ open, onClose, onSuccess, transaction }) => {
  const [loading, setLoading] = useState(false);
  const [investorsLoading, setInvestorsLoading] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    investorId: null,
    type: 'deposit',
    amount: '',
    currency: 'IQD',
    description: '',
    transactionDate: new Date()
  });

  const transactionTypes = [
    { value: 'deposit', label: 'إيداع' },
    { value: 'withdrawal', label: 'سحب' },
    { value: 'profit', label: 'أرباح' }
  ];

  const currencies = [
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$' }
  ];

  // Load transaction data and investors when modal opens
  useEffect(() => {
    if (open) {
      fetchInvestors();
      if (transaction) {
        console.log('Loading transaction data:', transaction);
        setFormData({
          investorId: transaction.investorId || null,
          type: transaction.type === 'إيداع' ? 'deposit' : 
                transaction.type === 'سحب' ? 'withdrawal' : 
                transaction.type === 'أرباح' ? 'profit' : transaction.type,
          amount: transaction.amount ? String(transaction.amount).replace(/[^0-9.]/g, '') : '',
          currency: transaction.currency || 'IQD',
          description: transaction.description || '',
          transactionDate: transaction.date ? new Date(transaction.date) : new Date()
        });
        setErrors({});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction]);

  const fetchInvestors = async () => {
    try {
      setInvestorsLoading(true);
      const response = await investorsAPI.getAll();
      if (response.data && response.data.investors) {
        const investorsList = response.data.investors.map(investor => ({
          id: investor._id,
          name: investor.fullName,
          label: `${investor.fullName} - ${investor.nationalId}`
        }));
        setInvestors(investorsList);
        
        // إذا كان هناك معاملة محددة، تأكد من تحديد المساهم الصحيح
        if (transaction && transaction.investorId) {
          const selectedInvestor = investorsList.find(inv => inv.id === transaction.investorId);
          if (selectedInvestor) {
            console.log('Selected investor found:', selectedInvestor);
          } else {
            console.warn('Investor not found for transaction:', transaction.investorId);
          }
        }
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
    if (!formData.amount.toString().trim()) {
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

    // Clear error when user starts typing
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

    try {
      setLoading(true);

      // Prepare data for API
      const updateData = {
        investorId: formData.investorId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description.trim(),
        transactionDate: formData.transactionDate
      };

      const response = await transactionsAPI.update(transaction.id, updateData);

      if (response.success) {
        onSuccess();
        handleClose();
        toast.success('تم تعديل العملية المالية بنجاح');
      } else {
        throw new Error(response.message || 'فشل في تعديل العملية المالية');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      showErrorAlert(error.message || 'حدث خطأ أثناء تعديل العملية المالية');
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
        maxWidth="lg"
        fullWidth
        TransitionProps={{
          timeout: { enter: 200, exit: 150 } // ✅ انتقالات أسرع
        }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '60vh', // ✅ ارتفاع أقل
            width: '40%'
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            position: 'relative',
            textAlign: 'center',
            py: 3
          }}
        >
          <IconButton
            onClick={handleClose}
            disabled={loading}
            sx={{
              position: 'absolute',
              left: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <EditIcon sx={{ fontSize: 40 }} />
            <Typography variant="h5" sx={{ fontFamily: 'Cairo', fontWeight: 700 }}>
              تعديل العملية المالية
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Cairo', opacity: 0.9 }}>
              تعديل بيانات العملية المالية في النظام
            </Typography>
          </Box>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ p: 4, mt: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={6}>
              {/* العمود الأيمن */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* اختيار المساهم */}
                  <TextField
                    fullWidth
                    label="اختر المساهم"
                    value={investors.find(inv => inv.id === formData.investorId)?.name || ''}
                    disabled={true}
                    error={!!errors.investorId}
                    helperText={errors.investorId}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: '#28a745' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {investorsLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
                          <AttachMoneyIcon sx={{ color: '#28a745' }} />
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
                </Box>
              </Grid>

              {/* العمود الأيسر */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
              </Grid>

             
            </Grid>
          </Box>
        </DialogContent>

        {/* Actions */}
        <DialogActions
          sx={{
            background: 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%)',
            borderTop: '1px solid #dee2e6',
            p: 3,
            justifyContent: 'center',
            gap: 2
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderColor: '#6c757d',
              color: '#6c757d',
              '&:hover': {
                borderColor: '#5a6268',
                backgroundColor: '#6c757d',
                color: 'white'
              }
            }}
          >
            إلغاء
          </Button>
          
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              backgroundColor: '#28a745',
              '&:hover': {
                backgroundColor: '#218838'
              }
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                جاري التحديث...
              </>
            ) : (
              'تعديل العملية'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default EditTransactionModal; 