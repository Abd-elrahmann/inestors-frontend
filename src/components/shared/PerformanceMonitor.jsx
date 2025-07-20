import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Card, 
  CardContent, 
  IconButton,
  Collapse,
  Grid
} from '@mui/material';
import { 
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { getPerformanceReport, cleanup } from '../../utils/performanceOptimization';

const PerformanceMonitor = ({ show = false, position = 'bottom-right' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [connectionSpeed, setConnectionSpeed] = useState('unknown');

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      updatePerformanceData();
    }, 5000);
      
    measureConnectionSpeed();

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [show]);

  const updatePerformanceData = () => {
    const report = getPerformanceReport();
    setPerformanceData(report);
  };

  const measureConnectionSpeed = () => {
    if (navigator.connection) {
      const connection = navigator.connection;
      setConnectionSpeed(connection.effectiveType || 'unknown');
    }
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 9999,
      minWidth: 200,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 16, right: 16 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 16, left: 16 };
      case 'top-right':
        return { ...baseStyles, top: 16, right: 16 };
      case 'top-left':
        return { ...baseStyles, top: 16, left: 16 };
      default:
        return { ...baseStyles, bottom: 16, right: 16 };
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return `${duration.toFixed(0)}ms`;
  };

  const getPerformanceColor = (duration) => {
    if (!duration) return 'default';
    if (duration < 200) return 'success';
    if (duration < 1000) return 'warning';
    return 'error';
  };

  const getConnectionColor = (speed) => {
    switch (speed) {
      case '4g':
        return 'success';
      case '3g':
        return 'warning';
      case '2g':
      case 'slow-2g':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!show) return null;

  return (
    <Card sx={getPositionStyles()} elevation={8}>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SpeedIcon fontSize="small" color="primary" />
            <Typography variant="caption" fontWeight="bold">
              الأداء
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded}>
          <Box mt={1}>
            {performanceData && (
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <NetworkIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    API Calls
                  </Typography>
                  {Object.entries(performanceData.metrics).map(([operation, duration]) => (
                    <Box key={operation} display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {operation.replace('API: ', '')}
                      </Typography>
                      <Chip
                        label={formatDuration(duration)}
                        size="small"
                        color={getPerformanceColor(duration)}
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <MemoryIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                    Cache
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      Cached Items
                    </Typography>
                    <Chip
                      label={performanceData.cacheStats.cacheSize}
                      size="small"
                      color="info"
                      sx={{ height: 16, fontSize: '0.65rem' }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      Pending
                    </Typography>
                    <Chip
                      label={performanceData.cacheStats.pendingRequests}
                      size="small"
                      color={performanceData.cacheStats.pendingRequests > 0 ? 'warning' : 'success'}
                      sx={{ height: 16, fontSize: '0.65rem' }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      Network
                    </Typography>
                    <Chip
                      label={connectionSpeed.toUpperCase()}
                      size="small"
                      color={getConnectionColor(connectionSpeed)}
                      sx={{ height: 16, fontSize: '0.65rem' }}
                    />
                  </Box>
                </Grid>

                {performance.memory && (
                  <Grid item xs={12}>
                    <Typography variant="caption" display="block" gutterBottom>
                      Memory
                    </Typography>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Used
                      </Typography>
                      <Chip
                        label={`${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`}
                        size="small"
                        color="info"
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor; 