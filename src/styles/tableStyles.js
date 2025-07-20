export const tableConstants = {
 
  rowHeight: 65, 
  headerHeight: 70, 
  fontSize: '13px', 
  headerFontSize: '15px', 
  cellPadding: '16px 12px', 
  
  
  primaryColor: '#28a745',
  secondaryColor: '#007bff',
  errorColor: '#dc3545',
  warningColor: '#ffc107',
  successBg: '#d4edda',
  errorBg: '#f8d7da',
  successText: '#155724',
  errorText: '#721c24',
  borderColor: '#e0e0e0',
  hoverBg: '#d4edda',
  
  
  tableGap: 1,
  buttonPadding: '6px 12px',
  statusPadding: '6px 12px',
  
  
  boldWeight: 600,
  normalWeight: 500
};


export const getDataGridStyles = () => ({
  direction: 'rtl',
  fontFamily: 'Cairo',
  fontSize: tableConstants.fontSize,
  width: '100%',
  height: '100%',
  minHeight: 0,
  
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: tableConstants.primaryColor,
    color: 'white',
    fontWeight: tableConstants.boldWeight,
    fontSize: tableConstants.headerFontSize,
    height: `${tableConstants.headerHeight}px !important`,
    minHeight: `${tableConstants.headerHeight}px !important`,
    borderRadius: '8px 8px 0 0'
  },
  
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: tableConstants.boldWeight,
    textAlign: 'center',
    fontSize: tableConstants.headerFontSize,
    lineHeight: '1.7',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  '& .MuiDataGrid-row': {
    '&:nth-of-type(even)': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)'
    },
    '&:hover': {
      backgroundColor: `${tableConstants.hoverBg} !important`
    }
  },
  
  '& .MuiDataGrid-columnHeader': {
    padding: '0 12px', 
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '1px solid rgba(255, 255, 255, 0.3)',
    '&:focus, &:focus-within': {
      outline: 'none'
    }
  },
  
  '& .MuiDataGrid-columnSeparator': {
    display: 'none'
  },
  
  '& .MuiDataGrid-virtualScroller': {
    direction: 'rtl',
    overflow: 'auto !important'
  },
  
  '& .MuiDataGrid-main': {
    borderRadius: '8px',
    overflow: 'hidden', 
    border: `2px solid ${tableConstants.primaryColor}`
  },
  
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: '#f8f9fa',
    borderTop: `2px solid ${tableConstants.primaryColor}`,
    direction: 'ltr',
    justifyContent: 'center'
  },
  
  '& .MuiTablePagination-root': {
    direction: 'ltr',
    fontSize: tableConstants.fontSize,
    color: tableConstants.primaryColor,
    fontWeight: tableConstants.normalWeight
  },
  
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(2px)'
  }
});


export const getCurrencyCell = () => ({
  fontWeight: tableConstants.boldWeight,
  color: tableConstants.primaryColor,
  fontSize: tableConstants.fontSize
});

export const getPercentageCell = () => ({
  fontWeight: tableConstants.boldWeight,
  color: tableConstants.secondaryColor,
  fontSize: tableConstants.fontSize
});

export const getStatusCell = (status, activeText = 'نشط') => {
  const isActive = status === activeText;
  return {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: tableConstants.normalWeight,
    backgroundColor: isActive ? tableConstants.successBg : tableConstants.errorBg,
    color: isActive ? tableConstants.successText : tableConstants.errorText,
    minWidth: 'fit-content',
    whiteSpace: 'nowrap'
  };
};


export const getColumnDefaults = () => ({
  headerAlign: 'center',
  align: 'center',
  sortable: false,
  filterable: false
});


export const columnWidths = {
  small: 120, 
  medium: 160, 
  large: 200, 
  extraLarge: 240, 
  currency: 180, 
  status: 140, 
  actions: 180, 
  investorName: 220, 
  phone: 180, 
  email: 220, 
  transactionType: 220, 
  amount: 220, 
  date: 200, 
  profitPercentage: 160, 
  period: 200 
};


export const getResponsiveColumnWidths = (containerWidth, columnCount) => {
  const availableWidth = containerWidth - 100; 
  const averageWidth = Math.floor(availableWidth / columnCount);
  
  return {
    small: Math.max(80, Math.min(120, averageWidth * 0.8)),
    medium: Math.max(100, Math.min(150, averageWidth * 0.9)),
    large: Math.max(120, Math.min(180, averageWidth)),
    extraLarge: Math.max(140, Math.min(200, averageWidth * 1.1)),
    currency: Math.max(100, Math.min(140, averageWidth * 0.85)),
    status: Math.max(80, Math.min(110, averageWidth * 0.7)),
    actions: Math.max(100, Math.min(140, averageWidth * 0.85))
  };
}; 