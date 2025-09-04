import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  MdDashboard as Dashboard,
  MdPeople as People,
  MdGroup as Group,
  MdAccountBalance as AccountBalance,
  MdTrendingUp as TrendingUp,
  MdAssessment as Assessment,
  MdExitToApp as ExitToApp,
  MdSettings as Settings
} from 'react-icons/md';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('ADMIN');
  const sidebarRef = useRef(null);

  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserRole(user.role || 'ADMIN');
        } else {
          setUserRole('ADMIN');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserRole('ADMIN');
      }
    };

    getUserRole();

    window.addEventListener('storage', getUserRole);
    return () => window.removeEventListener('storage', getUserRole);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const prefetchPage = {
    '/dashboard': () => import('../pages/Dashboard'),
    '/investors': () => import('../pages/Investors'),
    '/users': () => import('../pages/Users'),
    '/transactions': () => import('../pages/Transactions'),
    '/financial-years': () => import('../pages/FinancialYears'),
    '/reports': () => import('../pages/Reports'),
    '/settings': () => import('../pages/Settings')
  };

  const hoverPrefetchCache = new Set();

  const getAllMenuItems = () => {
    const orderedItems = [
      {
        path: '/dashboard',
        label: 'لوحة التحكم',
        icon: <Dashboard size={22} />,
        roles: ['ADMIN', 'USER'] 
      },
      {
        path: '/users',
        label: 'إدارة المستخدمين',
        icon: <Group size={22} />,
        roles: ['ADMIN'] 
      },
      {
        path: '/investors',
        label: 'المساهمين',
        icon: <People size={22} />,
        roles: ['ADMIN'] 
      },
      {
        path: '/transactions',
        label: userRole === 'ADMIN' ? 'العمليات المالية' : '  معاملاتك المالية',
        icon: <AccountBalance size={22} />,
        roles: ['ADMIN', 'USER'] 
      },
      {
        path: '/financial-years',
        label: userRole === 'ADMIN' ? 'السنوات المالية' : 'عرض السنوات المالية',
        icon: <TrendingUp size={22} />,
        roles: ['ADMIN']
      },
      {
        path: '/reports',
        label: 'التقارير',
        icon: <Assessment size={22} />,
        roles: ['ADMIN'] 
      },
      {
        path: '/settings',
        label: 'إعدادات النظام',
        icon: <Settings size={22} />,
        roles: ['ADMIN'] 
      }
    ];

    return orderedItems.filter(item => item.roles.includes(userRole));
  };

  const menuItems = getAllMenuItems();

  const handleHoverPrefetch = (path) => {
    if (!hoverPrefetchCache.has(path) && prefetchPage[path]) {
      hoverPrefetchCache.add(path);
      prefetchPage[path]().catch(() => {
        hoverPrefetchCache.delete(path);
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    navigate('/login', { replace: true });
  };

  return (
    <Box
      ref={sidebarRef}
      sx={{
        width: isOpen ? 280 : 0,
        minWidth: isOpen ? 280 : 0,
        flexShrink: 0,
        transition: 'all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
        position: 'fixed',
        top: 64,
        right: isOpen ? 0 : -280,
        bottom: 0,
        zIndex: 1200,
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        opacity: isOpen ? 1 : 0,
        transform: `translateX(${isOpen ? 0 : 280}px)`,
        boxShadow: isOpen ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none'
      }}
    >
      <Box
        sx={{
          width: 280,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          opacity: isOpen ? 1 : 0,
          transition: 'all 0.1s ease-out',
          transform: isOpen ? 'translateX(0)' : 'translateX(50px)'
        }}
      >
        <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
          {menuItems.map((item, index) => (
            <ListItem
              key={item.path}
              component={NavLink}
              to={item.path}
              onClick={onClose}
              onMouseEnter={() => handleHoverPrefetch(item.path)}
              onFocus={() => handleHoverPrefetch(item.path)}
              sx={{
                borderRadius: 2,
                mb: 2,
                mt: 1,
                textDecoration: 'none',
                color: 'inherit',
                opacity: isOpen ? 1 : 0,
                transition: `all 0.2s ease-out ${index * 0.03}s`,
                '&:hover': {
                  backgroundColor: 'rgba(40, 167, 69, 0.08)',
                  transform: isOpen ? 'translateX(-4px) scale(1.02)' : 'translateX(30px)',
                  boxShadow: '0 2px 8px rgba(40, 167, 69, 0.2)'
                },
                '&.active': {
                  backgroundColor: 'rgba(40, 167, 69, 0.12)',
                  borderRight: '4px solid #28a745',
                  '& .MuiListItemIcon-root': {
                    color: '#28a745'
                  },
                  '& .MuiListItemText-primary': {
                    color: '#28a745',
                    fontWeight: 600
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40, 
                justifyContent: 'center',
                transition: 'transform 0.04s ',
                transform: isOpen ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(180deg)'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontFamily: 'Cairo',
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
          
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid #e0e0e0',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.04s ease-out 0.15s'
        }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleLogout}
            startIcon={<ExitToApp style={{ marginLeft: '10px' }} />}
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 500,
              py: 1.5,
              direction: 'rtl',
              borderRadius: 2,
              transition: 'all 0.05s ease-out',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
              }
            }}
          >
            تسجيل الخروج
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;