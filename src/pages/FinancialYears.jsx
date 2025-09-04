import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Stack,
  Chip,
  InputBase,
  Fab,
  LinearProgress,
  Typography,
  ButtonGroup,
  Button,
  useMediaQuery
} from '@mui/material';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  BellOutlined,
  PlayCircleOutlined,StopOutlined,
  LockOutlined,MoreOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Spin } from 'antd';
import Api from '../services/api';
import {toast} from 'react-toastify';
import AddFinancialYearModal from '../modals/AddFinancialYearModal';
import ProfitDistributionsModal from '../modals/ProfitDistributionsModal';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../hooks/useSettings';
import dayjs from 'dayjs';
const FinancialYear = () => {
  const [financialYears, setFinancialYears] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [distributionModalOpen, setDistributionModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const { formatAmount } = useCurrencyManager();
  const { data: settings } = useSettings();
  const [allDistributions, setAllDistributions] = useState({});
  const isMobile = useMediaQuery('(max-width: 480px)');
  useEffect(() => {
    fetchFinancialYears();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchTerm]);

  const fetchFinancialYears = async () => {
    try {
      setLoading(true);
      const response = await Api.get('/api/financial-years', {
        params: {
          page,
          limit: rowsPerPage,
          search: searchTerm.trim()
        }
      });
  
      if (response?.data?.years) {
        setFinancialYears(response.data.years);
        setTotalPages(response.data.totalPages || 0);
      } else {
        toast.error('خطأ في تنسيق البيانات المستلمة');
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
      toast.error('فشل في تحميل السنوات المالية');
    } finally {
      setLoading(false);
    }
  };
  const handleCalculate = async (yearId) => {
    try {
      await Api.patch(`/api/financial-years/${yearId}/distribute`);
      toast.success('تم حساب الأرباح بنجاح');
      fetchFinancialYears();
    } catch (error) {
      console.error('Error calculating profits:', error);
      toast.error('فشل في حساب الأرباح');
    }
  };

  const handleViewDistributions = async (yearId) => {
    const year = financialYears.find(y => y.id === yearId);
    setSelectedYear(year);
  
    if (allDistributions[yearId]) {
      setDistributions(allDistributions[yearId]);
      setDistributionModalOpen(true);
      return;
    }
  
    try {
      setLoading(true);
      const distRes = await Api.get(`/api/financial-years/${yearId}/distributions`);
      const distributions = distRes.data || [];
  
      setAllDistributions(prev => ({
        ...prev,
        [yearId]: distributions
      }));
  
      setDistributions(distributions);
      setDistributionModalOpen(true);
    } catch (error) {
      console.error('Error fetching distributions:', error);
      toast.error('فشل في تحميل التوزيعات');
    } finally {
      setLoading(false);
    }
  };
  const handleApprove = async (yearId) => {
    try {
      await Api.post(`/api/financial-years/${yearId}/approve`);
      toast.success('تم اعتماد السنة المالية بنجاح');
      fetchFinancialYears();
    } catch (error) {
      console.error('Error approving financial year:', error);
      toast.error('فشل في اعتماد السنة المالية');
    }
  };

  const handleCloseYear = async (yearId) => {
    try {
      await Api.post(`/api/financial-years/${yearId}/close`);
      toast.success('تم إغلاق السنة المالية بنجاح');
      fetchFinancialYears();
    } catch (error) {
      console.error('Error closing financial year:', error);
      toast.error('فشل في إغلاق السنة المالية');
    }
  };

  const handleDelete = async (yearId) => {
    try {
      await Api.delete(`/api/financial-years/${yearId}`);
      toast.success('تم حذف السنة المالية بنجاح');
      fetchFinancialYears();
    } catch (error) {
      console.error('Error deleting financial year:', error);
      toast.error('فشل في حذف السنة المالية');
    }
  };

  const filteredFinancialYears = useMemo(() => {
    if (!Array.isArray(financialYears)) return [];
    return financialYears.filter(year => 
      year.periodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      year.year.toString().includes(searchTerm)
    );
  }, [financialYears, searchTerm]);

  const getStatusChip = (status) => {
    const statusConfig = {
      draft: { label: 'مسودة', color: 'default' },
      calculated: { label: 'محسوبة', color: 'info' },
      approved: { label: 'معتمدة', color: 'primary' },
      distributed: { label: 'موزعة', color: 'success' },
      closed: { label: 'مغلقة', color: 'default' }
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };  
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  const getDaysPassed = (startDate) => {
    const start = normalizeDate(startDate);
    const today = normalizeDate(new Date());
  
    const oneDay = 1000 * 60 * 60 * 24;
    const diff = today - start;
    return Math.max(Math.floor(diff / oneDay), 0);
  };
  
  const getDaysRemaining = (endDate) => {
    const end = normalizeDate(endDate);
    const today = normalizeDate(new Date());
  
    const oneDay = 1000 * 60 * 60 * 24;
    const diff = end - today;
    return Math.max(Math.floor(diff / oneDay), 0);
  };
  
  const getProgressPercentage = (startDate, endDate) => {
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    const today = normalizeDate(new Date());
  
    const oneDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.floor((end - start) / oneDay);
    const daysPassed = Math.floor((today - start) / oneDay);
  
    if (daysPassed <= 0) return 0;
    if (daysPassed >= totalDays) return 100;
    
    return Math.round((daysPassed / totalDays) * 100);
  };

  return (
    <>
      <Helmet>
        <title>السنوات المالية</title>
      </Helmet>
      
      <Box className="content-area">
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent={isMobile ? 'center' : "space-between"} alignItems="center" mb={3} mr={1} mt={2} spacing={2}>
          <Fab
            color="primary"
            variant="extended"
            onClick={() => setAddModalOpen(true)}
            sx={{
              borderRadius: '8px',
              fontWeight: 'bold',
              textTransform: 'none',
              height: '40px',
              width: isMobile ? '50%' : '180px',
            }}
          >
            <PlusOutlined style={{ marginRight: 8 }} />
            إضافة سنة مالية
          </Fab>

          <Box sx={{ 
            width: isMobile ? '100%' : '250px', 
            display: 'flex', 
            justifyContent: isMobile ? 'center' : 'end',
            alignItems: 'center'
          }}>
            <InputBase
              placeholder="بحث عن سنة مالية"
              startAdornment={<SearchOutlined style={{marginLeft: '10px', marginRight: '10px'}} />}
              sx={{
                width: isMobile ? '80%' : '250px',
                padding: '8px 15px',
                marginLeft: isMobile ? 0 : '5px', 
                borderRadius: '4px',
                fontSize: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
        </Stack>

        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">المسلسل</StyledTableCell>
                <StyledTableCell align="center">السنة</StyledTableCell>
                <StyledTableCell align="center">الفترة</StyledTableCell>
                <StyledTableCell align="center"> التقدم الزمني</StyledTableCell>
                <StyledTableCell align="center">إجمالي الأرباح ({settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'})</StyledTableCell>
                <StyledTableCell align="center">معدل الربح اليومي</StyledTableCell>
                <StyledTableCell align="center">الحالة</StyledTableCell>
                <StyledTableCell align="center">الإجراءات</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={9} align="center">
                    <Spin size="large" />
                  </StyledTableCell>
                </StyledTableRow>
              ) : !filteredFinancialYears.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={9} align="center">
                    لا توجد سنوات مالية
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                filteredFinancialYears.map((year) => (
                  <StyledTableRow key={year.id}>
                    <StyledTableCell align="center">{year.id}</StyledTableCell>
                    <StyledTableCell align="center">{year.year}</StyledTableCell>
                    <StyledTableCell align="center">{year.periodName}</StyledTableCell>
                    <StyledTableCell align="center">
                      <Box sx={{ width: '80%', margin: '0 auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <span>{formatDate(year.startDate)}</span>
                          <span>-</span>
                          <span>{formatDate(year.endDate)}</span>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <LinearProgress 
                            variant="determinate"
                            value={getProgressPercentage(year.startDate, year.endDate)}
                            sx={{ flexGrow: 1 }}
                          />
                          <Box sx={{ minWidth: 35 }}>
                            {`${getProgressPercentage(year.startDate, year.endDate)}%`}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                          <Typography variant="body2">
                            {`${getDaysPassed(year.startDate)} يوم مضى`}
                          </Typography>
                          <Typography variant="body2">
                            {`${Math.min(getDaysRemaining(year.endDate), Math.floor((new Date(year.endDate) - new Date(year.startDate)) / (1000 * 60 * 60 * 24)))} يوم متبقي`}
                          </Typography>
                        </Box>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell align="center">{formatAmount(year.totalProfit, settings?.defaultCurrency)}</StyledTableCell>
                    <StyledTableCell align="center">{year.dailyProfitRate ? `${(year.dailyProfitRate).toFixed(5)}%`+ ' لكل '+ settings?.defaultCurrency : '-'}</StyledTableCell>
                    <StyledTableCell align="center">{getStatusChip(year.status)}</StyledTableCell>
                    <StyledTableCell align="center">
                      <ButtonGroup justifyContent="center" sx={{gap: 2}}>
                        {year.status === 'draft' && (
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCalculate(year.id)}
                            title="حساب الأرباح"
                          >
                            <CalculatorOutlined />
                          </IconButton>
                        )}
                        
                        {['calculated', 'approved', 'distributed'].includes(year.status) && (
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleViewDistributions(year.id)}
                            title="عرض التوزيعات"
                          >
                            <EyeOutlined />
                          </IconButton>
                        )}

                        {year.status === 'calculated' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(year.id)}
                            title="موافقة على التوزيعات"
                          >
                            <CheckCircleOutlined />
                          </IconButton>
                        )}

                        {year.status === 'approved' && (
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleCloseYear(year.id)}
                            title="إغلاق السنة المالية"
                          >
                            <LockOutlined />
                          </IconButton>
                        )}

                        {year.status !== 'closed' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(year.id)}
                            title="حذف السنة المالية"
                          >
                            <DeleteOutlined />
                          </IconButton>
                        )}
                      </ButtonGroup>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalPages}
            page={page - 1}
            onPageChange={(e, newPage) => setPage(newPage + 1)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value))}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="عدد الصفوف في الصفحة"
          />
        </TableContainer>

        <AddFinancialYearModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setAddModalOpen(false);
            fetchFinancialYears();
          }}
        />

        <ProfitDistributionsModal
          open={distributionModalOpen}
          onClose={() => setDistributionModalOpen(false)}
          financialYear={selectedYear}
          distributions={distributions}
        />
      </Box>
    </>
  );
};

export default FinancialYear;