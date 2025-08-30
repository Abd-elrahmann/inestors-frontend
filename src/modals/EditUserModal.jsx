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
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Lock as LockIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { MdVisibility as Visibility, MdVisibilityOff as VisibilityOff } from 'react-icons/md';
import { usersAPI } from '../services/apiHelpers';
import {  showErrorAlert, showSuccessAlert } from '../utils/sweetAlert';

const EditUserModal = ({ open, onClose, onSuccess, user }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    nationalId: '',
    role: 'user',
    password: '',
    confirmPassword: ''
  });

  const roles = [
    { value: 'admin', label: 'مدير' },
    { value: 'user', label: 'مستخدم' }
  ];

  useEffect(() => {
    if (open && user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        nationalId: user.nationalId || '',
        role: user.role === 'مدير' ? 'admin' : 'user',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setChangePassword(false);
    }
  }, [open, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'الاسم الكامل يجب أن يكون على الأقل حرفان';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون على الأقل 3 أحرف';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (changePassword) {
      if (!formData.password) {
        newErrors.password = 'كلمة المرور مطلوبة';
      } else if (formData.password.length < 6) {
        newErrors.password = 'كلمة المرور يجب أن تكون على الأقل 6 أحرف';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
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

      const updateData = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        nationalId: formData.nationalId.trim(),
        role: formData.role
      };

      if (changePassword && formData.password) {
        updateData.password = formData.password;
      }

      const response = await usersAPI.update(user.id, updateData);
      showSuccessAlert('تم تعديل المستخدم بنجاح');

      if (response.success) {
        onSuccess();
        handleClose();
      } else {
        throw new Error(response.message || 'فشل في تعديل المستخدم');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        if (error.message.includes('username')) {
          setErrors({ username: 'اسم المستخدم مستخدم بالفعل' });
        } else if (error.message.includes('email')) {
          setErrors({ email: 'البريد الإلكتروني مستخدم بالفعل' });
        } else if (error.message.includes('nationalId')) {
          setErrors({ nationalId: 'رقم الهوية مستخدم بالفعل' });
        } else {
          showErrorAlert('اسم المستخدم أو البريد الإلكتروني أو رقم الهوية مستخدم بالفعل');
        }
      } else {
        showErrorAlert(error.message || 'حدث خطأ أثناء تعديل المستخدم');
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
        role: 'user',
        password: '',
        confirmPassword: ''
      });
      setErrors({});
      setChangePassword(false);
      onClose();
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChangePasswordToggle = (event) => {
    setChangePassword(event.target.checked);
    if (!event.target.checked) {
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
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
          width: '40%'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
      >
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            position: 'absolute',
            left: 8,
            top: 8,
            color: 'green',
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
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 4, mt: 4 }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ textAlign: 'center' }}>
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
          
          <Grid container spacing={6} sx={{ mb: 4, justifyContent: 'center' }}>
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

                {/* الدور */}
                <FormControl fullWidth>
                  <InputLabel sx={{ fontFamily: 'Cairo' }}>الدور</InputLabel>
                  <Select
                    value={formData.role}
                    label="الدور"
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    disabled={loading}
                    sx={{
                      fontFamily: 'Cairo'
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.value} value={role.value} sx={{ fontFamily: 'Cairo' }}>
                        {role.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  required={false}
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

                {/* تغيير كلمة المرور */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={changePassword}
                      onChange={handleChangePasswordToggle}
                      disabled={loading}
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontFamily: 'Cairo', fontWeight: 500 }}>
                      تغيير كلمة المرور
                    </Typography>
                  }
                  sx={{ justifyContent: 'center' }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* قسم كلمة المرور - يظهر فقط عند الحاجة */}
          {changePassword && (
            <>
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
                إعدادات كلمة المرور الجديدة
              </Typography>
              
              <Grid container spacing={6} sx={{ justifyContent: 'center' }}>
                {/* كلمة المرور الجديدة */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="كلمة المرور الجديدة"
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

                {/* تأكيد كلمة المرور الجديدة */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="تأكيد كلمة المرور الجديدة"
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
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
            </>
          )}
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
            'تعديل المستخدم'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserModal; 