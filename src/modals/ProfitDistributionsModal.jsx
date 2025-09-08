import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Paper,
  IconButton,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  TrendingUp as ProfitIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import dayjs from 'dayjs';
import Api from '../services/api';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ProfitDistributionsModal = ({ open, onClose, financialYear, distributions }) => {
  const [tabValue, setTabValue] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const { convertAmount, currentCurrency } = useCurrencyManager();

  if (!distributions || !financialYear) return null;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (date) => {
    return dayjs(date).format('DD/MM/YYYY');
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'warning',
      'DISTRIBUTED': 'info',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'قيد التوزيع',
      'DISTRIBUTED': 'موزع',
    };
    return statusMap[status] || status;
  };

  const displayData = distributions.status === 'PENDING' ? {
    ...distributions,
    summary: {
      ...distributions.summary,
      totalInvestors: distributions.summary.totalInvestors,
      totalProfit: distributions.summary.totalProfit,
      dailyProfit: distributions.summary.dailyProfit
    },
    distributions: distributions.distributions
  } : distributions;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg"
      sx={{marginRight: '250px'}} 
      fullWidth
      TransitionProps={{
          timeout: { enter: 200, exit: 150 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div" fontWeight="bold">
            توزيعات أرباح {financialYear.periodName || `السنة المالية`}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="ملخص التوزيعات" />
          <Tab label="تفاصيل التوزيعات" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            color:'black',
            p: 2, 
            borderRadius: 1, 
            mb: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle2" gutterBottom>
              📊 معلومات السنة المالية
            </Typography>
            <Typography variant="body2" component="div" sx={{mb: 2}}>
              <strong>💰  مبلغ التوزيع:</strong> {convertAmount(displayData.summary.totalProfit, displayData.summary.currency||'IQD', currentCurrency).toLocaleString('en-US', {
                minimumFractionDigits: currentCurrency === 'USD' ? 2 : 0,
                maximumFractionDigits: currentCurrency === 'USD' ? 2 : 0
              })} {currentCurrency === 'USD' ? '$' : 'د.ع'}
              <br />
              <strong>🧮 طريقة حساب الارباح للمستثمر:</strong> اجمالي الربح x نسبة المساهمة
              <br />
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 3, justifyContent: 'center' }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ width: '200px', height: '110px' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        إجمالي المستثمرين
                      </Typography>
                      <Typography variant="h4" component="div">
                        {displayData.summary.totalInvestors}
                      </Typography>
                    </Box>
                    <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ width: '300px', height: '110px' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        إجمالي التوزيع
                      </Typography>
                      <Typography variant="h5" component="div">
                        {convertAmount(displayData.summary.totalProfit,displayData.summary.currency||'IQD', currentCurrency).toLocaleString('en-US', {
                          minimumFractionDigits: currentCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits: currentCurrency === 'USD' ? 2 : 0
                        })} {currentCurrency === 'USD' ? '$' : 'د.ع'}
                      </Typography>
                    </Box>
                    <ProfitIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ width: '220px', height: '110px' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        معدل الربح اليومي
                      </Typography>
                      <Typography variant="h5" component="div">
                        {convertAmount(displayData.summary.dailyProfit, displayData.summary.currency||'IQD', currentCurrency).toLocaleString('en-US', {
                          minimumFractionDigits: currentCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits: currentCurrency === 'USD' ? 2 : 0
                        })} {currentCurrency === 'USD' ? '$' : 'د.ع'}
                      </Typography>
                    </Box>
                    <AccountBalanceIcon color="info" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent sx={{mb: 2}}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                ملخص التوزيعات
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} sx={{justifyContent:'space-between', height:'50px'}}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                     الفترة الزمنية
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    {formatDate(financialYear.startDate)} - {formatDate(financialYear.endDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                    الايام
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    الايام حتى الان: {displayData.summary.daysSoFar || 0}
                    <br/>
                    اجمالي الايام: {displayData.summary.totalDays || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                    حالة السنة المالية
                  </Typography>
                  <Chip 
                    label={getStatusText(displayData.status)} 
                    color={getStatusColor(displayData.status)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          ) : !displayData.distributions || displayData.distributions.length === 0 ? (
            <Alert severity="info">
              <strong>لا توجد توزيعات أرباح لهذه السنة المالية بعد</strong>
              <br />
              برجاء الانتظار حتى يتم توزيع الأرباح.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 650,width: '100%' }}>
              <Table stickyHeader>
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell align="center">المستثمر</StyledTableCell>
                    <StyledTableCell align="center">رأس المال</StyledTableCell>
                    <StyledTableCell align="center">نسبة المساهمة</StyledTableCell>
                    <StyledTableCell align="center"> الربح اليومي</StyledTableCell>
                    <StyledTableCell align="center">اجمالي الربح</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ المساهمة</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ التوزيع</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {displayData.distributions.map((distribution) => (
                    <StyledTableRow key={distribution.id}>
                      <StyledTableCell align="center">{distribution.investor.fullName}</StyledTableCell>
                      <StyledTableCell align="center">{convertAmount(distribution.investor.amount, displayData.currency||'IQD', currentCurrency).toLocaleString('en-US', {
                        minimumFractionDigits: currentCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currentCurrency === 'USD' ? 2 : 0
                      })} {currentCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.percentage.toFixed(2)}%</StyledTableCell>
                      <StyledTableCell align="center">{convertAmount(distribution.dailyProfit, displayData.currency||'IQD', currentCurrency).toLocaleString('en-US', {
                        minimumFractionDigits: currentCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currentCurrency === 'USD' ? 2 : 0
                      })} {currentCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{convertAmount(distribution.totalProfit, displayData.currency||'IQD', currentCurrency).toLocaleString('en-US', {
                        minimumFractionDigits: currentCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currentCurrency === 'USD' ? 2 : 0
                      })} {currentCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.investor.createdAt}</StyledTableCell>
                      <StyledTableCell align="center">{displayData.summary.distributedAt}</StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default ProfitDistributionsModal;