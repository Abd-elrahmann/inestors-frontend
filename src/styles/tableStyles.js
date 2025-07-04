// Shared styles for all table components
export const tableConstants = {
  // Dimensions
  rowHeight: 65, // Increased row height
  headerHeight: 70, // Increased header height
  fontSize: '13px', // Increased font size
  headerFontSize: '15px', // Increased header font size
  cellPadding: '16px 24px', // Increased padding
  
  
  // Colors
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
  
  // Spacing
  tableGap: 2,
  buttonPadding: '6px 12px',
  statusPadding: '6px 12px',
  
  // Font weights
  boldWeight: 600,
  normalWeight: 500
};

// Common DataGrid styles
export const getDataGridStyles = () => ({
  direction: 'rtl',
  fontFamily: 'Cairo',
  fontSize: tableConstants.fontSize,
  width: '100%',
  height: '100%',
  minHeight: 0,
  minWidth: 'max-content', // Allow horizontal scrolling
  
  // Header styles
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: tableConstants.primaryColor,
    color: 'white',
    fontWeight: tableConstants.boldWeight,
    fontSize: tableConstants.headerFontSize,
    height: `${tableConstants.headerHeight}px !important`,
    minHeight: `${tableConstants.headerHeight}px !important`,
    borderRadius: '8px 8px 0 0',
    minWidth: 'max-content' // Allow horizontal scrolling
  },
  
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: tableConstants.boldWeight,
    textAlign: 'center',
    fontSize: tableConstants.headerFontSize,
    lineHeight: '1.7',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    whiteSpace: 'nowrap', // Keep header text on one line
    overflow: 'visible', // Show full header text
    minWidth: 'max-content' // Allow content to determine width

  },
  
  // Cell styles
  '& .MuiDataGrid-cell': {
    textAlign: 'center',
    borderBottom: `1px solid ${tableConstants.borderColor}`,
    borderRight: `1px solid ${tableConstants.borderColor}`,
    fontSize: tableConstants.fontSize,
    height: `${tableConstants.rowHeight}px !important`,
    lineHeight: '1.5',
    padding: tableConstants.cellPadding, // Use increased padding
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible', // Show full content
    whiteSpace: 'nowrap', // Keep content on one line
    textOverflow: 'unset', // Don't truncate text
    minWidth: 'max-content' // Allow content to determine width
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
    padding: '0 24px', // Increased padding
    justifyContent: 'center',
    alignItems: 'center',
    borderRight: '1px solid rgba(255, 255, 255, 0.3)',
    minWidth: 'max-content', // Allow content to determine width
    '&:focus, &:focus-within': {
      outline: 'none'
    }
  },
  
  '& .MuiDataGrid-columnSeparator': {
    display: 'none'
  },
  
  '& .MuiDataGrid-virtualScroller': {
    direction: 'rtl',
    overflow: 'auto !important',
    minWidth: 'max-content' // Allow horizontal scrolling
  },
  
  '& .MuiDataGrid-main': {
    borderRadius: '8px',
    overflow: 'auto', // Enable scrolling
    border: `2px solid ${tableConstants.primaryColor}`,
    minWidth: 'max-content' // Allow horizontal scrolling
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

// Common cell renderers
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

// Common column configurations
export const getColumnDefaults = () => ({
  headerAlign: 'center',
  align: 'center',
  sortable: false,
  filterable: false
});

// Responsive column widths that auto-fit to container
export const columnWidths = {
  small: 120, // Increased
  medium: 160, // Increased
  large: 200, // Increased
  extraLarge: 240, // Increased
  currency: 180, // Increased
  status: 140, // Increased
  actions: 180, // Increased
  investorName: 220, // Increased
  phone: 180, // Increased
  email: 220, // Increased
  transactionType: 220, // Increased
  amount: 220, // Increased
  date: 200, // Increased
  description: 250, // Increased
  profitPercentage: 160, // Increased
  period: 200 // Increased
};

// Function to calculate responsive column widths
export const getResponsiveColumnWidths = (containerWidth, columnCount) => {
  const availableWidth = containerWidth - 50; // Account for scrollbar and padding
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