import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  GetApp as ExportIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  TrendingUp as ProfitIcon,
  CalendarToday as CalendarIcon,
  AccountBalance as AccountBalanceIcon,
  RemoveCircleOutline as RemoveIcon
} from '@mui/icons-material';
import { financialYearsAPI } from '../services/apiHelpers';
import { showErrorAlert } from '../utils/sweetAlert';
import Swal from 'sweetalert2';
import { globalCurrencyManager } from '../utils/globalCurrencyManager';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const ProfitDistributionsModal = ({ open, onClose, financialYear }) => {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [forceFullPeriod, setForceFullPeriod] = useState(false);
  
  const handleCalculationTypeChange = () => {
    const newValue = !forceFullPeriod;
    setForceFullPeriod(newValue);
    
    const message = newValue ? 
      "🧮 تم التبديل لمعادلة الفترة الكاملة: سيتم حساب الأرباح بناءً على نسبة المشاركة × إجمالي الربح" :
      "📅 تم التبديل لمعادلة الأيام الجزئية: سيتم حساب الأرباح بناءً على الأيام الفعلية المنقضية";
    
    Swal.fire({
      title: 'تم تغيير طريقة الحساب',
      text: message,
      icon: 'info',
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  };
  // eslint-disable-next-line no-unused-vars
  const [summary, setSummary] = useState({
    totalInvestors: 0,
    totalDistributed: 0,
    totalDays: 0,
    averageProfit: 0
  });

  useEffect(() => {
    if (open && financialYear) {
      fetchDistributions();
      
        const interval = setInterval(() => {
        fetchDistributions();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, financialYear]);

  const fetchDistributions = async () => {
    try {
      setLoading(true);
      const response = await financialYearsAPI.getDistributions(financialYear._id);
      
      if (response.success) {
        let distributionsData = response.data.distributions || [];
  
        setDistributions(distributionsData);
        calculateSummary(distributionsData.filter(d => d.status !== 'inactive'));
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching distributions:', error);
      showErrorAlert('حدث خطأ أثناء جلب توزيعات الأرباح');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (distributionsData) => {
    const totalInvestors = distributionsData.length;
    
    const totalActualProfit = distributionsData.reduce((sum, dist) => sum + (dist.calculation?.calculatedProfit || 0), 0);
    const totalActualDays = distributionsData.reduce((sum, dist) => sum + (dist.calculation?.totalDays || 0), 0);
    
    const totalDistributed = Math.min(totalActualProfit, financialYear?.totalProfit || 0);
    const averageProfit = totalInvestors > 0 ? totalDistributed / totalInvestors : 0;

    setSummary({
      totalInvestors,
      totalDistributed,
      totalDays: totalActualDays,
      averageProfit
    });
  };

  const formatCurrency = (amount, currency) => {
    return globalCurrencyManager.formatAmount(amount, currency);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US');
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'success',
      'distributed': 'info',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'في الانتظار',
      'approved': 'موافق عليه',
      'distributed': 'موزع',
      'cancelled': 'ملغي'
    };
    return statusMap[status] || status;
  };

  const handleUpdateProfits = async () => {
    try {
      setUpdating(true);
      
      const response = await financialYearsAPI.calculateDistributions(financialYear._id, {
        forceFullPeriod
      });
      
      if (response.success) {
        await fetchDistributions();
        const summary = response.data?.summary;
        
        if (summary?.status === 'approved') {
          Swal.fire({
            title: 'توزيعات موافق عليها',
            html: `
              <div style="text-align: right; direction: rtl">
                <p>${summary.message}</p>
                <p>عدد المستثمرين: ${summary.totalApprovedInvestors}</p>
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'حسناً'
          });
        } else {
          const elapsedDays = summary?.elapsedDays || 0;
          const totalDays = summary?.totalDaysInYear || 0;
          const calculationMessage = summary?.calculationMessage;
          
          Swal.fire({
            title: 'تم تحديث الحسابات بنجاح',
            html: `
              <div style="text-align: right; direction: rtl">
                <p>${calculationMessage}</p>
                <p>الأيام المحسوبة: ${elapsedDays} من ${totalDays} يوم</p>
                <p>إجمالي الربح المحسوب: ${formatCurrency(summary.totalCalculatedProfit, financialYear.currency)}</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'حسناً'
          });
          
        }
      } else {
        console.error('فشل تحديث الأرباح:', response.message);
        showErrorAlert(response.message || 'فشل في تحديث الأرباح');
      }
    } catch (error) {
      console.error('خطأ في تحديث الأرباح:', error);
      showErrorAlert('حدث خطأ أثناء تحديث الأرباح');
    } finally {
      setUpdating(false);
    }
  };

  const renderDistributionsTable = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      );
    }

    if (distributions.length === 0) {
      return (
        <Alert severity="info">
          لا توجد توزيعات أرباح لهذه السنة المالية بعد. يرجى حساب التوزيعات أولاً.
        </Alert>
      );
    }

    return (
      <>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant={forceFullPeriod ? "contained" : "outlined"}
              color={forceFullPeriod ? "primary" : "inherit"}
              onClick={handleCalculationTypeChange}
              startIcon={<CalendarIcon />}
              sx={{ ml: 1 }}
            >
              {forceFullPeriod ? " حساب الفترة كاملة" : " حساب الأيام الفعلية"}
            </Button>
            
            <Box sx={{ 
              p: 1, 
              backgroundColor: forceFullPeriod ? 'primary.light' : 'info.light', 
              borderRadius: 1,
              color: 'white',
              fontSize: '0.8rem'
            }}>
              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                {forceFullPeriod ? 
                  "المعادلة: نسبة المشاركة × إجمالي الربح" : 
                  "المعادلة: المبلغ × الأيام × معدل الربح اليومي"
                }
              </Typography>
            </Box>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateProfits}
              disabled={updating}
              startIcon={updating ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {updating ? "جاري التحديث..." : "تحديث الحسابات"}
            </Button>
          </Box>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المستثمر</TableCell>
                <TableCell>تاريخ الانضمام</TableCell>
                <TableCell align="right">رأس المال الحالي</TableCell>
                <TableCell align="right">نسبة المساهمة</TableCell>
                <TableCell align="right">تاريخ بدايه الربح</TableCell>
                <TableCell align="right">عدد الأيام</TableCell>
                <TableCell align="right">مبلغ الربح</TableCell>
                <TableCell align="center">الحالة</TableCell>
                <TableCell align="center">آخر تحديث</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {distributions.map((distribution) => {
                const investmentAmount = distribution.calculation?.investmentAmount || 0;
                const totalCapital = distributions.reduce((sum, d) => sum + (d.calculation?.investmentAmount || 0), 0);
                const sharePercentage = totalCapital > 0 ? (investmentAmount / totalCapital) * 100 : 0;
                
                let calculatedProfit;
                if (forceFullPeriod) {
                  calculatedProfit = (sharePercentage / 100) * financialYear.totalProfit;
                } else {
                  const actualInvestorDays = distribution.calculation?.totalDays || 0;
                  const dailyRate = distribution.calculation?.dailyProfitRate || 0;
                  calculatedProfit = investmentAmount * actualInvestorDays * dailyRate;
                }
                
                  calculatedProfit = Number(calculatedProfit.toFixed(3));

                let remainingProfit = calculatedProfit;
                if (distribution.rolloverSettings?.isRolledOver) {
                  remainingProfit = calculatedProfit - (distribution.rolloverSettings?.rolloverAmount || 0);
                }

                return (
                  <TableRow key={distribution._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {distribution.investorId?.fullName || 'غير محدد'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {distribution.investorId?.startDate ? formatDate(distribution.investorId.startDate) : 'غير محدد'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {formatCurrency(investmentAmount, financialYear.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {sharePercentage.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="info.main">
                        {financialYear.startDate ? formatDate(financialYear.startDate) : 'غير محدد'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {distribution.calculation?.totalDays || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        يوم
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color={distribution.rolloverSettings?.isRolledOver ? "warning.main" : "success.main"}>
                          {formatCurrency(calculatedProfit, financialYear.currency)}
                        </Typography>
                        {distribution.rolloverSettings?.isRolledOver && (
                          <>
                            <Typography variant="caption" color="text.secondary" display="block">
                              تم تدوير: {formatCurrency(distribution.rolloverSettings.rolloverAmount, financialYear.currency)}
                            </Typography>
                            <Typography variant="caption" color="success.main" fontWeight="bold" display="block">
                              المتبقي: {formatCurrency(remainingProfit, financialYear.currency)}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={getStatusText(distribution.status)} 
                        color={getStatusColor(distribution.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {distribution.updatedAt ? new Date(distribution.updatedAt).toLocaleTimeString('en-US') : 'غير محدد'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  if (!financialYear) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      TransitionProps={{
          timeout: { enter: 200, exit: 150 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div" fontWeight="bold">
            توزيعات أرباح {financialYear.periodName || `السنة المالية ${financialYear.year}`}
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title={`تحديث الأرباح والأيام المنقضية${lastUpdated ? ` (آخر تحديث: ${lastUpdated.toLocaleTimeString('ar-SA')})` : ''}`}>
              <IconButton 
                onClick={handleUpdateProfits}
                disabled={updating || loading}
                color="primary"
                sx={{
                  animation: updating ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
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
               📊 آليات حساب الأرباح المتوفرة:
            </Typography>
            <Typography variant="body2" component="div">
              <strong>🧮 معادلة الفترة الكاملة (موصى بها للسنوات المنتهية):</strong>
              <br />
              &nbsp;&nbsp;&nbsp;الربح = نسبة المشاركة × إجمالي الربح
              <br />
              &nbsp;&nbsp;&nbsp;حيث: نسبة المشاركة = مبلغ مساهمة الشخص ÷ إجمالي رؤوس الأموال
              <br /><br />
              
              <strong>📅 معادلة الأيام الجزئية (للسنوات النشطة):</strong>
              <br />
              &nbsp;&nbsp;&nbsp;الربح = مبلغ المساهمة × عدد الأيام × معدل الربح اليومي
              <br /><br />
              
              <strong>📈 بيانات السنة المالية:</strong>
              <br />
              • إجمالي الأرباح: <strong>{financialYear.totalProfit?.toLocaleString()} {financialYear.currency}</strong>
              <br />
              • إجمالي الأيام: <strong>{financialYear.totalDaysCalculated || financialYear.totalDays} يوم</strong>
              <br />
              • معدل الربح اليومي: <strong>{distributions.length > 0 ? distributions[0].calculation?.dailyProfitRate?.toFixed(6) || '0.000000' : 'غير محسوب'} {financialYear.currency}</strong> لكل وحدة استثمار
              <br />
              • <strong>هام:</strong> يتم احتساب الأرباح لكل مساهم بدءًا من تاريخ مساهمته الفعلي
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 3, justifyContent: 'space-between' }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ width: '200px', height: '110px' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        إجمالي المستثمرين
                      </Typography>
                      <Typography variant="h4" component="div">
                        {distributions.length}
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
                        إجمالي الأرباح الموزعة
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatCurrency(
                          distributions.reduce((sum, dist) => {
                            const profit = dist.calculation?.calculatedProfit || 0;
                            const rolloverAmount = dist.rolloverSettings?.isRolledOver ? (dist.rolloverSettings?.rolloverAmount || 0) : 0;
                            return sum + (profit - rolloverAmount);
                          }, 0),
                          financialYear.currency
                        )}
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
                        متوسط الربح للمستثمر
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatCurrency(
                          distributions.length > 0
                            ? distributions.reduce((sum, dist) => {
                                const profit = dist.calculation?.calculatedProfit || 0;
                                const rolloverAmount = dist.rolloverSettings?.isRolledOver ? (dist.rolloverSettings?.rolloverAmount || 0) : 0;
                                return sum + (profit - rolloverAmount);
                              }, 0) / distributions.length
                            : 0,
                          financialYear.currency
                        )}
                      </Typography>
                    </Box>
                    <AccountBalanceIcon color="info" sx={{ fontSize: 40 }} />
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
                      <Typography variant="h6" component="div">
                        {distributions.length > 0 ? (distributions[0].calculation?.dailyProfitRate?.toFixed(6) || '0.000000') : 'غير محسوب'} {distributions.length > 0 ? financialYear.currency : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        لكل وحدة استثمار يومياً
                      </Typography>
                    </Box>
                    <CalendarIcon color="secondary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                معلومات السنة المالية
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
                💡 يتم استخدام معادلتين: للفترة الكاملة (نسبة المشاركة × إجمالي الربح) وللأيام الجزئية (المبلغ × الأيام × معدل الربح اليومي)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2} sx={{justifyContent:'space-between',height:'50px'}}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    الفترة الزمنية
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(financialYear.startDate)} - {formatDate(financialYear.endDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    إجمالي الربح للفترة
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(financialYear.totalProfit, financialYear.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    عدد أيام السنة
                  </Typography>
                  <Typography variant="body1">
                    {Math.floor(Math.abs(new Date(financialYear.endDate) - new Date(financialYear.startDate)) / (1000 * 60 * 60 * 24)) + 1} يوم
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">
                    حالة السنة المالية
                  </Typography>
                  <Chip 
                    label={getStatusText(financialYear.status)} 
                    color={getStatusColor(financialYear.status)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderDistributionsTable()}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 2 }}>     
        <Button 
          onClick={handleUpdateProfits}
          disabled={updating || loading}
          startIcon={updating ? <CircularProgress size={16} /> : <RefreshIcon />}
          variant="contained"
          color="primary"
          size="small"
        >
          {updating ? 'جاري التحديث...' : 'تحديث الأرباح'}
        </Button>
        <Button onClick={onClose} variant="outlined" size="small">
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfitDistributionsModal; 