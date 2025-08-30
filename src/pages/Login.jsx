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
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet-async';

const validationSchema = Yup.object().shape({
  email: Yup.string().trim()
    .email('البريد الإلكتروني غير صالح')
    .required('البريد الإلكتروني مطلوب'),
  password: Yup.string().trim()
    .required('كلمة المرور مطلوبة')
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      <Helmet>
        <title>تسجيل الدخول</title>
        <meta name="description" content="تسجيل الدخول لنظام إدارة المساهمين" />
      </Helmet>
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

          <Formik
            initialValues={{
              email: '',
              password: ''
            }}
            validationSchema={validationSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setError('');
              try {
                const response = await authAPI.login({
                  email: values.email.trim(),
                  password: values.password
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
                  setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
                } else {
                  setError(err.message || 'حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى');
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
              <Form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="البريد الإلكتروني"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    variant="outlined"
                    disabled={isSubmitting}
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
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    variant="outlined"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePassword}
                            edge="end"
                            disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    {isSubmitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Spin size="small" />
                        <span>جاري تسجيل الدخول...</span>
                      </Box>
                    ) : 'تسجيل الدخول'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
              
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