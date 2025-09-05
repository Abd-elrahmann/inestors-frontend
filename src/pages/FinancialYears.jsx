import React, { useState } from 'react';
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
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  LockOutlined,MoreOutlined,
  EyeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CheckOutlined,
  GiftOutlined
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
import { useQuery, useQueryClient } from 'react-query';
import debounce from 'lodash/debounce';

const FinancialYear = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [distributionModalOpen, setDistributionModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedYearForMenu, setSelectedYearForMenu] = useState(null);
  const { formatAmount } = useCurrencyManager();
  const { data: settings } = useSettings();
  const isMobile = useMediaQuery('(max-width: 480px)');
  const queryClient = useQueryClient();

  const debouncedSearch = debounce((value) => {
    setSearchTerm(value);
  }, 500);

  const { 
    data: yearsData, 
    isLoading,
    isFetching 
  } = useQuery(
    ['financialYears', page, rowsPerPage, searchTerm],
    () => Api.get('/api/financial-years', {
      params: {
        page,
        limit: rowsPerPage,
        search: searchTerm.trim()
      }
    }).then(res => res.data),
    {
      keepPreviousData: true,
      staleTime: 30000
    }
  );

  const { data: distributionsData } = useQuery(
    ['distributions', selectedYear?.id],
    () => Api.get(`/api/financial-years/${selectedYear?.id}/distributions`).then(res => res.data),
    {
      enabled: !!selectedYear?.id && distributionModalOpen,
      staleTime: 60000
    }
  );

  const handleCalculate = async (yearId) => {
    try {
      await Api.patch(`/api/financial-years/${yearId}/distribute`);
      toast.success('تم حساب الأرباح بنجاح');
      queryClient.invalidateQueries('financialYears');
    } catch (error) {
      console.error('Error calculating profits:', error);
      toast.error('فشل في حساب الأرباح');
    }
  };

  const handleViewDistributions = (year) => {
    setSelectedYear(year);
    setDistributionModalOpen(true);
  };

  const handleApprove = async (yearId) => {
    try {
      await Api.post(`/api/financial-years/${yearId}/approve`);
      toast.success('تم اعتماد السنة المالية بنجاح');
      queryClient.invalidateQueries('financialYears');
    } catch (error) {
      console.error('Error approving financial year:', error);
      toast.error('فشل في اعتماد السنة المالية');
    }
  };

  const handleCloseYear = async (yearId) => {
    try {
      await Api.post(`/api/financial-years/${yearId}/close`);
      toast.success('تم إغلاق السنة المالية بنجاح');
      queryClient.invalidateQueries('financialYears');
    } catch (error) {
      console.error('Error closing financial year:', error);
      toast.error('فشل في إغلاق السنة المالية');
    }
  };

  const handleDelete = async (yearId) => {
    try {
      await Api.delete(`/api/financial-years/${yearId}`);
      toast.success('تم حذف السنة المالية بنجاح');
      queryClient.invalidateQueries('financialYears');
    } catch (error) {
      console.error('Error deleting financial year:', error);
      toast.error('فشل في حذف السنة المالية');
    }
  };

  const getRolloverChip = (rolloverEnabled) => {
    return (
      <Chip 
        label={rolloverEnabled ? 'تم' : 'غير متدور'} 
        color={rolloverEnabled ? 'success' : 'default'} 
        size="small" 
      />
    );
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      draft: { 
        label: 'مسودة', 
        color: 'default',
        icon: <FileTextOutlined style={{marginRight: '5px'}} />
      },
      calculated: { 
        label: 'محسوبة', 
        color: 'info',
        icon: <BarChartOutlined style={{marginRight: '5px'}} />
      },
      approved: { 
        label: 'معتمدة', 
        color: 'primary',
        icon: <CheckOutlined style={{marginRight: '5px'}} />
      },
      distributed: { 
        label: 'موزعة', 
        color: 'success',
        icon: <GiftOutlined style={{marginRight: '5px'}} />
      },
      closed: { 
        label: 'مغلقة', 
        color: 'default',
        icon: <LockOutlined style={{marginRight: '5px'}} />
      }
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return (
      <Chip 
        icon={config.icon}
        label={config.label} 
        color={config.color} 
        size="small" 
      />
    );
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
              onChange={(e) => debouncedSearch(e.target.value)}
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
                <StyledTableCell align="center">التقدم الزمني</StyledTableCell>
                <StyledTableCell align="center">إجمالي الأرباح ({settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'})</StyledTableCell>
                <StyledTableCell align="center">معدل الربح اليومي</StyledTableCell>
                <StyledTableCell align="center">الحالة</StyledTableCell>
                <StyledTableCell align="center">تدوير الأرباح</StyledTableCell>
                <StyledTableCell align="center">الإجراءات</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(isLoading || isFetching) ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={10} align="center">
                    <Spin size="large" />
                  </StyledTableCell>
                </StyledTableRow>
              ) : !yearsData?.years?.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={10} align="center">
                    لا توجد سنوات مالية
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                yearsData.years.map((year) => (
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
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        {getRolloverChip(year.rolloverEnabled)}
                        {year.rolloverEnabled && (
                          <Typography variant="body" color="textSecondary">
                            {year.rolloverPercentage}%
                          </Typography>
                        )}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton
                        onClick={(event) => {
                          setAnchorEl(event.currentTarget);
                          setSelectedYearForMenu(year);
                        }}
                      >
                        <MoreOutlined />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={yearsData?.totalPages || 0}
            page={page - 1}
            onPageChange={(e, newPage) => setPage(newPage + 1)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value))}
            rowsPerPageOptions={[5, 10, 20]}
            labelRowsPerPage="عدد الصفوف في الصفحة"
          />
        </TableContainer>

        <Menu
          style={{fontSize: '14px'}}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {selectedYearForMenu?.status === 'draft' && (
            <MenuItem onClick={() => {
              handleCalculate(selectedYearForMenu.id);
              setAnchorEl(null);
            }}>
              <CalculatorOutlined style={{marginLeft: 8,color:'green'}} />
              حساب الأرباح
            </MenuItem>
          )}

          {['calculated', 'approved', 'distributed'].includes(selectedYearForMenu?.status) && (
            <MenuItem onClick={() => {
              handleViewDistributions(selectedYearForMenu);
              setAnchorEl(null);
            }}>
              <EyeOutlined style={{marginLeft: 8,color:'blue'}} />
              عرض التوزيعات
            </MenuItem>
          )}

          {selectedYearForMenu?.status === 'calculated' && (
            <MenuItem onClick={() => {
              handleApprove(selectedYearForMenu.id);
              setAnchorEl(null);
            }}>
              <CheckCircleOutlined style={{marginLeft: 8,color:'green'}} />
              موافقة على التوزيعات
            </MenuItem>
          )}

          {selectedYearForMenu?.status === 'approved' && (
            <MenuItem onClick={() => {
              handleCloseYear(selectedYearForMenu.id);
              setAnchorEl(null);
            }}>
              <LockOutlined style={{marginLeft: 8,color:'red'}} />
              إغلاق السنة المالية
            </MenuItem>
          )}

          {['draft', 'calculated', 'approved', 'distributed'].includes(selectedYearForMenu?.status) && (
            <MenuItem onClick={() => {
              handleDelete(selectedYearForMenu.id);
              setAnchorEl(null);
            }}>
              <DeleteOutlined style={{marginLeft: 8,color:'red'}} />
              حذف السنة المالية
            </MenuItem>
          )}

          {selectedYearForMenu?.status === 'closed' && (
            <MenuItem onClick={() => {
              handleDelete(selectedYearForMenu.id);
              setAnchorEl(null);
            }}>
              <DeleteOutlined style={{marginLeft: 8,color:'red'}} />
              حذف السنة المالية
            </MenuItem>
          )}
        </Menu>

        <AddFinancialYearModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setAddModalOpen(false);
            queryClient.invalidateQueries('financialYears');
          }}
        />

        <ProfitDistributionsModal
          open={distributionModalOpen}
          onClose={() => {
            setDistributionModalOpen(false);
            setSelectedYear(null);
          }}
          financialYear={selectedYear}
          distributions={distributionsData}
        />
      </Box>
    </>
  );
};

export default FinancialYear;