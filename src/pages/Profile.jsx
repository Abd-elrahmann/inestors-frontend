import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  Divider,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import {
  MdPerson as Person,
  MdEdit as Edit,
  MdSave as Save,
  MdCancel as Cancel,
  MdEmail as Email,
  MdBadge as Badge,
  MdAccountCircle as AccountCircle
} from 'react-icons/md';
import { authAPI } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    username: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsPageLoading(true);
    setErrors({});
    
    try {
      // First try to get from localStorage
      const localUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      if (localUser) {
        try {
          const userData = JSON.parse(localUser);
          setUser(userData);
          setFormData({
            fullName: userData.fullName || '',
            username: userData.username || ''
          });
          setIsPageLoading(false); // Show page immediately with cached data
        } catch (parseError) {
          console.error('Error parsing localStorage user data:', parseError);
          localStorage.removeItem('user'); // Clean corrupted data
        }
      }

      // Then fetch fresh data from backend
      try {
        const response = await authAPI.getProfile();
        
        if (response.success && response.data && response.data.user) {
          const apiUser = response.data.user;
          setUser(apiUser);
          setFormData({
            fullName: apiUser.fullName || '',
            username: apiUser.username || ''
          });
          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(apiUser));
        } else {
          console.warn('API response format unexpected:', response);
          if (!localUser) {
            setErrors({ submit: 'تنسيق البيانات من الخادم غير صحيح' });
          }
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        // If API call fails but we have localStorage data, continue with that
        if (!localUser) {
          if (apiError.message.includes('Not authorized')) {
            // Token is invalid, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
          }
          setErrors({ submit: 'حدث خطأ في تحميل البيانات من الخادم: ' + apiError.message });
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setErrors({ submit: 'حدث خطأ غير متوقع في تحميل البيانات' });
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (formData.username.length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await authAPI.updateProfile({
        fullName: formData.fullName.trim(),
        username: formData.username.trim()
      });

      if (response.success) {
        // Update local state - البيانات في response.data.user
        const updatedUser = response.data?.user || { ...user, fullName: formData.fullName, username: formData.username };
        setUser(updatedUser);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update formData to reflect the saved changes
        setFormData({
          fullName: updatedUser.fullName || '',
          username: updatedUser.username || ''
        });
        
        setSuccessMessage('تم تحديث البيانات بنجاح!');
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ submit: response.message || 'حدث خطأ في تحديث البيانات' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('already exists')) {
        setErrors({ username: 'اسم المستخدم مستخدم بالفعل' });
      } else {
        setErrors({ submit: error.message || 'حدث خطأ في تحديث البيانات' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      fullName: user?.fullName || '',
      username: user?.username || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  if (isPageLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Cairo', color: '#666' }}>
          جاري تحميل البيانات...
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'Cairo', color: '#999' }}>
          يرجى الانتظار قليلاً
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Cairo', color: '#dc3545' }}>
          فشل في تحميل بيانات المستخدم
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'Cairo', color: '#666', textAlign: 'center' }}>
          حدث خطأ في تحميل بياناتك الشخصية. يرجى المحاولة مرة أخرى.
        </Typography>
        <Button 
          variant="contained" 
          onClick={loadUserData}
          sx={{ 
            fontFamily: 'Cairo',
            backgroundColor: '#28a745',
            '&:hover': { backgroundColor: '#218838' }
          }}
        >
          إعادة المحاولة
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '600px', mx: 'auto', p: 2 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 100,
            height: 100,
            fontSize: '3rem',
            fontFamily: 'Cairo',
            bgcolor: '#28a745',
            mx: 'auto',
            mb: 2
          }}
        >
          {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
        </Avatar>
        <Typography variant="h4" sx={{ fontFamily: 'Cairo', fontWeight: 600, color: '#28a745', mb: 1 }}>
          الملف الشخصي
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Cairo', color: '#666' }}>
          إدارة معلوماتك الشخصية
        </Typography>
      </Paper>

      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, fontFamily: 'Cairo' }}>
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {errors.submit && (
        <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo' }}>
          {errors.submit}
        </Alert>
      )}

      <Grid container spacing={3} justifyContent="center">
        {/* Profile Information */}
        <Grid item xs={12} md={12}>
          <Card sx={{ width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: 'Cairo', fontWeight: 600 }}>
                  المعلومات الشخصية
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    sx={{ fontFamily: 'Cairo' }}
                  >
                    تعديل
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Save />}
                      variant="contained"
                      onClick={handleSave}
                      disabled={isLoading}
                      sx={{ 
                        fontFamily: 'Cairo',
                        backgroundColor: '#28a745',
                        '&:hover': { backgroundColor: '#218838' }
                      }}
                    >
                      {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      disabled={isLoading}
                      sx={{ fontFamily: 'Cairo' }}
                    >
                      إلغاء
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* الصف الأول: الحقول القابلة للتعديل */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="الاسم الكامل"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing || isLoading}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    InputProps={{
                      startAdornment: <Person sx={{ color: '#28a745', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                      '& .MuiInputBase-input': { fontFamily: 'Cairo', textAlign: 'right' },
                      '& .MuiFormHelperText-root': { fontFamily: 'Cairo' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="اسم المستخدم"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!isEditing || isLoading}
                    error={!!errors.username}
                    helperText={errors.username}
                    InputProps={{
                      startAdornment: <AccountCircle sx={{ color: '#28a745', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                      '& .MuiInputBase-input': { fontFamily: 'Cairo', textAlign: 'right' },
                      '& .MuiFormHelperText-root': { fontFamily: 'Cairo' }
                    }}
                  />
                </Grid>
              </Grid>

              {/* الصف الثاني: الحقول للعرض فقط */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="البريد الإلكتروني"
                    value={user.email || 'غير محدد'}
                    disabled
                    InputProps={{
                      startAdornment: <Email sx={{ color: '#666', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                      '& .MuiInputBase-input': { fontFamily: 'Cairo', textAlign: 'right' }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="الدور الوظيفي"
                    value={user.role === 'admin' ? 'مدير النظام' : 'مستخدم عادي'}
                    disabled
                    InputProps={{
                      startAdornment: <Badge sx={{ color: '#666', mr: 1 }} />
                    }}
                    sx={{
                      '& .MuiInputLabel-root': { fontFamily: 'Cairo' },
                      '& .MuiInputBase-input': { fontFamily: 'Cairo', textAlign: 'right' }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 