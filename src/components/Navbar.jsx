import React, { useState, useEffect } from 'react';
import { Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { MdMenu as MenuIcon, MdMenuOpen as MenuOpenIcon, MdPerson as Person, MdExitToApp as ExitToApp } from 'react-icons/md';
import { useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../services/api';

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkUserStatus = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    };

    if (!isInitialized || location.pathname === '/login' || location.pathname === '/register') {
      checkUserStatus();
    }

    const handleStorageChange = () => {
      checkUserStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname, isInitialized]); 

  const navbarVariants = {
    hidden: { 
      y: -80,
      opacity: 0 
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3, 
        ease: "easeOut",
        staggerChildren: 0.05 
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: -10 
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2, 
        ease: "easeOut"
      }
    }
  };

  const userInfoVariants = {
    hidden: { 
      opacity: 0,
      x: 10, 
      scale: 0.98 
    },
    visible: { 
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.25, 
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: 10,
      scale: 0.98,
      transition: {
        duration: 0.15 
      }
    }
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      handleUserMenuClose();
      
      navigate('/login', { replace: true });
    }
  };

  const handleProfile = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  if (!isInitialized) {
    return null;
  }

  return (
    <motion.div
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1201,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e0e0e0'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', direction: 'rtl' }}>
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="toggle sidebar"
                onClick={() => {
                  onMenuToggle();
                  window.dispatchEvent(new Event('sidebarToggle'));
                }}
                sx={{ 
                  color: '#28a745',
                  mr: 1,
                    transition: 'all 0.15s ease', 
                  '&:hover': {
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                {isSidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
              </IconButton>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="h6" 
                component="div"
                sx={{ 
                  fontFamily: 'Cairo',
                  fontWeight: 600,
                  color: '#28a745',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                نظام إدارة المساهمين
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="user-logged-in"
                variants={userInfoVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Box sx={{ textAlign: 'right', mr: 2, display: 'block' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'Cairo',
                      color: '#666',
                      fontSize: '0.85rem'
                    }}
                  >
                    مرحباً
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'Cairo',
                      fontWeight: 600,
                      color: '#28a745'
                    }}
                  >
                    {user.username}
                  </Typography>
                </Box>
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: '#28a745',
                      width: 40,
                      height: 40,
                      fontSize: '1.2rem',
                      fontFamily: 'Cairo'
                    }}
                  >
                    {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleUserMenuClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  sx={{
                    '& .MuiMenuItem-root': {
                      fontFamily: 'Cairo',
                      direction: 'rtl'
                    }
                  }}
                >
                  <MenuItem onClick={handleProfile}>
                    <Person sx={{ mr: 1, ml: 0 }} />
                    الملف الشخصي
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ExitToApp sx={{ mr: 1, ml: 0 }} />
                    تسجيل الخروج
                  </MenuItem>
                </Menu>
              </motion.div>
            ) : (
              <motion.div
                key="user-not-logged-in"
                variants={userInfoVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Button 
                  color="inherit"
                  onClick={() => navigate('/register')}
                  sx={{ 
                    fontFamily: 'Cairo',
                    color: '#28a745',
                    '&:hover': {
                      backgroundColor: 'rgba(40, 167, 69, 0.1)'
                    }
                  }}
                >
                  إنشاء حساب
                </Button>
                <Button 
                  variant="contained"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    fontFamily: 'Cairo',
                    backgroundColor: '#28a745',
                    '&:hover': {
                      backgroundColor: '#218838'
                    }
                  }}
                >
                  تسجيل الدخول
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Toolbar>
    </motion.div>
  );
};

export default Navbar; 