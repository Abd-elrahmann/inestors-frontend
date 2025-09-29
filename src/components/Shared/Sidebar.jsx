import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  MdDashboard as DashboardIcon,
  MdPeople as People,
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
  const [prefetchedPages, setPrefetchedPages] = useState(new Set());

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

  const prefetchComponent = async (path) => {
    if (prefetchedPages.has(path)) return;

    const prefetchPromise = (async () => {
      try {
        const importPromise = (() => {
          switch(path) {
            case '/dashboard': return import('../../pages/Dashboard');
            case '/investors': return import('../../pages/Investors/Investors');
            case '/transactions': return import('../../pages/Transactions/Transactions');
            case '/financial-years': return import('../../pages/FinancialYears/FinancialYears');
            case '/reports': return import('../../pages/Reports');
            case '/settings': return import('../../pages/Settings');
            default: return null;
          }
        })();

        if (importPromise) {
          await importPromise;
          setPrefetchedPages(prev => new Set([...prev, path]));
        }
      } catch (err) {
        console.error('Error prefetching:', err);
      }
    })();

    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => prefetchPromise);
    } else {
      setTimeout(() => prefetchPromise, 0);
    }
  };

  const getAllMenuItems = () => {
    const orderedItems = [
      {
        path: '/dashboard',
        label: 'لوحة التحكم',
        icon: <DashboardIcon size={22} />,
        roles: ['ADMIN']
      },
      {
        path: '/investors',
        label: 'المستثمرين',
        icon: <People size={22} />,
        roles: ['ADMIN']
      },
      {
        path: '/transactions',
        label: userRole === 'ADMIN' ? 'العمليات المالية' : '  معاملاتك المالية',
        icon: <AccountBalance size={22} />,
        roles: ['ADMIN']
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
        transition: 'all 0.05s ease-out',
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
          transition: 'all 0.05s ease-out',
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
              onMouseEnter={() => prefetchComponent(item.path)}
              onFocus={() => prefetchComponent(item.path)}
              sx={{
                borderRadius: 2,
                mb: 2,
                mt: 2,
                textDecoration: 'none',
                color: 'inherit',
                opacity: isOpen ? 1 : 0,
                transition: `all 0.1s ease-out ${index * 0.02}s`,
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
                transition: 'transform 0.03s ease',
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
          transition: 'all 0.03s ease-out 0.1s'
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
              py: 1,
              direction: 'rtl',
              borderRadius: 2,
              transition: 'all 0.01s ease-out',
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