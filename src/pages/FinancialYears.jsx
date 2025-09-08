import React, { useState, useEffect } from 'react';
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
  MoreOutlined,
  EyeOutlined,
  BarChartOutlined,
  CheckOutlined,
  GiftOutlined,
  FilterOutlined,
  EditOutlined,
  ReloadOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { Spin } from 'antd';
import Api from '../services/api';
import {toast} from 'react-toastify';
import AddFinancialYearModal from '../modals/AddFinancialYearModal';
import ProfitDistributionsModal from '../modals/ProfitDistributionsModal';
import FinancialSearchModal from '../modals/FinancialSearchModal';
import EditRolloverModal from '../modals/EditRolloverModal';
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [editRolloverModalOpen, setEditRolloverModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedYearForMenu, setSelectedYearForMenu] = useState(null);
  const [filters, setFilters] = useState({});
  const { currentCurrency, convertAmount } = useCurrencyManager();
  // eslint-disable-next-line no-unused-vars
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
    ['financialYears', page, rowsPerPage, searchTerm, filters, currentCurrency],
    () => Api.get(`/api/financial-years/${page}`, {
      params: {
        limit: rowsPerPage,
        search: searchTerm.trim(),
        ...filters
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

  useEffect(() => {
    queryClient.invalidateQueries('financialYears');
  }, [currentCurrency, queryClient]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setSearchModalOpen(false);
  };

  const handleResetFilters = () => {
    setFilters({});
  };


  const handleViewDistributions = (year) => {
    setSelectedYear(year);
    setDistributionModalOpen(true);
  };

  const handleApprove = async (yearId) => {
    try {
      await Api.patch(`/api/financial-years/${yearId}/approve`);
      toast.success('تم اعتماد السنة المالية بنجاح');
      queryClient.invalidateQueries('financialYears');
    } catch (error) {
      console.error('Error approving financial year:', error);
      toast.error('فشل في اعتماد السنة المالية');
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

  const handleEditRollover = (year) => {
    setSelectedYear(year);
    setEditRolloverModalOpen(true);
  };

  const getRolloverChip = (rolloverEnabled, rolloverPercentage) => {
    if (!rolloverEnabled) {
      return <Chip label="غير مفعل" color="default" size="small" />;
    }
    return (
      <Chip 
        label={`مفعل (${rolloverPercentage}%)`}
        color="success"
        size="small"
      />
    );
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      calculated: { 
        label: 'محسوبة', 
        color: 'info',
        icon: <BarChartOutlined style={{marginRight: '5px'}} />
      },
      distributed: { 
        label: 'موزعة', 
        color: 'success',
        icon: <GiftOutlined style={{marginRight: '5px'}} />
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
            <PlusOutlined style={{ marginLeft: 8 }} />
            إضافة سنة مالية
          </Fab>

          <Box sx={{ 
            width: isMobile ? '100%' : '250px', 
            display: 'flex', 
            justifyContent: isMobile ? 'center' : 'end',
            alignItems: 'center',
            gap: 1
          }}>
            <InputBase
              placeholder="بحث عن سنة مالية"
              startAdornment={<SearchOutlined style={{marginLeft: '10px', marginRight: '10px'}} />}
              sx={{
                width: isMobile ? '80%' : '250px',
                marginLeft: isMobile ? 0 : '5px', 
                borderRadius: '4px',
                fontSize: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
            <IconButton onClick={() => setSearchModalOpen(true)}>
              <FilterOutlined style={{color: Object.keys(filters).length > 0 ? 'green' : 'inherit'}} />
            </IconButton>
            {Object.keys(filters).length > 0 && (
              <IconButton onClick={handleResetFilters}>
                <ReloadOutlined style={{color: 'red'}} />
              </IconButton>
            )}
          </Box>
        </Stack>

        <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell align="center">المسلسل</StyledTableCell>
                <StyledTableCell align="center">السنة</StyledTableCell>
                <StyledTableCell align="center">اسم الفترة</StyledTableCell>
                <StyledTableCell align="center">الفترة الزمنية</StyledTableCell>
                <StyledTableCell align="center">إجمالي الأرباح ({currentCurrency === 'USD' ? '$' : 'د.ع'})</StyledTableCell>
                <StyledTableCell align="center">الحالة</StyledTableCell>
                <StyledTableCell align="center">حالة التدوير</StyledTableCell>
                <StyledTableCell align="center">الإجراءات</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(isLoading || isFetching) ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={8} align="center">
                    <Spin size="large" />
                  </StyledTableCell>
                </StyledTableRow>
              ) : !yearsData?.years?.length ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={8} align="center">
                    لا توجد سنوات مالية
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                yearsData.years.map((year) => (
                  <StyledTableRow key={year.id}>
                    <StyledTableCell align="center">{year.id}</StyledTableCell>
                    <StyledTableCell align="center">{year.year}</StyledTableCell>
                    <StyledTableCell align="center">{year.periodName || 'غير محدد'}</StyledTableCell>
                    <StyledTableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <span>{formatDate(year.startDate)}</span>
                        <span>-</span>
                        <span>{formatDate(year.endDate)}</span>
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      {convertAmount(year.totalProfit, 'IQD', currentCurrency).toLocaleString('en-US', {
                        minimumFractionDigits:0,
                        maximumFractionDigits:0
                      })} {currentCurrency === 'USD' ? '$' : 'د.ع'}
                    </StyledTableCell>
                    <StyledTableCell align="center">{getStatusChip(year.status)}</StyledTableCell>
                    <StyledTableCell align="center">
                      {getRolloverChip(year.rolloverEnabled, year.rolloverPercentage)}
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
          {selectedYearForMenu?.status === 'calculated' && (
            <MenuItem onClick={() => {
              handleEditRollover(selectedYearForMenu);
              setAnchorEl(null);
            }}>
              <EditOutlined style={{marginLeft: 8, color: 'orange'}} />
              تعديل السنة المالية
            </MenuItem>
          )}

          {['calculated', 'distributed'].includes(selectedYearForMenu?.status) && (
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

          {['calculated', 'distributed'].includes(selectedYearForMenu?.status) && (
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
            queryClient.invalidateQueries('financialYears');
          }}
          financialYear={selectedYear}
          mode={selectedYear ? 'edit' : 'add'}
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

        <FinancialSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={filters}
        />

        <EditRolloverModal
          open={editRolloverModalOpen}
          onClose={() => {
            setEditRolloverModalOpen(false);
            setSelectedYear(null);
          }}
          financialYear={selectedYear}
          onSuccess={() => {
            queryClient.invalidateQueries('financialYears');
          }}
        />
      </Box>
    </>
  );
};

export default FinancialYear;