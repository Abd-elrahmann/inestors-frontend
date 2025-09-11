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
  Tooltip,
  TextField,
  InputAdornment,
  InputBase
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  TrendingUp as ProfitIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import dayjs from 'dayjs';
import { useSettings } from '../hooks/useSettings';
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
  const [searchQuery, setSearchQuery] = useState('');
  const { data: settings } = useSettings();

  if (!distributions || !financialYear) return null;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
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
      'PENDING': 'في انتظار الموافقة',
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
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    if (!settings?.USDtoIQD) return amount;
    
    if (fromCurrency === 'IQD' && toCurrency === 'USD') {
      return amount / settings.USDtoIQD;
    } else if (fromCurrency === 'USD' && toCurrency === 'IQD') {
      return amount * settings.USDtoIQD;
    }
    return amount;
  };

  const filteredDistributions = displayData.distributions?.filter(distribution => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    return (
      distribution.investor.id.toString().includes(query) ||
      distribution.investor.fullName.toLowerCase().includes(query) ||
      distribution.percentage.toString().includes(query) ||
      distribution.daysSoFar.toString().includes(query) ||
      convertCurrency(distribution.amount, displayData.currency||'USD', settings?.defaultCurrency).toString().includes(query) ||
      convertCurrency(distribution.dailyProfit, displayData.currency||'USD', settings?.defaultCurrency).toString().includes(query) ||
      convertCurrency(distribution.totalProfit, displayData.currency||'USD', settings?.defaultCurrency).toString().includes(query)
    );
  }) || [];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth={tabValue === 0}
      sx={{marginRight: tabValue === 1 ? '0' : '250px',scrollbarWidth: 'none'}} 
      fullScreen={tabValue === 1}
      TransitionProps={{
          timeout: { enter: 50, exit: 50 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{scrollbarWidth: 'none'}}>
          <Typography variant="h6" component="div" fontWeight="bold">
            توزيعات أرباح {financialYear.periodName || `السنة المالية`}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{scrollbarWidth: 'none'}}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="ملخص التوزيعات" />
            <Tab label="تفاصيل التوزيعات" />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="textSecondary">
              تاريخ الموافقة: {displayData.summary.approvedAt || 'لم يتم الموافقة بعد'}
            </Typography>

            {tabValue === 1 && (
              <InputBase
                placeholder="بحث في التوزيعات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ width: '250px' }}
                startAdornment={
                  (
                    <InputAdornment position="start" style={{marginLeft: '10px'}}>
                      <SearchIcon />
                    </InputAdornment>
                  )}
                />
            )}
          </Box>
        </Box>

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
              <strong>💰  مبلغ التوزيع:</strong> {convertCurrency(displayData.summary.totalDistributed, displayData.summary.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
              <br />
              <strong>🧮 طريقة حساب الارباح للمستثمر:</strong>
              <br />
              <span>الربح اليومي = (اجمالي مبلغ التوزيع / عدد الايام للمستثمر) * نسبة المساهمة</span>
              <br />
              <span>اجمالي الربح = الربح اليومي * عدد الايام للمستثمر</span>
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
                        {convertCurrency(displayData.summary.totalProfit,displayData.summary.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
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
                        {convertCurrency(displayData.summary.dailyProfit, displayData.summary.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                          minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                          maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                        })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
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
          ) : filteredDistributions.length === 0 ? (
            <Alert severity="warning">
              <strong>لا توجد نتائج للبحث "{searchQuery}"</strong>
              <br />
              جرب البحث بكلمات مختلفة أو امسح حقل البحث لعرض جميع التوزيعات.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 650,width: '100%' }}>
              <Table stickyHeader>
                <TableHead>
                  <StyledTableRow >
                    <StyledTableCell align="center">مسلسل المستثمر</StyledTableCell>
                    <StyledTableCell align="center">المستثمر</StyledTableCell>
                    <StyledTableCell align="center">رأس المال</StyledTableCell>
                    <StyledTableCell align="center">نسبة المساهمة</StyledTableCell>
                    <StyledTableCell align="center"> ايام المستثمر</StyledTableCell>
                    <StyledTableCell align="center"> الربح اليومي</StyledTableCell>
                    <StyledTableCell align="center">اجمالي الربح</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ المساهمة</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {filteredDistributions.map((distribution) => (
                    <StyledTableRow key={distribution.id}>
                      <StyledTableCell align="center">{distribution.investor.id}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.investor.fullName}</StyledTableCell>
                      <StyledTableCell align="center">{convertCurrency(distribution.amount, displayData.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.percentage.toFixed(2)}%</StyledTableCell>
                      <StyledTableCell align="center">{distribution.daysSoFar}</StyledTableCell>
                      <StyledTableCell align="center">{convertCurrency(distribution.dailyProfit, displayData.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell> 
                      <StyledTableCell align="center">{convertCurrency(distribution.totalProfit, displayData.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0,
                        maximumFractionDigits:settings?.defaultCurrency === 'USD' ? 2 : 0
                      })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.investor.createdAt}</StyledTableCell>
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