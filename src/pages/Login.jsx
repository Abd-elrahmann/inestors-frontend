import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { MdVisibility as Visibility, MdVisibilityOff as VisibilityOff, MdAccountBalance as AccountBalance, MdLogin as LoginIcon } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.username || !formData.password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.login({
        username: formData.username.trim(),
        password: formData.password
      });

      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setSuccess('تم تسجيل الدخول بنجاح!');
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        setError(response.message || 'حدث خطأ في تسجيل الدخول');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.message.includes('Invalid credentials')) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else if (err.message.includes('deactivated')) {
        setError('تم إيقاف حسابك. يرجى التواصل مع المدير');
      } else if (err.message.includes('Failed to fetch')) {
        setError('خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم');
      } else {
        setError(err.message || 'حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%)',
        padding: 2
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 450,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          borderRadius: 3
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <AccountBalance 
              sx={{ 
                fontSize: 60, 
                color: '#28a745', 
                mb: 2 
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontFamily: 'Cairo',
                fontWeight: 600,
                color: '#28a745'
              }}
            >
              نظام إدارة المساهمين
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontFamily: 'Cairo' }}
            >
              مرحباً بك، يرجى تسجيل الدخول للمتابعة
            </Typography>
          </Box>

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  fontFamily: 'Cairo',
                  textAlign: 'right',
                  width: '100%'
                }
              }}
            >
              {success}
            </Alert>
          )}

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  fontFamily: 'Cairo',
                  textAlign: 'right',
                  width: '100%'
                }
              }}
            >
              {error}
            </Alert>
          )}


          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <TextField
              fullWidth
              label="اسم المستخدم"
              name="username"
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
              disabled={isLoading}
              autoComplete="username"
              sx={{
                '& .MuiInputLabel-root': {
                  fontFamily: 'Cairo',
                  right: '14px',
                  left: 'auto',
                  transformOrigin: 'top right'
                },
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                  fontFamily: 'Cairo'
                }
              }}
            />

            <TextField
              fullWidth
              label="كلمة المرور"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              variant="outlined"
              disabled={isLoading}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff size={40} /> : <Visibility size={40} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiInputLabel-root': {
                  fontFamily: 'Cairo',
                  right: '14px',
                  left: 'auto',
                  transformOrigin: 'top right'
                },
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                  fontFamily: 'Cairo'
                }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                py: 1.5,
                backgroundColor: '#28a745',
                fontFamily: 'Cairo',
                fontWeight: 500,
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: '#218838'
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                  <span>جاري تسجيل الدخول...</span>
                </Box>
              ) : 'تسجيل الدخول'}
            </Button>
          </Box>

              
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ fontFamily: 'Cairo', color: 'text.secondary' }}>
              تسجيل الدخول للإدمن فقط
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login; 