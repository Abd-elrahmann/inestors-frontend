import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Container, Autocomplete, Tabs, Tab, List, ListItem, ListItemText } from '@mui/material';
import moment from 'moment-timezone';
import Api from '../services/api';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';
import { Spin } from "antd";
import { SaveOutlined, RetweetOutlined} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Button from '@mui/material/Button';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

const Settings = () => {
  const queryClient = useQueryClient();
  const timezones = moment.tz.names();
  const [tabIndex, setTabIndex] = useState(0);
  const { updateSettings: updateCurrencySettings, refreshPage } = useCurrencyManager();

  const currencies = [
    { value: 'IQD', label: 'دينار عراقي (د.ع)' },
    { value: 'USD', label: 'دولار أمريكي ($)' }
  ];

  const [settings, setSettings] = useState({
    defaultCurrency: 'USD',
    USDtoIQD: 0,
    timezone: 'Asia/Baghdad'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await Api.get('/api/settings');
      return response.data;
    },
    staleTime: 30000,
    gcTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const { data: backupsData = { backups: [] }, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await Api.get('/api/backup/list');
      return response.data;
    },
    enabled: tabIndex === 2
  });

  const restoreMutation = useMutation({
    mutationFn: async (fileName) => {
      return await Api.post('/api/backup/restore', { fileName });
    },
    onSuccess: () => {
      toast.success('تم استعادة النسخة الاحتياطية بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء استعادة النسخة الاحتياطية');
    }
  });

  useEffect(() => {
    if (data) {
      setSettings({
        defaultCurrency: data.defaultCurrency,
        USDtoIQD: data.USDtoIQD || 0,
        timezone: data.timezone || 'Asia/Baghdad'
      });
    }
  }, [data]);

  const settingsMutation = useMutation({
    mutationFn: async (settingsToSave) => {
      return await Api.patch('/api/settings', settingsToSave);
    },
    onSuccess: async (response) => {
      if (response.data) {
        await updateCurrencySettings(settings);
        toast.success('تم حفظ الإعدادات بنجاح');
        refreshPage();
        queryClient.invalidateQueries(['settings']);
      }
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ الإعدادات');
    }
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spin size="large" />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>الإعدادات</title>
        <meta name="description" content="الإعدادات في نظام إدارة المساهمين" />
      </Helmet>

      <Container maxWidth="sm" sx={{ py: 4, mt: 6,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
        <Typography variant="h4" align="center" gutterBottom>
          إعدادات النظام
        </Typography>
        
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          centered
          sx={{ 
            mb: 3,
            '& .MuiTabs-indicator': {
              backgroundColor: '#28a745'
            },
            '& .Mui-selected': {
              color: '#28a745 !important'
            }
          }}
        >
          <Tab label="إعدادات العملة" />
          <Tab label="إعدادات التوقيت" />
          <Tab label="النسخ الاحتياطية" />
        </Tabs>

        {/* Currency Tab */}
        {tabIndex === 0 && (
          <Box sx={{ p: 2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
            <Autocomplete
              fullWidth
              value={currencies.find(c => c.value === settings.defaultCurrency) || null}
              onChange={(event, newValue) => {
                handleChange('defaultCurrency', newValue?.value);
              }}
              options={currencies}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="العملة الافتراضية"
                  sx={{
                    width: '300px',
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#28a745'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#28a745'
                    }
                  }}
                />
              )}
            />

            <TextField
              fullWidth
              type="number"
              label="سعر صرف الدولار"
              value={settings.USDtoIQD}
              step={0.01}
              min={0}
              inputProps={{
                min: 0,
                step: 0.01,
                onKeyPress: (e) => {
                  if (e.key === '-' || e.key === '+') {
                    e.preventDefault();
                  }
                }
              }}
              onChange={(e) => {
                const value = Math.max(0, parseFloat(e.target.value) || 0);
                handleChange('USDtoIQD', value);
              }}
              sx={{ 
                width: '300px',
                mt: 2,
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#28a745'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#28a745'
                }
              }}
            />
          </Box>
        )}

        {/* Timezone Tab */}
        {tabIndex === 1 && (
          <Box sx={{ p: 2,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
            <Autocomplete
              fullWidth
              value={settings.timezone}
              onChange={(event, newValue) => {
                handleChange('timezone', newValue || 'Asia/Baghdad');
              }}
              options={timezones}
              getOptionLabel={(option) => `${option.replace(/_/g, ' ')} (UTC${moment.tz(option).format('Z')})`}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="التوقيت"
                  sx={{
                    display:'flex',
                    justifyContent:'center',
                    alignItems:'center',
                    width: '300px',
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#28a745'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#28a745'
                    }
                  }}
                />
              )}
            />
          </Box>
        )}

        {/* Backup Tab */}
        {tabIndex === 2 && (
          <Box sx={{ p: 2, width: '100%' }}>
            {isLoadingBackups ? (
              <Box display="flex" justifyContent="center">
                <Spin size="large" />
              </Box>
            ) : (
              <List>
                {backupsData.backups.map((backup) => (
                  <ListItem
                    key={backup}
                    secondaryAction={
                      <Button
                        variant="contained"
                        onClick={() => restoreMutation.mutate(backup)}
                        disabled={restoreMutation.isPending}
                        startIcon={<RetweetOutlined style={{marginLeft: '8px'}} />}
                        sx={{ 
                          backgroundColor: '#28a745',
                          '&:hover': {
                            backgroundColor: '#218838'
                          }
                        }}
                      >
                        استعادة
                      </Button>
                    }
                  >
                    <ListItemText 
                      primary={backup}
                      secondary={moment(backup.replace('backup-', '').replace('.sql', '')).format('YYYY/MM/DD')}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {tabIndex !== 2 && (
          <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={() => settingsMutation.mutate(settings)}
              disabled={settingsMutation.isPending}
              startIcon={<SaveOutlined style={{marginLeft: '8px'}} />}
              sx={{ 
                px: 4,
                backgroundColor: '#28a745',
                '&:hover': {
                  backgroundColor: '#218838'
                }
              }}
            >
              {settingsMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
};

export default Settings;