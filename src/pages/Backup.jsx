import React from 'react';
import { Box, Typography, Container, List, ListItem, ListItemText, Button } from '@mui/material';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { Spin } from "antd";
import { RetweetOutlined, SaveOutlined } from '@ant-design/icons';
import moment from 'moment-timezone';
import Api from '../services/api';
import { Helmet } from 'react-helmet-async';

const Backup = () => {
  const { data: backupsData = { backups: [] }, isLoading: isLoadingBackups } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await Api.get('/api/backup/list');
      return response.data;
    }
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

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      return await Api.post('/api/backup/create');
    },
    onSuccess: () => {
      toast.success('تم إنشاء نسخة احتياطية جديدة بنجاح');
    },
    onError: (error) => {
      toast.error(error.message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    }
  });

  if (isLoadingBackups) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Spin size="large" />
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>النسخ الاحتياطية</title>
        <meta name="description" content="إدارة النسخ الاحتياطية في نظام إدارة المساهمين" />
      </Helmet>

      <Container maxWidth="sm" sx={{ py: 4, mt: 6 }}>
        <Typography variant="h4" align="center" gutterBottom>
          النسخ الاحتياطية
        </Typography>

        <Box display="flex" justifyContent="center" mb={3}>
          <Button
            variant="contained"
            onClick={() => createBackupMutation.mutate()}
            disabled={createBackupMutation.isPending}
            startIcon={<SaveOutlined style={{marginLeft: '8px'}} />}
            sx={{ 
              backgroundColor: '#28a745',
              '&:hover': {
                backgroundColor: '#218838'
              }
            }}
          >
            إنشاء نسخة احتياطية جديدة
          </Button>
        </Box>

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
      </Container>
    </>
  );
};

export default Backup;
