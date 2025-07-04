import React, { useState, useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { toast } from 'react-toastify';
import TableComponent from '../components/TableComponent';
import AddTransactionModal from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';
import { PageLoadingSpinner, ErrorAlert } from '../components/shared/LoadingComponents';
import { 
  getCurrencyCell, 
  getStatusCell,
  columnWidths
} from '../styles/tableStyles';
import { transactionsAPI, transformers, handleApiError } from '../utils/apiHelpers';
import { showDeleteConfirmation, showSuccessAlert } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // 💰 استخدام مدير العملة المركزي
  const { formatAmount, currentCurrency } = useCurrencyManager();

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ تحسين دالة جلب المعاملات - تبسيط العمليات
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await transactionsAPI.getAll();
      
      if (response.data && response.data.transactions) {
        // ✅ تبسيط - تحويل مباشر بدون عمليات إضافية
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

  // ✅ إزالة تحديث العملة الزائد لتسريع الأداء

  // Define table columns with flexible widths
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
      // 💰 استخدام مدير العملة المركزي
      renderCell: (params) => (
        <span style={getCurrencyCell()}>
          {formatAmount(params.value, params.row.originalCurrency || 'IQD')}
        </span>
      )
    },
    {
      field: 'date',
      headerName: 'التاريخ',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      type: 'date',
      valueGetter: (params) => {
        if (params.value) {
          return new Date(params.value);
        }
        return null;
      }
    },
    {
      field: 'description',
      headerName: 'الوصف',
      flex: 1.8,
      minWidth: 200,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true
    },
    {
      field: 'status',
      headerName: 'الحالة',
      flex: 1,
      minWidth: 120,
      headerAlign: 'center',
      align: 'center',
      sortable: true,
      filterable: true,
      renderCell: (params) => (
        <span style={getStatusCell(params.value, 'مكتمل', 'قيد المعالجة')}>
          {params.value}
        </span>
      )
    }
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
      `${transaction.type} - ${transaction.amount} ريال`, 
      'العملية المالية'
    );
    
    if (confirmed) {
      try {
        await transactionsAPI.delete(transaction.id);
        showSuccessAlert('تم حذف العملية المالية بنجاح');
        fetchTransactions(); // Refresh the data
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error(`خطأ في حذف العملية المالية: ${error.message}`);
      }
    }
  };

  const handleAddSuccess = () => {
    fetchTransactions(); // Refresh transactions list
  };

  const handleEditSuccess = () => {
    fetchTransactions(); // Refresh transactions list
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

          {/* Add Transaction Modal */}
          <AddTransactionModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSuccess={handleAddSuccess}
          />

          {/* Edit Transaction Modal */}
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