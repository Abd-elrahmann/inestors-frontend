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
  InputAdornment,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockIcon from '@mui/icons-material/Lock';
import { MdVisibility as Visibility, MdVisibilityOff as VisibilityOff } from 'react-icons/md';
import Api from '../services/api';
import { toast } from 'react-toastify';
import { useQueryClient } from 'react-query';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PhoneIcon from '@mui/icons-material/Phone';
const AddUserModal = ({ open, onClose, onSuccess, user, mode = 'add' }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient(); 
  const isMobile = useMediaQuery('(max-width: 480px)');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'ADMIN',
    confirmPassword: ''
  });

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role || 'ADMIN',
        confirmPassword: ''
      });
    }
  }, [mode, user]);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'الاسم الكامل يجب أن يكون على الأقل حرفان';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'الهاتف مطلوب';
    } else if (!/^[0-9]+$/.test(formData.phone)) {
      newErrors.phone = 'الهاتف يجب أن يكون رقماً';
    }

    if (mode === 'add') {
      if (!formData.email.trim()) {
        newErrors.email = 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'البريد الإلكتروني غير صحيح';
      }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      let result;
      
      if (mode === 'add') {
        const userData = {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone,
          role: formData.role
        };
        result = await Api.post('/api/users', userData);
        toast.success('تم إضافة المستخدم بنجاح');
        queryClient.invalidateQueries('users');
      } else {
        const updateData = {
          fullName: formData.fullName.trim(),
          phone: formData.phone,
          role: formData.role
        };
        result = await Api.patch(`/api/users/${user.id}`, updateData);
        toast.success('تم تحديث المستخدم بنجاح');
        queryClient.invalidateQueries('users');
      }

      handleClose();
      if (onSuccess) {
        onSuccess(result.data);
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 'ADMIN',
        confirmPassword: ''
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

  const handleInputChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  };

  // Use the same color for both modes
  const primaryColor = '#28a745';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth={isMobile ? 'md' : 'xs'}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: mode === 'add' ? '30vh' : '40vh',
          width: isMobile ? '90%' : '50%',
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
          <PersonAddIcon />
          <span>{mode === 'add' ? 'إضافة مدير جديد' : 'تعديل المدير'}</span>
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
        <DialogContent sx={{ mt: 1, px: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ 
            fontFamily: 'Cairo', 
            fontWeight: 600, 
            mb: 3, 
            color: primaryColor,
            borderBottom: `2px solid ${primaryColor}`,
            pb: 1,
            textAlign: 'center'
          }}>
            البيانات الأساسية
          </Typography>
          
          <Grid container spacing={6} sx={{ mb: 4, justifyContent: 'center',flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
            <Grid item xs={12} md={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                <TextField
                  sx={{width:'300px'}}
                  label="الاسم الكامل"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
              
            

                <TextField
                  sx={{width:'300px'}}
                  label="الهاتف"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  sx={{width:'300px'}}
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
                        <EmailIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  sx={{width:'300px'}}
                  label="الدور"
                  placeholder="الدور"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  error={!!errors.role}
                  disabled={true}
                  type="text"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AdminPanelSettingsIcon sx={{ color: primaryColor }} />
                      </InputAdornment>
                    ),
                  }}
                />
                
              </Box>
            </Grid>

           
          </Grid>

          {mode === 'add' && (
            <>
              <Typography variant="h6" sx={{ 
                fontFamily: 'Cairo', 
                fontWeight: 600, 
                mb: 3, 
                mt: 2,
                color: primaryColor,
                borderBottom: `2px solid ${primaryColor}`,
                pb: 1,
                textAlign: 'center'
              }}>
                إعدادات كلمة المرور
              </Typography>
              
              <Grid container spacing={6} sx={{ mb: 4, justifyContent: 'center', alignItems: 'center',flexDirection: isMobile ? 'column' : 'row' }}>
                <Grid item xs={12} md={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <TextField
                    sx={{width:'300px'}}
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
                          <LockIcon sx={{ color: primaryColor, fontSize: '20px' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePassword}
                            edge="end"
                            disabled={loading}
                            sx={{ marginRight: '-10px' }}
                          >
                            {showPassword ? <VisibilityOff size={30} /> : <Visibility size={30} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',flexDirection: isMobile ? 'column' : 'row' }}>
                  <TextField
                    sx={{width:'300px'}}
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
                          <LockIcon sx={{ color: primaryColor }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end" sx={{ marginLeft: 0 }}>
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleToggleConfirmPassword}
                            edge="end"
                            disabled={loading}
                            sx={{ marginRight: '-10px' }}
                          >
                            {showConfirmPassword ? <VisibilityOff size={30} /> : <Visibility size={30} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          gap: 3,
          justifyContent: 'space-between',
          display: 'flex',
          alignItems: 'center',
          direction:'ltr',
        }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            size={isMobile ? 'small' : 'large'}
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 500,
              color: primaryColor,  
              borderColor: '#6c757d',
              '&:hover': {
                borderColor: primaryColor,
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
            size={isMobile ? 'small' : 'large'}
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 500,
              backgroundColor: primaryColor,
              '&:hover': {
                backgroundColor: primaryColor,
                opacity: 0.9
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>جاري الحفظ...</span>
              </Box>
            ) : (
              mode === 'add' ? 'إضافة المدير' : 'تحديث المدير'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddUserModal;