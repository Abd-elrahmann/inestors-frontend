import React from "react";
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
  Chip,
  Menu,
  MenuItem,
  TableSortLabel
} from "@mui/material";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  MoreOutlined,
  BarChartOutlined,
  GiftOutlined
} from "@ant-design/icons";
import { Spin } from "antd";
import { StyledTableCell, StyledTableRow } from "../../styles/TableLayout";
import dayjs from "dayjs";

const FinancialYearsTable = ({
  yearsData,
  isLoading,
  isFetching,
  orderBy,
  order,
  onRequestSort,
  settings,
  onViewDistributions,
  onEditFinancialYear,
  onApproveYear,
  onOpenDeleteModal,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  convertCurrency,
  anchorEl,
  selectedYearForMenu,
  onOpenMenu,
  onCloseMenu
}) => {
  const totalPages = yearsData?.totalPages || 0;
  const total = yearsData?.total || 0;
  const years = yearsData?.years || [];

  const createSortHandler = (property) => () => {
    onRequestSort(property);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      PENDING: { 
        label: 'في انتظار الموافقة', 
        color: 'info',
        icon: <BarChartOutlined style={{marginRight: '5px'}} />
      },
      DISTRIBUTED: { 
        label: 'موزع', 
        color: 'warning',
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
      <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">
                <TableSortLabel
                  active={orderBy === 'id'}
                  direction={orderBy === 'id' ? order : 'asc'}
                  onClick={createSortHandler('id')}
                  sx={{ color: 'white !important' }}
                >
                  ت
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center">
                <TableSortLabel
                  active={orderBy === 'year'}
                  direction={orderBy === 'year' ? order : 'asc'}
                  onClick={createSortHandler('year')}
                  sx={{ color: 'white !important' }}
                >
                  السنة
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center">
                <TableSortLabel
                  active={orderBy === 'periodName'}
                  direction={orderBy === 'periodName' ? order : 'asc'}
                  onClick={createSortHandler('periodName')}
                  sx={{ color: 'white !important' }}
                >
                  اسم الفترة
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center" sx={{ width: '160px' }}>
                <TableSortLabel
                  active={orderBy === 'startDate'}
                  direction={orderBy === 'startDate' ? order : 'asc'}
                  onClick={createSortHandler('startDate')}
                  sx={{ color: 'white !important' }}
                >
                  الفترة الزمنية
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center">
                <TableSortLabel
                  active={orderBy === 'totalProfit'}
                  direction={orderBy === 'totalProfit' ? order : 'asc'}
                  onClick={createSortHandler('totalProfit')}
                  sx={{ color: 'white !important' }}
                >
                  مبلغ التوزيع ({settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'})
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center" sx={{ width: '160px' }}>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={createSortHandler('status')}
                  sx={{ color: 'white !important' }}
                  >
                  الحالة
                </TableSortLabel>
              </StyledTableCell>
              <StyledTableCell align="center">الإجراءات</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(isLoading || isFetching) ? (
              <StyledTableRow>
                <StyledTableCell colSpan={7} align="center">
                  <Spin size="large" />
                </StyledTableCell>
              </StyledTableRow>
            ) : !years.length ? (
              <StyledTableRow>
                <StyledTableCell colSpan={7} align="center">
                  لا توجد سنوات مالية
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              years.map((year) => (
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
                    {convertCurrency(year.totalProfit, year.currency||'USD', settings?.defaultCurrency).toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })} {settings?.defaultCurrency === 'USD' ? '$' : 'د.ع'}
                  </StyledTableCell>
                  <StyledTableCell align="center">{getStatusChip(year.status)}</StyledTableCell>
                  <StyledTableCell align="center">
                    <IconButton
                      onClick={(event) => onOpenMenu(event, year)}
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
          count={total} 
          totalPages={totalPages}
          page={page - 1}
          onPageChange={(e, newPage) => onPageChange(newPage + 1)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
          rowsPerPageOptions={[5, 10, 20]}
          labelRowsPerPage="عدد الصفوف في الصفحة"
        />
      </TableContainer>

      <Menu
        style={{fontSize: '14px'}}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onCloseMenu}
      >
        {selectedYearForMenu?.status === 'PENDING' && (
          <MenuItem onClick={() => {
            onEditFinancialYear(selectedYearForMenu);
            onCloseMenu();
          }}>
            <EditOutlined style={{marginLeft: 8, color: 'orange'}} />
            تعديل السنة المالية
          </MenuItem>
        )}

        {['PENDING', 'DISTRIBUTED'].includes(selectedYearForMenu?.status) && (
          <MenuItem onClick={() => {
            onViewDistributions(selectedYearForMenu);
            onCloseMenu();
          }}>
            <EyeOutlined style={{marginLeft: 8,color:'blue'}} />
            عرض التوزيعات
          </MenuItem>
        )}
        {['PENDING'].includes(selectedYearForMenu?.status) && (
          <MenuItem onClick={() => {
            onApproveYear(selectedYearForMenu);
            onCloseMenu();
          }}>
            <CheckOutlined style={{marginLeft: 8,color:'green'}} />
              الموافقة علي التوزيع
          </MenuItem>
        )}
        {['PENDING', 'DISTRIBUTED'].includes(selectedYearForMenu?.status) && (
          <MenuItem onClick={() => {
            onOpenDeleteModal(selectedYearForMenu);
            onCloseMenu();
          }}>
            <DeleteOutlined style={{marginLeft: 8,color:'red'}} />
            حذف السنة المالية
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default FinancialYearsTable;