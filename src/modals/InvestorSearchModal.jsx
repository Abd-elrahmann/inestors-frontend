import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
const InvestorSearchModal = ({ open, onClose, onSearch }) => {
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    startDate: null,
    endDate: null,
    minShare: '',
    maxShare: ''
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    const formattedFilters = {
      ...filters,
      startDate: filters.startDate ? filters.startDate.format('YYYY-MM-DD') : '',
      endDate: filters.endDate ? filters.endDate.format('YYYY-MM-DD') : '',
      minShare: filters.minShare ? filters.minShare : '',
      maxShare: filters.maxShare ? filters.maxShare : ''
    };
    onSearch(formattedFilters);
    onClose();
    setFilters({
      minAmount: '',
      maxAmount: '',
      startDate: null,
      endDate: null,
      minShare: '',
      maxShare: ''
    });
  };

  const handleReset = () => {
    setFilters({
      minAmount: '',
      maxAmount: '',
      startDate: null,
      endDate: null,
      minShare: '',
      maxShare: ''
    });
    onSearch({});
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>بحث</span>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="الحد الأدنى لرأس المال"
              type="number"
              value={filters.minAmount || ''}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              fullWidth
            />
            
            <TextField
              label="الحد الأقصى لرأس المال"
              type="number"
              value={filters.maxAmount || ''}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              fullWidth
            />

            <TextField
              label="الحد الأدنى لنسبة المساهمة"
              type="number"
              value={filters.minShare || ''}
              onChange={(e) => handleFilterChange('minShare', e.target.value)}
              fullWidth
            />

            <TextField
              label="الحد الأقصى لنسبة المساهمة"
              type="number"
              value={filters.maxShare || ''}
              onChange={(e) => handleFilterChange('maxShare', e.target.value)}
              fullWidth
            />

            <DatePicker
              label="من تاريخ"
              value={filters.startDate ? dayjs(filters.startDate) : null}
              onChange={(date) => handleFilterChange('startDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />

            <DatePicker
              label="إلى تاريخ"
              value={filters.endDate ? dayjs(filters.endDate) : null}
              onChange={(date) => handleFilterChange('endDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, display: 'flex', flexDirection: 'row',justifyContent:'center' }}>
          <Button 
            onClick={handleSearch} 
            variant="contained" 
            color="primary" 
            startIcon={<SearchOutlined style={{marginLeft: '10px'}} />}
          >
            بحث
          </Button>
          <Button 
            onClick={handleReset} 
            variant="outlined" 
            color="secondary" 
            startIcon={<ReloadOutlined style={{marginLeft: '10px'}} />}
          >
            إعادة تعيين
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default InvestorSearchModal;