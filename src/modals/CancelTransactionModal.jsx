import React from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Spin } from "antd";
import { CloseOutlined } from '@ant-design/icons';

const CancelTransactionModal = ({ open, onClose, onConfirm, title, message, isLoading, ButtonText}) => {

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      dir={'rtl'}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        {title || 'الغاء العملية'} 
      </DialogTitle>
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2,
          py: 2 
        }}>
          <FaExclamationTriangle size={48} color="#f44336" />
          <Typography>
            {message || 'هل أنت متأكد من الغاء العملية؟'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        gap: 2,
        flexDirection: 'row-reverse',
        px: 2,
        py: 2,
        pb: 2
      }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          color={"primary"}
          variant="outlined"
          sx={{fontSize: '15px'}}
          size="small"
        >
          {'إلغاء'}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained" 
          color={"error"}
          disabled={isLoading}
          size="small"
          sx={{fontSize: '15px'}}
        >
          {isLoading ? <Spin size="large" /> : ButtonText || 'الغاء العملية'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CancelTransactionModal;
