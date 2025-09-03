import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/commonStyles.css';
import './styles/sweetAlert.css';
import { globalCurrencyManager } from './utils/globalCurrencyManager';
import routes from './routes';

const Navbar = React.lazy(() => import('./components/Navbar'));
const Sidebar = React.lazy(() => import('./components/Sidebar'));

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
`;

const fadeInOut = keyframes`
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
`;

const SmallLoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '64px',
      width: '100%'
    }}
  >
    <CircularProgress 
      size={24} 
      sx={{ 
        color: '#28a745',
        animation: `${pulse} 1s ease-in-out infinite`
      }} 
    />
  </Box>
);

  const SidebarLoadingSpinner = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 64,
      right: 0,
      bottom: 0,
      width: '280px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      zIndex: 1199
    }}
  >
    <CircularProgress 
      size={20} 
      sx={{ 
        color: '#28a745',
        opacity: 0.5
      }} 
    />
  </Box>
);

const LoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: { xs: '100px', md: '150px' },
      gap: 1.5,
      p: 2,
      position: 'relative'
    }}
  >
    <CircularProgress 
      size={32}
      thickness={4}
      sx={{ 
        color: '#28a745',
        animation: `${pulse} 1s ease-in-out infinite`
      }} 
    />
    <Typography 
      variant="caption"
      sx={{ 
        fontFamily: 'Cairo',
        color: '#888',
        fontSize: '0.8rem',
        textAlign: 'center',
        animation: `${fadeInOut} 1.5s ease-in-out infinite`
      }}
    >
      تحميل...
    </Typography>
  </Box>
);

const FastLoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60px',
      width: '100%'
    }}
  >
    <CircularProgress 
      size={20} 
      thickness={5}
      sx={{ 
        color: '#28a745'
      }} 
    />
  </Box>
);

const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Cairo, Tajawal, Arial, sans-serif',
  },
  palette: {
    primary: {
      main: '#28a745',
      dark: '#218838',
      light: '#d4edda',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
});

const AppLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  
  useEffect(() => {
    const initializeSidebar = () => {
      try {
        const savedSidebarState = localStorage.getItem('sidebarOpen');
        if (savedSidebarState !== null) {
          setIsSidebarOpen(JSON.parse(savedSidebarState));
        } else {
          setIsSidebarOpen(true); 
        }
      } catch (error) {
        console.warn('Error loading sidebar state:', error);
        setIsSidebarOpen(true);
      }
      setIsInitialized(true);
    };

    
    const timer = setTimeout(initializeSidebar, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [location]);

  
  useEffect(() => {
    if (isLoggedIn) {
      globalCurrencyManager.initialize().catch(error => {
        console.warn('Failed to initialize currency manager:', error);
      });
    }
  }, [isLoggedIn]);

  const handleMenuToggle = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  const handleSidebarClose = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {routes
            .filter(route => !route.protected)
            .map(route => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <PublicRoute>
                    <route.element />
                  </PublicRoute>
                }
              />
            ))}
        </Routes>
      </Suspense>
    );
  }

      return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        overflow: 'hidden' 
      }}>
        
        <Navbar onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      
              <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          mt: '64px', 
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '100vw' 
        }}>
          
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1,
            p: isLoggedIn ? 3 : 0,
            transition: 'margin-right 0.2s ease-out, width 0.2s ease-out', 
            marginRight: { 
              xs: 0, 
              md: (isLoggedIn && isInitialized && isSidebarOpen) ? '280px' : '0' 
            },
            width: {
              xs: '100%',
              md: (isLoggedIn && isInitialized && isSidebarOpen) ? 'calc(100% - 280px)' : '100%'
            },
            maxWidth: {
              xs: '100vw',
              md: (isLoggedIn && isInitialized && isSidebarOpen) ? 'calc(100vw - 280px)' : '100vw'
            },
            backgroundColor: isLoggedIn ? '#f8f9fa' : 'transparent',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto', 
            overflowX: 'hidden' 
          }}
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {routes
                .filter(route => route.protected)
                .map(route => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      <ProtectedRoute>
                        <route.element />
                      </ProtectedRoute>
                    }
                  />
                ))}
            </Routes>
          </Suspense>
        </Box>
        
        {isLoggedIn && isInitialized && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={handleSidebarClose}
            onToggle={handleMenuToggle}
          />
        )}
      </Box>
    </Box>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return !token ? children : <Navigate to="/" />;
};

function App() {

  useEffect(() => {
    globalCurrencyManager.initialize().catch(error => {
      console.error('Error initializing currency manager:', error);
    });

  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppLayout />
      </Router>
      
      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
}

export default App;
