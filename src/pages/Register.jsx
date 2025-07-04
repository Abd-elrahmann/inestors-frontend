import React, { useState } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
} from '@mui/material';
import { 
  MdVisibility as Visibility, 
  MdVisibilityOff as VisibilityOff, 
  MdAccountBalance as AccountBalance, 
  MdPersonAdd as PersonAdd 
} from 'react-icons/md';
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    nationalId: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);



  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for nationalId to allow only numbers
    if (name === 'nationalId') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = "الاسم الكامل مطلوب";
    }

    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    }

    if (!formData.username.trim()) {
      newErrors.username = "اسم المستخدم مطلوب";
    } else if (formData.username.length < 3) {
      newErrors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = "رقم الهوية مطلوب";
    } else if (!/^[0-9]{10,15}$/.test(formData.nationalId.trim())) {
      newErrors.nationalId = "رقم الهوية يجب أن يكون من 10 إلى 15 رقماً";
    }

    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 6) {
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمة المرور غير متطابقة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare data for backend (force role to 'user' for public registration)
      const userData = {
        username: formData.username.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        nationalId: formData.nationalId.trim(),
        role: "user", // Force user role for public registration
      };

      // Call the backend API without authentication required
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Show success message and redirect to login
        navigate("/login", {
          state: {
            message: "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.",
          },
        });
      } else {
        setErrors({ submit: data.message || "حدث خطأ في إنشاء الحساب" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle different types of errors
      if (err.message.includes('duplicate') || err.message.includes('already exists')) {
        if (err.message.includes('username')) {
          setErrors({ username: "اسم المستخدم مستخدم بالفعل" });
        } else if (err.message.includes('email')) {
          setErrors({ email: "البريد الإلكتروني مستخدم بالفعل" });
        } else if (err.message.includes('nationalId')) {
          setErrors({ nationalId: "رقم الهوية مستخدم بالفعل" });
        } else {
          setErrors({ submit: "اسم المستخدم أو البريد الإلكتروني أو رقم الهوية مستخدم بالفعل" });
        }
      } else if (err.message.includes('Failed to fetch')) {
        setErrors({ 
          submit: "خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم" 
        });
      } else {
        setErrors({ submit: err.message || "حدث خطأ في إنشاء الحساب. يرجى المحاولة مرة أخرى." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%)",
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <AccountBalance
              sx={{
                fontSize: 60,
                color: "#28a745",
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontFamily: "Cairo",
                fontWeight: 600,
                color: "#28a745",
              }}
            >
              إنشاء حساب جديد
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontFamily: "Cairo" }}
            >
              انضم إلى نظام إدارة المساهمين
            </Typography>
          </Box>

          {/* Error Alert */}
          {errors.submit && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                "& .MuiAlert-message": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                  width: "100%",
                },
              }}
            >
              {errors.submit}
            </Alert>
          )}

          {/* Registration Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <TextField
              fullWidth
              label="الاسم الكامل"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              helperText={errors.fullName}
              variant="outlined"
              disabled={isLoading}
              autoComplete="name"
              sx={{
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontFamily: "Cairo",
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                },
              }}
            />

            <TextField
              fullWidth
              label="البريد الإلكتروني"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              disabled={isLoading}
              autoComplete="email"
              sx={{
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontFamily: "Cairo",
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                },
              }}
            />

            <TextField
              fullWidth
              label="اسم المستخدم"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              variant="outlined"
              disabled={isLoading}
              autoComplete="username"
              sx={{
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontFamily: "Cairo",
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                },
              }}
            />

            <TextField
              fullWidth
              label="رقم الهوية"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              error={!!errors.nationalId}
              helperText={errors.nationalId}
              variant="outlined"
              disabled={isLoading}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 15
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontFamily: "Cairo",
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                },
              }}
            />

            <TextField
              fullWidth
              label="كلمة المرور"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              disabled={isLoading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontFamily: "Cairo",
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                },
              }}
            />

            <TextField
              fullWidth
              label="تأكيد كلمة المرور"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              variant="outlined"
              disabled={isLoading}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  right: "14px",
                  left: "auto",
                  transformOrigin: "top right",
                },
                "& .MuiInputBase-input": {
                  textAlign: "right",
                  fontFamily: "Cairo",
                },
                "& .MuiFormHelperText-root": {
                  fontFamily: "Cairo",
                  textAlign: "right",
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                py: 1.5,
                backgroundColor: "#28a745",
                fontFamily: "Cairo",
                fontWeight: 500,
                fontSize: "1.1rem",
                "&:hover": {
                  backgroundColor: "#218838",
                },
                "&:disabled": {
                  backgroundColor: "#cccccc",
                },
              }}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
            </Button>
          </Box>

          {/* Footer Links */}
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography
              variant="body2"
              sx={{ fontFamily: "Cairo", color: "text.secondary" }}
            >
              لديك حساب بالفعل؟{" "}
              <Link
                onClick={() => navigate("/login")}
                sx={{
                  color: "#28a745",
                  cursor: "pointer",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                تسجيل الدخول
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
