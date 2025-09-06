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
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  TrendingUp as ProfitIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import dayjs from 'dayjs';
import Api from '../services/api';
import { toast } from 'react-toastify';
import { useQueryClient } from 'react-query';

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
  const [loading, setLoading] = useState(false);
  const [updatingRollover, setUpdatingRollover] = useState(null);
  const { formatAmount, convertAmount } = useCurrencyManager();
  const queryClient = useQueryClient();

  if (!distributions || !financialYear) return null;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (date) => {
    return dayjs(date).format('DD/MM/YYYY');
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'calculated': 'info',
      'approved': 'success',
      'distributed': 'info',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'في الانتظار',
      'calculated': 'تم الحساب',
      'approved': 'موافق عليه',
      'distributed': 'موزع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  };

  const handleRolloverToggle = async (distribution) => {
    try {
      setUpdatingRollover(distribution.id);
      
      // Update the rollover status using the correct endpoint
      await Api.patch(`/api/financial-years/${financialYear.id}/distribute`, {
        isRollover: distribution.isRollover ? false : true // Toggle rollover status
      });
      
      // Refresh data after update
      queryClient.invalidateQueries(['distributions', financialYear.id]);
      toast.success('تم تحديث حالة التدوير بنجاح');
    } catch (error) {
      console.error('Error updating rollover status:', error);
      toast.error('فشل في تحديث حالة التدوير');
    } finally {
      setUpdatingRollover(null);
    }
  };
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
              <strong >💰 إجمالي الربح:</strong> {formatAmount(convertAmount(financialYear.totalProfit, financialYear.currency, 'USD'), 'USD')}
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
                        {distributions.summary.totalInvestors}
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
                        إجمالي الربح
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatAmount(convertAmount(distributions.summary.totalDailyProfit, financialYear.currency, 'USD'), 'USD')}
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
                        متوسط الربح
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatAmount(convertAmount(distributions.summary.averageDailyProfit, financialYear.currency, 'USD'), 'USD')}
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
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                     الفترة الزمنية
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    {formatDate(financialYear.startDate)} - {formatDate(financialYear.endDate)}
                    <br />
                    {`(${distributions.summary.totalDays||0} يوم)`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                    حالة السنة المالية
                  </Typography>
                  <Chip 
                    label={getStatusText(distributions.status)} 
                    color={getStatusColor(distributions.status)}
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
          ) : !distributions.distributions || distributions.distributions.length === 0 ? (
            <Alert severity="info">
              لا توجد توزيعات أرباح لهذه السنة المالية بعد.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 650,width: '100%' }}>
              <Table stickyHeader>
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell align="center">المستثمر</StyledTableCell>
                    <StyledTableCell align="center">رأس المال</StyledTableCell>
                    <StyledTableCell align="center">نسبة المساهمة</StyledTableCell>
                    <StyledTableCell align="center">الربح</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ المساهمة</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ التوزيع</StyledTableCell>
                    <StyledTableCell align='center'>تدوير الأرباح</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {distributions.distributions.map((distribution) => (
                    <StyledTableRow key={distribution.id}>
                      <StyledTableCell align="center">{distribution.investors.fullName}</StyledTableCell>
                      <StyledTableCell align="center">{formatAmount(convertAmount(distribution.amount, financialYear.currency, 'USD'), 'USD')}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.percentage.toFixed(2)}%</StyledTableCell>
                      <StyledTableCell align="center">{formatAmount(convertAmount(distribution.totalProfit, financialYear.currency, 'USD'), 'USD')}</StyledTableCell>
                      <StyledTableCell align="center">{dayjs(distribution.investors.createdAt).format('MMM DD, YYYY, hh:mm A')}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.distributedAt}</StyledTableCell>
                      <StyledTableCell align="center">
                        <Tooltip title={distribution.isRollover ? 'تم التدوير' : 'غير متدور'}>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                              {updatingRollover === distribution.id ? (
                              <CircularProgress size={24} color="success" />
                            ) : (
                              <IconButton
                                onClick={() => handleRolloverToggle(distribution)}
                                disabled={loading}
                                color={distribution.isRollover ? "success" : "default"}
                                size="small"
                              >
                                {distribution.isRollover ? <ClearIcon color="error" /> : <CheckIcon color="success" />}
                              </IconButton>
                            )}
                          </Box>
                        </Tooltip>
                      </StyledTableCell>
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