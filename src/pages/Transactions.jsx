import React, { useState, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { toast } from 'react-toastify';
import TableComponent from '../components/shared/TableComponent';
import AddTransactionModal from '../modals/AddTransactionModal';
import EditTransactionModal from '../modals/EditTransactionModal';
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import { 
  getCurrencyCell, 
  columnWidths
} from '../styles/tableStyles';
import { transactionsAPI, transformers, handleApiError } from '../services/apiHelpers';
import { showDeleteConfirmation, showSuccessAlert } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
  
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  
  const { formatAmount, currentCurrency } = useCurrencyManager();

  useEffect(() => {
    fetchTransactions();
  }, []);

  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await transactionsAPI.getAll();
      
      if (response.data && response.data.transactions) {
        
        const transformedTransactions = response.data.transactions.map(transformers.transaction);
        setTransactions(transformedTransactions);
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

  

  const columns = useMemo(() => [
    {
      field: 'investorName',
      headerName: 'اسم المساهم',
      width: columnWidths.large,
      sortable: true,
      filterable: true,
    },
    {
      field: 'type',
      headerName: 'نوع المعاملة',
      width: columnWidths.medium,
      sortable: true,
      filterable: true,
    },
    {
      field: 'amount',
      headerName: `المبلغ (${currentCurrency})`,
      width: columnWidths.currency,
      sortable: true,
      filterable: true,
      type: 'number',
      renderCell: (params) => (
        <span style={getCurrencyCell()}>
          {formatAmount(params.value, params.row.originalCurrency || 'IQD')}
        </span>
      )
    },
    {
      field: 'date',
      headerName: 'التاريخ',
      width: columnWidths.medium,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <span>
          {params.value ? new Date(params.value).toLocaleDateString('en-US') : ''}
        </span>
      )
    },
    {
      field: 'financialYear',
      headerName: 'السنة المالية',
      width: columnWidths.medium,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <span>
          {params.row.profitYear || 'غير محدد'}
        </span>
      )
    },
  
  ], [currentCurrency, formatAmount]);

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

  return (
    <Box className="content-area">
      {loading ? (
        <PageLoadingSpinner message="جاري تحميل بيانات العمليات المالية..." />
      ) : error ? (
        <ErrorAlert error={error} onRetry={fetchTransactions} />
      ) : (
        <>
          <TableComponent
            title="سجل العمليات المالية"
            data={transactions}
            columns={columns}
            onAdd={handleAddTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            addButtonText="إضافة عملية جديدة"
            searchPlaceholder="البحث في العمليات..."
          />

          
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
        </>
      )}
    </Box>
  );
};

export default Transactions; 