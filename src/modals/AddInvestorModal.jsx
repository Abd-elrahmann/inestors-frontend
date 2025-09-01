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
  Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import Api from '../services/api';
import PhoneIcon from '@mui/icons-material/Phone';
import MoneyIcon from '@mui/icons-material/AccountBalance';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';
const AddInvestorModal = ({ open, onClose, onSuccess, editMode = false, investorData = null }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    userName: '',
    phone: '',
    amount: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await Api.get('/api/users/1', {
          params: {
            limit: 1000,
          }
        });
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editMode && investorData) {
      setFormData({
        userName: investorData.userName || '',
        phone: investorData.phone || '',
        amount: investorData.amount || ''
      });
    }
  }, [editMode, investorData]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!editMode) {
      if (!formData.userName.trim()) {
        newErrors.userName = 'اسم المستثمر مطلوب';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'رقم الهاتف مطلوب';
      }
    }

    if (!formData.amount) {
      newErrors.amount = 'المبلغ مطلوب';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'يجب أن يكون المبلغ رقماً موجباً';
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
      const payload = {
        amount: parseFloat(formData.amount)
      };

      if (!editMode) {
        payload.userName = formData.userName.trim();
        payload.phone = formData.phone.trim();
      }

      let result;
      if (editMode) {
        result = await Api.put(`/api/investors/${investorData.id}`, payload);
        toast.success('تم تحديث المستثمر بنجاح');
        queryClient.invalidateQueries('investors');
      } else {
        result = await Api.post('/api/investors', payload);
        toast.success('تم إضافة المستثمر بنجاح');
        queryClient.invalidateQueries('investors');
      }

      setFormData({
        userName: '',
        phone: '',
        amount: ''
      });
      
      onClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error:', error);
        if (error.response?.data) {
        const { message, error: errorMessage } = error.response.data;
        toast.error(message || errorMessage || 'حدث خطأ');
      } else {
        toast.error(error.message || 'حدث خطأ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        userName: '',
        phone: '',
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
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: editMode ? '30vh' : '40vh',
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
        fontWeight: 500
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon />
          <span>{editMode ? 'تعديل المستثمر' : 'إضافة مستثمر جديد'}</span>
        </Box>
        <IconButton onClick={handleClose} disabled={loading} sx={{ color: 'black' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ mt: 1, px: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            
            {editMode ? (
              <TextField
                sx={{width:'300px'}}
                label="اسم المستثمر"
                value={formData.userName}
                disabled={true}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <Autocomplete
                sx={{width:'300px'}}
                options={users}
                filterSelectedOptions
                getOptionLabel={(option) => option.fullName}
                value={users.find(user => user.fullName === formData.userName) || null}
                onChange={(event, newValue) => {
                  handleInputChange('userName', newValue ? newValue.fullName : '');
                }}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="اسم المستثمر"
                    error={!!errors.userName}
                    helperText={errors.userName}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            )}

            <TextField
              sx={{width:'300px'}}
              label="رقم الهاتف"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={!!errors.phone}
              helperText={errors.phone}
              disabled={loading || editMode}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              sx={{width:'300px'}}
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
                    <MoneyIcon />
                  </InputAdornment>
                ),
              }}
            />

          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, 
          gap: 3,
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
          direction:'ltr'
        }}>
          <Button onClick={handleClose} disabled={loading} variant="outlined" size="large" sx={{
            fontFamily: 'Cairo',
            fontWeight: 500,
            color: 'black',
            borderColor: '#6c757d',
          }}>
            إلغاء
          </Button>
          
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              editMode ? 'تحديث' : 'إضافة'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddInvestorModal;