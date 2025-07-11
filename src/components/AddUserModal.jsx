import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BadgeIcon from '@mui/icons-material/Badge';
import LockIcon from '@mui/icons-material/Lock';
import { MdVisibility as Visibility, MdVisibilityOff as VisibilityOff } from 'react-icons/md';
import { toast } from 'react-toastify';
import { usersAPI } from '../services/apiHelpers';

const AddUserModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const [errors, setErrors] = useState({});

  const roles = [
    { value: 'admin', label: 'مدير' },
    { value: 'user', label: 'مستخدم' }
  ];

  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'الاسم الكامل يجب أن يكون على الأقل حرفان';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون على الأقل 3 أحرف';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    // National ID validation
    if (!formData.nationalId.trim()) {
      newErrors.nationalId = 'رقم الهوية مطلوب';
    } else if (!/^\d{10,14}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'رقم الهوية يجب أن يكون من 10 إلى 14 رقم';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    // Special handling for nationalId to allow only numbers
    if (field === 'nationalId') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

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
      const userData = {
        username: formData.username.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        nationalId: formData.nationalId.trim(),
        role: formData.role
      };

      // Call API using the existing helper
      const result = await usersAPI.create(userData);
      
      toast.success('تم إضافة المستخدم بنجاح');
      
      // Reset form
      setFormData({
        fullName: '',
        username: '',
        email: '',
        nationalId: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
      
      // Close modal and refresh data
      onClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error adding user:', error);
      
      // Handle specific errors
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        if (error.message.includes('username')) {
          setErrors({ username: 'اسم المستخدم مستخدم بالفعل' });
        } else if (error.message.includes('email')) {
          setErrors({ email: 'البريد الإلكتروني مستخدم بالفعل' });
        } else if (error.message.includes('nationalId')) {
          setErrors({ nationalId: 'رقم الهوية مستخدم بالفعل' });
        } else {
          toast.error('اسم المستخدم أو البريد الإلكتروني أو رقم الهوية مستخدم بالفعل');
        }
      } else {
        toast.error(error.message || 'حدث خطأ أثناء إضافة المستخدم');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        fullName: '',
        username: '',
        email: '',
        nationalId: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
      setErrors({});
      onClose();
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '70vh',
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
          <PersonAddIcon />
          <span >إضافة مستخدم جديد</span>
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
          {/* قسم البيانات الأساسية */}
          <Typography variant="h6" sx={{ 
            fontFamily: 'Cairo', 
            fontWeight: 600, 
            mb: 3, 
            color: '#28a745',
            borderBottom: '2px solid #28a745',
            pb: 1,
            textAlign: 'center'
          }}>
            البيانات الأساسية
          </Typography>
          
          <Grid container spacing={6} sx={{ mb: 4 }}>
            {/* العمود الأيمن */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* الاسم الكامل */}
                <TextField
                  fullWidth
                  label="الاسم الكامل"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#28a745' }} />
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

                {/* البريد الإلكتروني */}
                <TextField
                  fullWidth
                  type="email"
                  label="البريد الإلكتروني"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#28a745' }} />
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
                {/* اسم المستخدم */}
                <TextField
                  fullWidth
                  label="اسم المستخدم"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  error={!!errors.username}
                  helperText={errors.username}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#28a745' }} />
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

                

                {/* رقم الهوية */}
                <TextField
                  fullWidth
                  label="رقم الهوية"
                  value={formData.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  error={!!errors.nationalId}
                  helperText={errors.nationalId}
                  disabled={loading}
                  inputProps={{ maxLength: 14 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: '#28a745' }} />
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
            <Grid container spacing={6} justifyContent={'center'}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: 'Cairo' }}>الدور</InputLabel>
                <Select
                  value={formData.role}
                  label="الدور"
                  
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={loading}
                  sx={{
                    fontFamily: 'Cairo',
                    width: '220px'
                  }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value} sx={{ fontFamily: 'Cairo' }}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          </Grid>

      

          {/* قسم كلمة المرور */}
          <Typography variant="h6" sx={{ 
            fontFamily: 'Cairo', 
            fontWeight: 600, 
            mb: 3, 
            mt: 2,
            color: '#dc3545',
            borderBottom: '2px solid #dc3545',
            pb: 1,
            textAlign: 'center'
          }}>
            إعدادات كلمة المرور
          </Typography>
          
          <Grid container spacing={6} sx={{ mb: 4, justifyContent: 'center' }}>
            {/* كلمة المرور */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="كلمة المرور"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#dc3545' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
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
            </Grid>

            {/* تأكيد كلمة المرور */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تأكيد كلمة المرور"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#dc3545' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPassword}
                        edge="end"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <VisibilityOff  /> : <Visibility />}
                      </IconButton>
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
            </Grid>
          </Grid>

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
              'إضافة المستخدم'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddUserModal; 