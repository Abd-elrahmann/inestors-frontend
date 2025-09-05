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
  const { formatAmount } = useCurrencyManager();

  if (!distributions || !financialYear) return null;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate1 = (date) => {
    return dayjs(date).format('DD/MM/YYYY');
  }


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
              <strong >💰 إجمالي الربح:</strong> {formatAmount(financialYear.totalProfit, financialYear.currency)}
              <br />
              <strong>🧮 طريقة حساب الارباح للمستثمر:</strong> مبلغ المساهمة × معدل الربح اليومي × عدد الايام حتى الآن
              <br />
              • <strong>هام:</strong> يتم احتساب الأرباح لكل مساهم بدءًا من تاريخ مساهمته الفعلي
              <br />
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
                        إجمالي الربح اليومي
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatAmount(distributions.summary.totalDailyProfit, financialYear.currency)}
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
                        متوسط الربح اليومي
                      </Typography>
                      <Typography variant="h5" component="div">
                        {formatAmount(distributions.summary.averageDailyProfit, financialYear.currency)}
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
                        {(distributions.summary.dailyProfitRate||0).toFixed(5)}%
                      </Typography>
                    </Box>
                    <CalendarIcon color="secondary" sx={{ fontSize: 40 }} />
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
                    الأيام حتى الآن
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    {distributions.summary.daysSoFar||0} {distributions.summary.daysSoFar===1 ? 'يوم' : 'ايام'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                    الأيام المتبقية
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    {Math.max((distributions.summary.totalDays || 0) - (distributions.summary.daysSoFar || 0), 0)} {Math.max((distributions.summary.totalDays || 0) - (distributions.summary.daysSoFar || 0), 0) === 1 ? 'يوم' : 'ايام'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
                     الفترة الزمنية
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: 'center' }}>
                    {formatDate1(financialYear.startDate)} - {formatDate1(financialYear.endDate)}
                    <br />
                    {`(${distributions.summary.totalDays||0} يوم)`}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
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
                    <StyledTableCell align="center">الربح اليومي</StyledTableCell>
                    <StyledTableCell align="center">الأيام حتى الآن</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ المساهمة</StyledTableCell>
                    <StyledTableCell align='center'>تاريخ التوزيع</StyledTableCell>
                    <StyledTableCell align="center">اخر تحديث</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {distributions.distributions.map((distribution) => (
                    <StyledTableRow key={distribution.id}>
                      <StyledTableCell align="center">{distribution.user.fullName}</StyledTableCell>
                      <StyledTableCell align="center">{formatAmount(distribution.amount, financialYear.currency)}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.percentage.toFixed(2)}%</StyledTableCell>
                      <StyledTableCell align="center">{formatAmount(distribution.dailyProfit, financialYear.currency)}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.daysSoFar}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.createdAt}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.distributedAt}</StyledTableCell>
                      <StyledTableCell align="center">{distribution.updatedAt}</StyledTableCell>
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