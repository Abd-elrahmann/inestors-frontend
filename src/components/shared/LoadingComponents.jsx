import React from 'react';
import { Box, Alert, CircularProgress, Button, Typography, Backdrop, Skeleton, Card, CardContent, LinearProgress, Fade } from '@mui/material';
import { MdRefresh as RefreshIcon } from 'react-icons/md';


const sharedStyles = {
  fontFamily: 'Cairo',
  primaryColor: '#28a745'
};


export const PageLoadingSpinner = ({ message = 'جاري التحميل...', minHeight = '400px' }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: minHeight,
      gap: 2
    }}
  >
    <CircularProgress 
      size={40} 
      sx={{ color: sharedStyles.primaryColor }} 
    />
    <Typography 
      variant="body1"
      sx={{ 
        fontFamily: sharedStyles.fontFamily, 
        color: '#666', 
        fontSize: '16px',
        margin: 0
      }}
    >
      {message}
    </Typography>
  </Box>
);


export const SmallLoadingSpinner = ({ size = 24 }) => (
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
      size={size} 
      sx={{ color: sharedStyles.primaryColor }} 
    />
  </Box>
);


export const ErrorAlert = ({ 
  error, 
  onRetry = null, 
  retryText = 'إعادة المحاولة',
  severity = 'error' 
}) => (
  <Box sx={{ mb: 3 }}>
    <Alert 
      severity={severity}
      sx={{ 
        fontFamily: sharedStyles.fontFamily,
        '& .MuiAlert-message': {
          fontSize: '14px'
        }
      }}
      action={
        onRetry && (
          <Button 
            color="inherit" 
            size="small"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            sx={{ fontFamily: sharedStyles.fontFamily }}
          >
            {retryText}
          </Button>
        )
      }
    >
      {error}
    </Alert>
  </Box>
);


export const FormLoadingOverlay = ({ loading, children }) => (
  <Box sx={{ position: 'relative' }}>
    {children}
    {loading && (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <CircularProgress 
          size={30} 
          sx={{ color: sharedStyles.primaryColor }} 
        />
      </Box>
    )}
  </Box>
);


export const EmptyState = ({ 
  message = 'لا توجد بيانات', 
  icon = null,
  actionButton = null 
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px',
      gap: 2,
      color: '#666'
    }}
  >
    {icon && (
      <Box sx={{ fontSize: '48px', color: '#ccc' }}>
        {icon}
      </Box>
    )}
    <Typography 
      variant="h6" 
      sx={{ 
        fontFamily: sharedStyles.fontFamily,
        color: '#666'
      }}
    >
      {message}
    </Typography>
    {actionButton}
  </Box>
);


export const QuickLoader = ({ size = 24, color = "primary" }) => (
  <Box display="flex" justifyContent="center" alignItems="center" p={1}>
    <CircularProgress size={size} color={color} thickness={4} />
  </Box>
);


export const FullScreenLoader = ({ open, message = "جاري التحميل..." }) => (
  <Backdrop 
    sx={{ 
      color: '#fff', 
      zIndex: 9999,
      backdropFilter: 'blur(2px)',
      backgroundColor: 'rgba(0, 0, 0, 0.3)'
    }} 
    open={open}
  >
    <Fade in={open} timeout={300}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress color="inherit" size={50} thickness={3} />
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {message}
        </Typography>
      </Box>
    </Fade>
  </Backdrop>
);


export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <Box sx={{ width: '100%' }}>
    {[...Array(rows)].map((_, index) => (
      <Box key={index} display="flex" gap={2} p={1} alignItems="center">
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton 
            key={colIndex} 
            variant="text" 
            width={`${Math.random() * 100 + 80}px`}
            height={40}
            animation="wave"
          />
        ))}
      </Box>
    ))}
  </Box>
);


export const CardSkeleton = ({ count = 4 }) => (
  <Box display="flex" gap={2} flexWrap="wrap">
    {[...Array(count)].map((_, index) => (
      <Card key={index} sx={{ minWidth: 200, flex: 1 }}>
        <CardContent>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="rectangular" width="100%" height={20} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    ))}
  </Box>
);


export const ProgressBar = ({ progress, message }) => (
  <Box sx={{ width: '100%', mb: 2 }}>
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {Math.round(progress)}%
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={progress} 
      sx={{ height: 6, borderRadius: 3 }}
    />
  </Box>
);


export const ModalLoader = ({ loading, children, message = "جاري التحميل..." }) => {
  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight={200}
        gap={2}
      >
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Fade in={!loading} timeout={300}>
      <div>{children}</div>
    </Fade>
  );
};

  
export const PageLoader = ({ loading, children, skeletonType = "table" }) => {
  if (loading) {
    return (
      <Box p={2}>
        {skeletonType === "table" && <TableSkeleton />}
        {skeletonType === "cards" && <CardSkeleton />}
      </Box>
    );
  }
  
  return (
    <Fade in={!loading} timeout={500}>
      <div>{children}</div>
    </Fade>
  );
};

export default {
  QuickLoader,
  FullScreenLoader,
  TableSkeleton,
  CardSkeleton,
  ProgressBar,
  ModalLoader,
  PageLoader
}; 