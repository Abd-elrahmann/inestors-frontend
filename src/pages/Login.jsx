import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  MdVisibility as Visibility,
  MdVisibilityOff as VisibilityOff,
  MdAccountBalance as AccountBalance,
  MdLogin as LoginIcon,
} from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import Api, { handleApiError } from "../services/api";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Spin } from "antd";
import { Helmet } from "react-helmet-async";
import { useMutation } from "react-query";
import { ArrowLeftOutlined } from "@ant-design/icons";

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("البريد الإلكتروني غير صالح")
    .required("البريد الإلكتروني مطلوب"),
  password: Yup.string().trim().required("كلمة المرور مطلوبة"),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const loadUserProfile = async () => {
    try {
      const response = await Api.get("/api/profile");
      if (response.data) {
        const userData = {
          fullName: response.data.fullName,
          userName: response.data.userName,
          email: response.data.email,
          role: response.data.role,
          profileImage: response.data.profileImage,
        };
        localStorage.setItem("profile", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loginMutation = useMutation(
    async (credentials) => {
      const response = await Api.post("/api/auth/login", credentials);
      return response.data;
    },
    {
      onSuccess: async (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Load profile data after successful login
        await loadUserProfile();
        
        toast.success("تم تسجيل الدخول بنجاح!");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      },
      onError: (error) => {
        handleApiError(error);
        if (error?.response?.data?.message?.includes("Invalid credentials")) {
          toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        } else {
          toast.error("حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى");
        }
      },
    }
  );

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
      <Helmet>
        <title>تسجيل الدخول</title>
        <meta name="description" content="تسجيل الدخول لنظام إدارة المساهمين" />
      </Helmet>
      <Card
        sx={{
          maxWidth: 450,
          width: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
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
              نظام إدارة المساهمين
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontFamily: "Cairo" }}
            >
              مرحباً بك، يرجى تسجيل الدخول للمتابعة
            </Typography>
          </Box>

          <Formik
            initialValues={{
              email: "",
              password: "",
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              try {
                await loginMutation.mutateAsync({
                  email: values.email.trim(),
                  password: values.password,
                });
              } catch (error) {
                console.error(error);
              }
            }}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
            }) => (
              <Form onSubmit={handleSubmit}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                    autoComplete="username"
                    disabled={loginMutation.isLoading}
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
                    }}
                  />

                  <TextField
                    fullWidth
                    label="كلمة المرور"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    variant="outlined"
                    autoComplete="current-password"
                    disabled={loginMutation.isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePassword}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOff size={40} />
                            ) : (
                              <Visibility size={40} />
                            )}
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
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loginMutation.isLoading}
                    sx={{
                      py: 1.5,
                      backgroundColor: "#28a745",
                      fontFamily: "Cairo",
                      fontWeight: 500,
                      fontSize: "1.1rem",
                      "&:hover": {
                        backgroundColor: "#218838",
                      },
                    }}
                  >
                    {loginMutation.isLoading ? (
                      <>
                        <Spin size="small" style={{ marginLeft: 8 }} />
                        تسجيل الدخول جاري
                      </>
                    ) : (
                      <>
                        تسجيل الدخول
                        <ArrowLeftOutlined style={{ marginRight: 8 }} />
                      </>
                    )}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;