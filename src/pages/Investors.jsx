import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box } from '@mui/material';
import TableComponent from '../components/TableComponent';
import AddInvestorModal from '../components/AddInvestorModal';
import EditInvestorModal from '../components/EditInvestorModal';
import { PageLoadingSpinner, ErrorAlert, PageLoader } from '../components/shared/LoadingComponents';
import { 
  getCurrencyCell, 
  getPercentageCell, 
  columnWidths 
} from '../styles/tableStyles';
import { investorsAPI, transformers, handleApiError } from '../services/apiHelpers';
import { showDeleteConfirmation, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import { useCurrencyManager } from '../utils/globalCurrencyManager';

const Investors = () => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  
  // 💰 استخدام مدير العملة المركزي
  const { formatAmount, currentCurrency } = useCurrencyManager();

  useEffect(() => {
    fetchInvestors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🚀 تحسين دالة جلب البيانات - تبسيط العمليات
  const fetchInvestors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // تحسين الأداء: استخدام pagination بدلاً من جلب جميع البيانات
      const response = await investorsAPI.getAll({ 
        limit: 50,  // تقليل العدد لتحسين الأداء
        page: 1,
        includeInactive: 'true'  // جلب جميع المساهمين (نشط وغير نشط)
      });
      
      if (response.data && response.data.investors) {
        const transformedInvestors = response.data.investors.map(transformers.investor);
        setInvestors(transformedInvestors);
      } else {
        throw new Error('تنسيق البيانات غير صحيح');
      }
    } catch (err) {
      console.error('Error fetching investors:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);


  const columns = useMemo(() => [
    {
      field: 'name',
      headerName: 'اسم المساهم',
      width: columnWidths.large,
      sortable: false,
    },
    {
      field: 'nationalId',
      headerName: 'رقم الهوية',
      width: columnWidths.medium,
      sortable: false,
    },
    {
      field: 'phone',
      headerName: 'رقم الهاتف (اختياري)',
      width: columnWidths.medium,
      sortable: false,
    },
    {
      field: 'contribution',
      headerName: `المبلغ المساهم (${currentCurrency})`,
      width: columnWidths.currency,
      sortable: false,
      // 💰 استخدام مدير العملة المركزي
      renderCell: (params) => (
        <span style={getCurrencyCell()}>
          {formatAmount(params.value, params.row.originalCurrency || 'IQD')}
        </span>
      )
    },
    {
      field: 'sharePercentage',
      headerName: 'نسبة المساهمة',
      width: columnWidths.medium,
      sortable: false,
      renderCell: (params) => (
        <span style={getPercentageCell()}>
          {params.value}
        </span>
      )
    },
    {
      field: 'joinDate',
      headerName: 'تاريخ الانضمام',
      width: columnWidths.medium,
      sortable: false,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const handleAddInvestor = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleAddSuccess = useCallback(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleEditInvestor = useCallback((investor) => {
    setSelectedInvestor(investor);
    setShowEditModal(true);
  }, []);

  const handleDeleteInvestor = useCallback(async (investor) => {
    const confirmed = await showDeleteConfirmation(investor.name, 'المساهم');
    
    if (confirmed) {
      // الحذف النهائي فقط من جدول المساهمين
      try {
        await investorsAPI.delete(investor.id, { forceDelete: 'true' });
        showSuccessAlert(`تم حذف المساهم "${investor.name}" نهائياً من النظام`);
        fetchInvestors();
      } catch (error) {
        showErrorAlert(`خطأ في حذف المساهم: ${error.message}`);
      }
    }
  }, [fetchInvestors]);

  const handleEditSuccess = useCallback(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedInvestor(null);
  }, []);
  return (
    <Box className="content-area">
      <PageLoader loading={loading} skeletonType="table">
        {error ? (
          <ErrorAlert error={error} onRetry={fetchInvestors} />
        ) : (
          <TableComponent
            title="قائمة المساهمين"
            data={investors}
            columns={columns}
            onAdd={handleAddInvestor}
            onEdit={handleEditInvestor}
            onDelete={handleDeleteInvestor}
            addButtonText="إضافة مساهم جديد"
            searchPlaceholder="البحث عن مساهم..."
          />
        )}
      </PageLoader>
      
      <AddInvestorModal
        open={showAddModal}
        onClose={handleCloseModal}
        onSuccess={handleAddSuccess}
      />
      
      <EditInvestorModal
        open={showEditModal}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        investor={selectedInvestor}
      />
    </Box>
  );
};

export default Investors; 