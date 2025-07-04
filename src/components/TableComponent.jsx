import React, { useState, useMemo, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import { MdSearch as Search, MdAdd as Add, MdEdit as Edit, MdDelete as Delete } from 'react-icons/md';
import { 
  getDataGridStyles, 
  getColumnDefaults 
} from '../styles/tableStyles';
import { createDebouncedSearch } from '../utils/performanceOptimization';

const TableComponent = ({ 
  title, 
  data, 
  columns, 
  onAdd, 
  onEdit,
  onDelete,
  addButtonText = "إضافة جديد",
  showAddButton = true,
  searchPlaceholder = "البحث...",
  readOnly = false,
  showActions = true,
  getRowClassName
}) => {
  const [searchText, setSearchText] = useState('');

  // 🚀 تحسين حساب دور المستخدم مع التخزين المؤقت
  const userRole = useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.role || 'user';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return 'user';
  }, []);

  const isAdmin = userRole === 'admin';

  // ⚡ تحسين البحث مع debounce
  const debouncedSearch = useMemo(
    () => createDebouncedSearch(() => {
      // البحث يتم في الذاكرة فقط، لا حاجة للتحديث
    }, 300),
    []
  );

  // 🎯 تحسين فلترة البيانات
  const filteredData = useMemo(() => {
    if (!searchText) return data;
    
    const searchLower = searchText.toLowerCase();
    return data.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchLower);
      });
    });
  }, [data, searchText]);

  // 📱 تحسين معالج البحث
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchText(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const columnsWithActions = React.useMemo(() => {
    const baseColumns = columns.map(col => ({
      ...getColumnDefaults(),
      ...col
    }));

    if (isAdmin && showActions && (onEdit || onDelete) && !readOnly) {
      const actionColumn = {
        field: 'actions',
        headerName: 'الإجراءات',
        width: 150,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {onEdit && (
              <Tooltip title="تعديل" arrow>
                <IconButton
                  size="medium"
                  onClick={() => onEdit(params.row)}
                  sx={{
                    color: '#28a745',
                    padding: '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(40, 167, 69, 0.1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Edit fontSize="large" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="حذف" arrow>
                <IconButton
                  size="medium"
                  onClick={() => onDelete(params.row)}
                  sx={{
                    color: '#dc3545',
                    padding: '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Delete fontSize="large" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      };

      return [...baseColumns, actionColumn];
    }

    return baseColumns;
  }, [columns, isAdmin, showActions, onEdit, onDelete, readOnly]);

  const shouldShowAddButton = showAddButton && onAdd && isAdmin && !readOnly;

  return (
    <Box className="table-container" sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Table Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#28a745',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px 8px 0 0',
        minHeight: '64px',
        flexShrink: 0
      }}>
        <Typography variant="h5" sx={{
          fontWeight: 'bold',
          fontSize: '1.25rem',
          color: 'white',
          fontFamily: 'Cairo'
        }}>
          {title}
        </Typography>
        
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={handleSearchChange}
            sx={{
              minWidth: '250px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                textAlign: 'right',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1
                }
              }
            }}
            InputProps={{
              startAdornment: <Search style={{ marginRight: 8, color: 'rgba(255, 255, 255, 0.7)' }} />
            }}
          />
          
          {shouldShowAddButton && (
            <Button
              variant="contained"
              onClick={onAdd}
              startIcon={<Add />}
              sx={{
                bgcolor: 'white',
                color: '#28a745',
                fontFamily: 'Cairo',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {addButtonText}
            </Button>
          )}
        </Box>
      </Box>

      {/* Data Grid */}
      <Box sx={{ 
        height: 'calc(100% - 64px)', 
        width: '100%',
        flex: 1,
        overflow: 'auto', // Enable scrolling
        position: 'relative',
        backgroundColor: 'white'
      }}>
        <DataGrid
          rows={filteredData}
          columns={columnsWithActions}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 20 } // ✅ صفحات أصغر لسرعة أكبر
            }
          }}
          pageSizeOptions={[10, 20, 50]} // ✅ تقليل الخيارات
          disableSelectionOnClick
          rowHeight={60} // ✅ صفوف أصغر
          headerHeight={50} // ✅ رأس أصغر
          disableColumnResize={true}
          autoHeight={false}
          checkboxSelection={false}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          disableColumnMenu={false}
          disableColumnFilter={false}
          disableColumnSelector={false}
          disableDensitySelector={false}
          sortingOrder={['asc', 'desc']}
          disableMultipleColumnsSorting={false}
          disableVirtualization={false} // ✅ تفعيل الافتراضية لسرعة أكبر
          getRowClassName={getRowClassName}
          sx={{
            ...getDataGridStyles(),
            border: 'none',
            '& .MuiDataGrid-main': {
              border: 'none'
            },
            '& .MuiDataGrid-cell': {
              borderRight: '1px solid #e0e0e0',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
              lineHeight: '1.2'
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: 'rgba(40, 167, 69, 0.08) !important'
              }
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#28a745',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                width: '100%'
              }
            }
          }}
          localeText={{
            toolbarDensityLabel: 'كثافة',
            toolbarDensityCompact: 'مضغوط',
            toolbarDensityStandard: 'عادي',
            toolbarDensityComfortable: 'مريح',
            
            columnsPanelTextFieldLabel: 'البحث عن عمود',
            columnsPanelTextFieldPlaceholder: 'عنوان العمود',
            columnsPanelDragIconLabel: 'إعادة ترتيب العمود',
            columnsPanelShowAllButton: 'إظهار الكل',
            columnsPanelHideAllButton: 'إخفاء الكل',
            
            filterPanelAddFilter: 'إضافة فلتر',
            filterPanelDeleteIconLabel: 'حذف',
            filterPanelOperators: 'العوامل',
            filterPanelOperatorAnd: 'و',
            filterPanelOperatorOr: 'أو',
            filterPanelColumns: 'الأعمدة',
            filterPanelInputLabel: 'القيمة',
            filterPanelInputPlaceholder: 'قيمة الفلتر',
            
            MuiTablePagination: {
              labelRowsPerPage: 'الصفوف في الصفحة:',
              labelDisplayedRows: ({ from, to, count }) =>
                `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`,
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default TableComponent; 