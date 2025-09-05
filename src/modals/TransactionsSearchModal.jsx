import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const TransactionsSearchModal = ({ open, onClose, onSearch }) => {
  const [filters, setFilters] = useState({
    type: '',
    minAmount: '',
    maxAmount: '',
    startDate: null,
    endDate: null
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    // إنشاء كائن فلترة صحيح مع إزالة الحقول الفارغة
    const searchFilters = {};
    
    if (filters.type) searchFilters.type = filters.type;
    if (filters.minAmount) searchFilters.minAmount = filters.minAmount;
    if (filters.maxAmount) searchFilters.maxAmount = filters.maxAmount;
    if (filters.startDate) searchFilters.startDate = filters.startDate.toISOString().split('T')[0];
    if (filters.endDate) searchFilters.endDate = filters.endDate.toISOString().split('T')[0];
    
    onSearch(searchFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      type: '',
      minAmount: '',
      maxAmount: '',
      startDate: null,
      endDate: null
    });
    onSearch({});
    onClose();
  };

  const transactionTypes = [
    { value: 'deposit', label: 'ايداع' },
    { value: 'withdrawal', label: 'سحب من مبلغ المساهمة' },
    { value: 'withdraw_profit', label: 'سحب أرباح' },
    { value: 'rollover_profit', label: 'تدوير أرباح' },
    { value: 'profit', label: 'أرباح' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchOutlined />
            <span>بحث متقدم في المعاملات</span>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>نوع المعاملة</InputLabel>
              <Select
                value={filters.type}
                label="نوع المعاملة"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                {transactionTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="الحد الأدنى للمبلغ"
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              fullWidth
            />
            
            <TextField
              label="الحد الأقصى للمبلغ"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              fullWidth
            />
            
            <DatePicker
              label="تاريخ البدء"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
            
            <DatePicker
              label="تاريخ الانتهاء"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
          <Button onClick={handleReset} variant="outlined" color="secondary" startIcon={<ReloadOutlined style={{marginLeft: '10px'}} />}>
            إعادة تعيين
          </Button>
          <Button onClick={handleSearch} variant="contained" color="primary" startIcon={<SearchOutlined style={{marginLeft: '10px'}} />}>
            بحث
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TransactionsSearchModal;