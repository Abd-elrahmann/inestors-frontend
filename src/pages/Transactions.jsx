import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Chip,
  InputBase
} from '@mui/material';
import { toast } from 'react-toastify';
import { Spin } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import AddTransactionModal from '../modals/AddTransactionModal';
import EditTransactionModal from '../modals/EditTransactionModal';
import { StyledTableCell, StyledTableRow } from '../styles/TableLayout';
import { transactionsAPI, transformers, handleApiError } from '../services/apiHelpers';
import { showDeleteConfirmation, showSuccessAlert } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Helmet } from 'react-helmet-async';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const { formatAmount, currentCurrency } = useCurrencyManager();

  useEffect(() => {
    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = transactions.filter(transaction => 
      transaction.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [transactions, searchQuery]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await transactionsAPI.getAll({
        page: page,
        limit: rowsPerPage,
        search: searchQuery
      });
      
      if (response.data && response.data.transactions) {
        const transformedTransactions = response.data.transactions.map(transformers.transaction);
        setTransactions(transformedTransactions);
        setFilteredTransactions(transformedTransactions);
      } else {
        throw new Error('تنسيق البيانات غير صحيح');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setAddModalOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDeleteTransaction = async (transaction) => {
    const confirmed = await showDeleteConfirmation(
      `${transaction.type} - ${transaction.amount.toFixed(2)} ريال`,
      'العملية المالية'
    );
    
    if (confirmed) {
      try {
        await transactionsAPI.delete(transaction.id);
        showSuccessAlert('تم حذف العملية المالية بنجاح');
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error(`خطأ في حذف العملية المالية: ${error.message}`);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchTransactions();
  };

  const handleEditSuccess = () => {
    fetchTransactions();
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  return (
    <>
    <Helmet>
      <title>المعاملات</title>
      <meta name="description" content="المعاملات في نظام إدارة المساهمين" />
    </Helmet>
    <Box className="content-area">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} mr={1} mt={2} spacing={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddTransaction}
          startIcon={<PlusOutlined style={{marginLeft: '10px'}} />}
        >
          إضافة عملية جديدة
        </Button>
        <InputBase
          placeholder="ابحث عن عملية..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 200 }}
        />
      </Stack>

      <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell align="center">اسم المساهم</StyledTableCell>
              <StyledTableCell align="center">نوع المعاملة</StyledTableCell>
              <StyledTableCell align="center">المبلغ ({currentCurrency})</StyledTableCell>
              <StyledTableCell align="center">التاريخ</StyledTableCell>
              <StyledTableCell align="center">السنة المالية</StyledTableCell>
              <StyledTableCell align="center">تعديل</StyledTableCell>
              <StyledTableCell align="center">حذف</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <StyledTableRow>
                <StyledTableCell colSpan={7} align="center">
                  <Spin size="large" />
                </StyledTableCell>
              </StyledTableRow>
            ) : !transactions || transactions.length === 0 ? (
              <StyledTableRow>
                <StyledTableCell colSpan={7} align="center">
                  لا توجد معاملات
                </StyledTableCell>
              </StyledTableRow>
            ) : (
              transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction) => (
                <StyledTableRow key={transaction.id}>
                  <StyledTableCell align="center">{transaction.investorName}</StyledTableCell>
                  <StyledTableCell align="center">
                    <Chip
                      label={transaction.type}
                      variant="outlined"
                      sx={{
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {formatAmount(transaction.amount / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), transaction.originalCurrency || 'IQD')}
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    {transaction.date ? new Date(transaction.date).toLocaleDateString('en-US') : ''}
                  </StyledTableCell>
                  <StyledTableCell align="center">{transaction.profitYear || 'غير محدد'}</StyledTableCell>
                  <StyledTableCell align="center">
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleEditTransaction(transaction)}
                    >
                      <EditOutlined />
                    </IconButton>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTransaction(transaction)}
                    >
                      <DeleteOutlined />
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={transactions.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 20]}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد الصفوف في الصفحة"
        />
      </TableContainer>

      <AddTransactionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditTransactionModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        transaction={selectedTransaction}
      />
    </Box>
    </>
  );
};

export default Transactions;