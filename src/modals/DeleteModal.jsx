import React from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { Spin } from "antd";
import { DeleteOutlined } from '@ant-design/icons';
import { CloseOutlined } from '@ant-design/icons';
const DeleteModal = ({ open, onClose, onConfirm, title, message, isLoading, ButtonText}) => {

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      dir={'rtl'}
      >
      <DialogTitle sx={{ textAlign: 'center' }}>
        {title || 'حذف العنصر'} 
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
            {message || 'هل أنت متأكد من حذف العنصر؟'}
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
          startIcon={<CloseOutlined />}
          size="small"
        >
          { 'إلغاء'}
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained" 
          color={"error"}
          disabled={isLoading}
          startIcon={isLoading ? <Spin size="large" /> : <DeleteOutlined />}
          size="small"
        >
          {isLoading? <Spin size="large" /> : ButtonText || 'حذف'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteModal;
