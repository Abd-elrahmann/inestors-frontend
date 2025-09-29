import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Stack,
  IconButton,
  InputAdornment,
  Typography,
  Autocomplete
} from '@mui/material';
import { SearchOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const FinancialSearchModal = ({ open, onClose, onApplyFilters, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    year: initialFilters.year || '',
    status: initialFilters.status || '',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || ''
  });

  const statusOptions = [
    { value: 'PENDING', label: 'في انتظار الموافقة' },
    { value: 'DISTRIBUTED', label: 'موزع' },
  ];
  const years = Array.from({length: 16}, (_, i) => 2025 + i);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      year: '',
      status: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          width: '400px'
        }
      }}
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
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Autocomplete
            sx={{ width: '300px', mx: 'auto' }}
            label="السنة"
            options={years}
            value={filters.year}
            onChange={(e, newValue) => handleFilterChange('year', newValue)}
            placeholder="أدخل السنة المالية"
            renderInput={(params) => (
                <TextField
                  {...params}
                  label="السنة"
                  name="year"
                />
              )}
            />


          <FormControl sx={{ width: '300px', mx: 'auto' }}>
            <InputLabel>الحالة</InputLabel>
            <Select
              value={filters.status}
              label="الحالة"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12} sm={5}>
              <TextField
                sx={{ width: '140px' }}
                label="من تاريخ"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={5}>
              <TextField
                sx={{ width: '140px' }}
                label="إلى تاريخ"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {hasActiveFilters && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                الفلاتر النشطة:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {filters.year && (
                  <Chip
                    label={`السنة: ${filters.year}`}
                    onDelete={() => handleFilterChange('year', '')}
                    size="small"
                  />
                )}
                {filters.status && (
                  <Chip
                    label={`الحالة: ${statusOptions.find(opt => opt.value === filters.status)?.label}`}
                    onDelete={() => handleFilterChange('status', '')}
                    size="small"
                  />
                )}
                {filters.startDate && (
                  <Chip
                    label={`من: ${dayjs(filters.startDate).format('DD/MM/YYYY')}`}
                    onDelete={() => handleFilterChange('startDate', '')}
                    size="small"
                  />
                )}
                {filters.endDate && (
                  <Chip
                    label={`إلى: ${dayjs(filters.endDate).format('DD/MM/YYYY')}`}
                    onDelete={() => handleFilterChange('endDate', '')}
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
        <Button onClick={handleClear} variant="outlined" color="secondary" startIcon={<ReloadOutlined style={{marginLeft: '10px'}} />}>
          إعادة تعيين
        </Button>
        <Button onClick={handleApply} variant="contained" color="primary" startIcon={<SearchOutlined style={{marginLeft: '10px'}} />}>
          بحث
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialSearchModal;