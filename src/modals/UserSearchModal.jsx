import React, { useState, useEffect } from 'react';
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
  Select,
  Autocomplete,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import Api from '../services/api';

const UserSearchModal = ({ open, onClose, onSearch }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsers();
  }, []);

  const getUsers = async () => {
    setLoading(true);
    try {
      const response = await Api.get('/api/users/1');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    email: null,
    role: ''
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
    
    // إرسال البريد الإلكتروني كقيمة نصية وليس ككائن
    if (filters.email && filters.email.email) {
      searchFilters.email = filters.email.email;
    }
    
    if (filters.role) {
      searchFilters.role = filters.role;
    }
    
    onSearch(searchFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      email: null,
      role: ''
    });
    onSearch({});
    onClose();
  };

  return (
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
          <SearchOutlined />
          <span>بحث متقدم في المستخدمين</span>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Autocomplete
            loading={loading}
            value={filters.email}
            options={users}
            getOptionLabel={(option) => option.email || ''}
            isOptionEqualToValue={(option, value) => option.email === value.email}
            onChange={(e, newValue) => handleFilterChange('email', newValue)}
            fullWidth
            sx={{
              '& .MuiAutocomplete-input': {
                textAlign: 'left',
                direction: 'ltr'
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="البريد الإلكتروني"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#28a745' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          
          <FormControl fullWidth>
            <InputLabel>الدور</InputLabel>
            <Select
              value={filters.role}
              label="الدور"
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <MenuItem value="">الكل</MenuItem>
              <MenuItem value="ADMIN">مدير</MenuItem>
              <MenuItem value="USER">مستخدم</MenuItem>
            </Select>
          </FormControl>
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
  );
};

export default UserSearchModal;