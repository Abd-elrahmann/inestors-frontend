import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Menu,
  MenuItem,
  Divider,
  LinearProgress
} from '@mui/material';
import { columnWidths, getCurrencyCell } from '../styles/tableStyles';
import {
  Add as AddIcon,
  Calculate as CalculateIcon,
  CheckCircle as ApproveIcon,
  Send as DistributeIcon,
  Autorenew as RolloverIcon,
  GetApp as ExportIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  PlayArrow as ActiveIcon,
  Stop as InactiveIcon,
  Lock as ClosedIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
// eslint-disable-next-line no-unused-vars
import { financialYearsAPI, transformers } from '../services/apiHelpers';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../utils/sweetAlert';
import Swal from 'sweetalert2';
import AddFinancialYearModal from '../modals/AddFinancialYearModal';
import EditFinancialYearModal from '../modals/EditFinancialYearModal';
import ProfitDistributionsModal from '../modals/ProfitDistributionsModal';
import TableComponent from '../components/shared/TableComponent';
import { useCurrencyManager } from '../utils/globalCurrencyManager';
import { Spin } from 'antd';
import { Helmet } from 'react-helmet-async';

const FinancialYears = () => {
  const [financialYears, setFinancialYears] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [distributionsModalOpen, setDistributionsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [rolloverDialogOpen, setRolloverDialogOpen] = useState(false);
  const [rolloverSettings, setRolloverSettings] = useState({
    percentage: 100,
    autoRollover: false,
    autoRolloverDate: ''
  });
  const [rolloverAmounts, setRolloverAmounts] = useState({
    totalProfit: 0,
    rolloverAmount: 0,
    remainingAmount: 0
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [calculatingDistributions, setCalculatingDistributions] = useState(new Set());
  
  const { formatAmount, currentCurrency } = useCurrencyManager();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem('user');

        if (userData) {
          const user = JSON.parse(userData);

          const role = user.role || 'user';
          const adminStatus = role === 'admin';
          
          setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsAdmin(false);
      }
    };

    getUserRole();
    window.addEventListener('storage', getUserRole);
    return () => window.removeEventListener('storage', getUserRole);
  }, []);

  useEffect(() => {
  }, [isAdmin]);

  useEffect(() => {
    const getSidebarState = () => {
      try {
        const savedState = localStorage.getItem('sidebarOpen');
        setIsSidebarOpen(savedState !== null ? JSON.parse(savedState) : true);
      } catch {
        setIsSidebarOpen(true);
      }
    };

    getSidebarState();
    
    const handleStorageChange = () => {
      getSidebarState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebarToggle', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggle', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    fetchFinancialYears();
    const interval = setInterval(fetchFinancialYears, 5 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFinancialYears = async () => {
    try {
      setLoading(true);
            
      const response = await financialYearsAPI.getAll({ 
        t: Date.now(),
        _nocache: Math.random().toString(36) 
      });
      
      if (response.success) {
        const yearsWithRealTimeData = (response.data.financialYears || []).map(year => ({
          ...year,
          ...calculateRealTimeData(year),
          distributions: [] 
        }));
        
        setFinancialYears(yearsWithRealTimeData);
        
        
        return yearsWithRealTimeData; 
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
      showErrorAlert('حدث خطأ أثناء جلب السنوات المالية');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateRealTimeData = (year) => {
    if (!year || !year.startDate || !year.endDate) {
      return {
        totalDaysCalculated: 0,
        elapsedDays: 0,
        remainingDays: 0,
        progressPercentage: 0,
        realStatus: year?.status || 'draft',
        isActive: false,
        isPending: false,
        isExpired: false
      };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const startDate = new Date(year.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(year.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    const diffInMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1; 
    
    let elapsedDays = 0;
    let remainingDays = 0;
    let progressPercentage = 0;
    
    if (now < startDate) {
      elapsedDays = 0;
      remainingDays = totalDays;
      progressPercentage = 0;
    } else if (now > endDate) {
      elapsedDays = totalDays;
      remainingDays = 0;
      progressPercentage = 100;
    } else {
      const diffTime = now - startDate;
      elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      remainingDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      progressPercentage = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    }
    
    let realStatus = year.status || 'draft';
    if (now < startDate) {
      realStatus = 'pending'; 
    } else if (now >= startDate && now <= endDate) {
      if (year.status === 'draft') {
        realStatus = 'active'; 
      }
    } else if (now > endDate) {
      if (year.status !== 'closed') {
        realStatus = 'expired'; 
      }
    }
    
    return {
      totalDaysCalculated: totalDays,
      elapsedDays: Math.max(0, elapsedDays),
      remainingDays: Math.max(0, remainingDays),
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      realStatus,
      isActive: now >= startDate && now <= endDate,
      isPending: now < startDate,
      isExpired: now > endDate && year.status !== 'closed'
    };
  };

  const handleCalculateDistributions = async (yearId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showErrorAlert('انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى');
      window.location.href = '/login';
      return;
    }

    try {
      setCalculatingDistributions(prev => new Set([...prev, yearId]));

      let selectedYear = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!selectedYear && attempts < maxAttempts) {
        attempts++;

        const updatedYears = await fetchFinancialYears();
        
        if (updatedYears && updatedYears.length > 0) {
          selectedYear = updatedYears.find(year => year._id === yearId);
          if (selectedYear) {
            break;
          }
        }

        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); 
        }
      }

      if (!selectedYear) {
        throw new Error(`لم يتم العثور على السنة المالية (${yearId}) بعد ${maxAttempts} محاولات`);
      }

      const isRecalculation = selectedYear.status === 'calculated';
      
      const now = new Date();
      const endDate = new Date(selectedYear.endDate);
      const hasFinancialYearEnded = now >= endDate;
      
      let options = {};
      
      if (hasFinancialYearEnded) {
        const title = isRecalculation ? 'إعادة توزيع الأرباح' : 'توزيع الأرباح';
        const message = isRecalculation ? 
          'هل أنت متأكد من إعادة توزيع الأرباح؟ سيتم حذف التوزيعات الحالية وتوزيع أرباح جديدة للفترة الكاملة.' :
          'السنة المالية انتهت. سيتم حساب الأرباح للفترة الكاملة.';
        
        const confirmed = await showConfirmAlert(title, message);
        if (!confirmed) return;
        
        options = { forceFullPeriod: true };
      } else {
        const title = isRecalculation ? 'إعادة توزيع الأرباح' : 'توزيع الأرباح';
        const result = await Swal.fire({
          title: title,
          html: `
            <div style="text-align: right; direction: rtl;">
              <p>${isRecalculation ? 'اختر طريقة إعادة حساب الأرباح:' : 'السنة المالية نشطة حالياً. اختر طريقة الحساب:'}</p>
              <div style="margin: 20px 0;">
                <input type="radio" id="actualDays" name="calculationType" value="actual" checked>
                <label for="actualDays" style="margin-right: 10px;">
                  🕐 حساب الأيام الفعلية المنقضية (موصى به)
                  <br><small style="color: #666;">يحسب الأرباح حتى تاريخ اليوم فقط</small>
                </label>
              </div>
              <div style="margin: 20px 0;">
                <input type="radio" id="fullPeriod" name="calculationType" value="full">
                <label for="fullPeriod" style="margin-right: 10px;">
                  📅 حساب الفترة الكاملة
                  <br><small style="color: #666;">يحسب الأرباح لكامل فترة السنة المالية</small>
                </label>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: isRecalculation ? 'إعادة حساب الأرباح' : 'حساب الأرباح',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#dc3545',
          reverseButtons: true,
          preConfirm: () => {
            const selectedType = document.querySelector('input[name="calculationType"]:checked')?.value;
            return selectedType;
          }
        });
        
        if (!result.isConfirmed) return;
        
        options = { forceFullPeriod: result.value === 'full' };
      }
      
      
      const response = await financialYearsAPI.calculateDistributions(yearId, options);
      
      
      if (response.success) {
        const message = response.data?.isRecalculation ? 
          'تم إعادة توزيع الأرباح بنجاح' : 
          'تم توزيع الأرباح بنجاح';
        showSuccessAlert(message);
        fetchFinancialYears();
      } else {
        throw new Error(response.message || 'فشل في حساب التوزيعات');
      }
      
    } catch (error) {
        console.error('خطأ في حساب التوزيعات:', error);
      
      let errorMessage = 'حدث خطأ أثناء حساب توزيع الأرباح';
      
      if (error.message.includes('انتهت صلاحية الجلسة')) {
        errorMessage = 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.message.includes('فشل في الاتصال')) {
        errorMessage = 'فشل في الاتصال بالخادم - تحقق من اتصال الإنترنت';
      } else if (error.message.includes('403')) {
        errorMessage = 'ليس لديك صلاحية لتنفيذ هذا الإجراء';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showErrorAlert(errorMessage);
      
    } finally {
      setCalculatingDistributions(prev => {
        const newSet = new Set(prev);
        newSet.delete(yearId);
        return newSet;
      });
    }
  };

  const handleApproveDistributions = async (yearId) => {
    try {
      const selectedYear = financialYears.find(year => year._id === yearId);
      
      let confirmMessage = 'هل أنت متأكد من الموافقة على توزيعات الأرباح؟ ';
      
      if (selectedYear?.rolloverSettings?.rolloverPercentage > 0) {
        confirmMessage += `سيتم تدوير ${selectedYear.rolloverSettings.rolloverPercentage}% من الأرباح تلقائياً إلى رأس المال.`;
      } else {
        confirmMessage += 'سيتم توزيع الأرباح على المساهمين.';
      }
      
      const confirmed = await showConfirmAlert('الموافقة على التوزيعات', confirmMessage);
      
      if (confirmed) {
        const response = await financialYearsAPI.approveDistributions(yearId);
        if (response.success) {
          showSuccessAlert('تم الموافقة على توزيعات الأرباح بنجاح');
          
          if (selectedYear?.rolloverSettings?.rolloverPercentage > 0) {
            try {
              const rolloverResponse = await financialYearsAPI.rolloverProfits(yearId, {
                percentage: selectedYear.rolloverSettings.rolloverPercentage,
                autoRollover: selectedYear.rolloverSettings.autoRollover,
                autoRolloverDate: selectedYear.rolloverSettings.autoRolloverDate
              });
              
              if (rolloverResponse.success) {
                showSuccessAlert(`تم تدوير ${selectedYear.rolloverSettings.rolloverPercentage}% من الأرباح تلقائياً`);
              }
            } catch (rolloverError) {
              console.error('Error auto-rolling over profits:', rolloverError);
              showErrorAlert('تم الموافقة بنجاح لكن حدث خطأ في التدوير التلقائي');
            }
          }
          
          fetchFinancialYears();
        }
      }
    } catch (error) {
      console.error('Error approving distributions:', error);
      showErrorAlert('حدث خطأ أثناء الموافقة على التوزيعات');
    }
  };

  const handleRolloverProfits = async (yearId, settings) => {
    try {
      const response = await financialYearsAPI.rolloverProfits(yearId, settings);
      
      if (response.success) {
        showSuccessAlert('تم تدوير الأرباح بنجاح');
        await fetchFinancialYears();
      } else {
        showErrorAlert(response.message || 'حدث خطأ أثناء تدوير الأرباح');
      }
    } catch (error) {
      if (error.response?.data?.message === 'لا توجد توزيعات أرباح موافق عليها للترحيل') {
        showErrorAlert('لا توجد توزيعات أرباح موافق عليها للترحيل');
      } else {
        showErrorAlert(error.message || 'حدث خطأ أثناء تدوير الأرباح');
      }
    }
  };

  const handleManualRollover = async (year) => {
    if (!year) return;

    if (year.status !== 'approved' && year.status !== 'distributed') {
      showErrorAlert('لا توجد توزيعات أرباح موافق عليها للترحيل');
      return;
    }

    try {
      const response = await financialYearsAPI.getDistributions(year._id);
      if (response.success) {
        const distributions = response.data.distributions || [];
        const totalProfit = distributions.reduce((sum, dist) => sum + (dist.calculation?.calculatedProfit || 0), 0);
        
        setSelectedYear(year);
        setRolloverDialogOpen(true);
        setRolloverAmounts({
          totalProfit,
          rolloverAmount: (totalProfit * rolloverSettings.percentage) / 100,
          remainingAmount: (totalProfit * (100 - rolloverSettings.percentage)) / 100
        });
      } else {
        showErrorAlert('حدث خطأ أثناء جلب تفاصيل التوزيعات');
      }
    } catch (error) {
      console.error('Error fetching distributions:', error);
      showErrorAlert('حدث خطأ أثناء جلب تفاصيل التوزيعات');
    }
  };

  useEffect(() => {
    if (rolloverAmounts.totalProfit > 0) {
      setRolloverAmounts(prev => ({
        ...prev,
        rolloverAmount: (prev.totalProfit * rolloverSettings.percentage) / 100,
        remainingAmount: (prev.totalProfit * (100 - rolloverSettings.percentage)) / 100
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolloverSettings.percentage]);

  const handleDeleteFinancialYear = async (yearId) => {
    try {
      const year = financialYears.find(y => y._id === yearId);
      
      if (!year) {
        showErrorAlert('لم يتم العثور على السنة المالية');
        return;
      }

      if (year.status === 'distributed' || year.status === 'closed') {
        showErrorAlert('لا يمكن حذف السنة المالية لوجود توزيعات أرباح مرتبطة بها');
        return;
      }

      const confirmed = await showConfirmAlert(
        'حذف السنة المالية',
        'هل أنت متأكد من حذف هذه السنة المالية؟ لا يمكن التراجع عن هذا الإجراء.'
      );

      if (!confirmed) return;

      const response = await financialYearsAPI.delete(yearId);
      
      if (response.success) {
        showSuccessAlert('تم حذف السنة المالية بنجاح');
        await fetchFinancialYears();
      } else {
        showErrorAlert(response.message || 'حدث خطأ أثناء حذف السنة المالية');
      }
    } catch (error) {
      if (error.response?.data?.message === 'لا يمكن حذف السنة المالية لوجود توزيعات أرباح مرتبطة بها') {
        showErrorAlert('لا يمكن حذف السنة المالية لوجود توزيعات أرباح مرتبطة بها');
      } else {
        showErrorAlert(error.message || 'حدث خطأ أثناء حذف السنة المالية');
      }
    }
  };

  const handleCloseFinancialYear = async (yearId) => {
    try {
      const confirmed = await showConfirmAlert(
        'إغلاق السنة المالية',
        'هل أنت متأكد من إغلاق هذه السنة المالية؟ لن يمكن التراجع عن هذا الإجراء.'
      );
      
      if (confirmed) {
        const response = await financialYearsAPI.closeYear(yearId);
        if (response.success) {
          showSuccessAlert('تم إغلاق السنة المالية بنجاح');
          fetchFinancialYears();
        }
      }
    } catch (error) {
      console.error('Error closing financial year:', error);
      showErrorAlert('حدث خطأ أثناء إغلاق السنة المالية');
    }
  };

  const handleExportReports = async () => {
    try {
      window.location.href = '/reports';
      showSuccessAlert('سيتم توجيهك إلى مركز التقارير لتصدير جميع التقارير');
    } catch (error) {
      console.error('Error navigating to reports:', error);
      showErrorAlert('حدث خطأ أثناء التوجيه لصفحة التقارير');
    }
  };

  const getStatusColor = (status, realStatus) => {
    const colors = {
      'draft': 'default',
      'active': 'success',
      'pending': 'info',
      'calculated': 'primary',
      'approved': 'warning',
      'distributed': 'success',
      'closed': 'error',
      'expired': 'error'
    };
    
    if (['calculated', 'approved', 'distributed', 'closed'].includes(status)) {
      return colors[status];
    }
    
    return colors[realStatus] || colors[status] || 'default';
  };

  const getStatusText = (status, realStatus) => {
    const statusMap = {
      'draft': 'مسودة',
      'active': 'نشطة',
      'pending': 'في الانتظار',
      'calculated': 'محسوب',
      'approved': 'موافق عليه',
      'distributed': 'موزع',
      'closed': 'مغلق',
      'expired': 'منتهية الصلاحية'
    };

    if (['calculated', 'approved', 'distributed', 'closed'].includes(status)) {
      return statusMap[status];
    }
    
    return statusMap[realStatus] || statusMap[status] || status || 'غير محدد';
  };

  const getStatusIcon = (status, realStatus) => {
    const iconMap = {
      'active': <ActiveIcon />,
      'pending': <ScheduleIcon />,
      'closed': <ClosedIcon />,
      'expired': <InactiveIcon />
    };
    return iconMap[realStatus] || iconMap[status] || null;
  };

  const canExport = (year) => year && ['calculated', 'approved', 'distributed', 'closed'].includes(year.status);

  
  const columns = useMemo(() => [

    {
      field: 'year',
      headerName: 'السنة المالية',
      width: columnWidths.medium,
      sortable: true,
      filterable: true,
    },
    {
      field: 'totalProfit',
      headerName: `إجمالي الأرباح (${currentCurrency})`,
      width: columnWidths.currency,
      sortable: true,
      filterable: true,
      type: 'number',
      renderCell: (params) => (
        <span style={getCurrencyCell()}>
          {formatAmount(params.value / (currentCurrency === 'IQD' ? 1 : 1).toFixed(5), params.row.currency || 'IQD')}
        </span>
      )
    },
    {
      field: 'dateRange',
      headerName: 'الفترة الزمنية',
      width: 150, 
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box textAlign="center">
          <Typography variant="body2" fontWeight="bold">
            {params.row?.startDate ? new Date(params.row.startDate).toLocaleDateString('en-US') : 'غير محدد'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إلى {params.row?.endDate ? new Date(params.row.endDate).toLocaleDateString('en-US') : 'غير محدد'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({params.row?.totalDaysCalculated || 0} يوم)
          </Typography>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 140, 
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box textAlign="center">
          <Chip
            icon={getStatusIcon(params.row.status, params.row.realStatus)}
            label={getStatusText(params.row.status, params.row.realStatus)}
            color={getStatusColor(params.row.status, params.row.realStatus)}
            size="small"
            variant={params.row.isExpired ? "filled" : "outlined"}
            sx={{
              animation: params.row.isExpired ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 }
              }
            }}
          />
          {params.row.isExpired && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
              تحتاج إغلاق
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: 'progress',
      headerName: 'التقدم الزمني',
      width: 200, 
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ width: '100%', px: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" fontWeight="bold">
              {params.row?.elapsedDays || 0} يوم مضى
            </Typography>
            <Typography variant="caption" fontWeight="bold" color={(params.row?.remainingDays || 0) > 0 ? 'primary' : 'error'}>
              {(params.row?.remainingDays || 0) > 0 ? `${params.row.remainingDays-1} متبقي` : 'انتهت'}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={params.row.progressPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: params.row.isExpired ? '#f44336' : 
                               params.row.progressPercentage > 90 ? '#f44336' :
                               params.row.progressPercentage > 75 ? '#ff9800' : '#4caf50'
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {params.row.progressPercentage.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.isPending ? 'لم تبدأ' : params.row.isActive ? 'نشطة' : 'منتهية'}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      field: 'dailyProfitRate',
      headerName: 'معدل الربح اليومي',
      width: 200,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        
        const getDailyProfitRate = () => {
          
          if (['calculated', 'approved', 'distributed', 'closed'].includes(params.row.status) && params.row.distributions?.length > 0) {
            return params.row.distributions[0].calculation?.dailyProfitRate;
          }
          
          if (['calculated', 'approved', 'distributed', 'closed'].includes(params.row.status) && params.row.dailyProfitRate) {
            return params.row.dailyProfitRate;
          }
          
          return null;
        };

        const dailyRate = getDailyProfitRate();
        
        return (
          <Box textAlign="center">
            {dailyRate !== null ? (
              <>
                <Typography variant="body2" fontWeight="bold">
                  {dailyRate.toFixed(6)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {params.row.currency}/وحدة/يوم
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                يجب حساب التوزيعات أولاً
              </Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: isAdmin ? 'الإجراءات' : 'عرض',
      width: isAdmin ? 170 : 100,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          
          {isAdmin && (
            <>
              
              <Tooltip title="توزيع الأرباح">
                <IconButton
                  size="small"
                  color="success"
                  disabled={calculatingDistributions.has(params.row._id)}
                  onClick={() => handleCalculateDistributions(params.row._id)}
                  sx={{
                    animation: calculatingDistributions.has(params.row._id) ? 'spin 1s linear infinite' : 'bounce 2s infinite',
                    '@keyframes bounce': {
                      '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                      '40%': { transform: 'translateY(-3px)' },
                      '60%': { transform: 'translateY(-1px)' }
                    },
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                >
                  <DistributeIcon />
                </IconButton>
              </Tooltip>

              
              <Tooltip title="الموافقة على التوزيعات">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleApproveDistributions(params.row._id)}
                >
                  <ApproveIcon />
                </IconButton>
              </Tooltip>


              {(params.row.status === 'approved' || params.row.status === 'distributed') && (
                <Tooltip title="تدوير الأرباح">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => handleManualRollover(params.row)}
                  >
                    <RolloverIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          <Tooltip title="عرض التنبيهات">
            <IconButton
              size="small"
              color="info"
              onClick={() => {
                setSelectedYear(params.row);
                setDistributionsModalOpen(true);
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

           <Tooltip title="المزيد">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setMenuAnchor(e.currentTarget);
                    setSelectedYear(params.row);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
        </Box>
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [calculatingDistributions, isAdmin, currentCurrency]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Spin size="large" />
        </Box>
      </Container>
    );
  }

  return (
    <>
     <Helmet>
      <title>السنوات المالية</title>
      <meta name="description" content="السنوات المالية في نظام إدارة المساهمين" />
    </Helmet>
    <Container 
      maxWidth={false} 
      sx={{ 
        mt: 4, 
        mb: 4,
        px: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        maxWidth: '100%'
      }}
    >
      {financialYears.some(year => year.isExpired) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            تحذير: يوجد {financialYears.filter(year => year.isExpired).length} سنة مالية منتهية الصلاحية تحتاج إلى إغلاق
          </Typography>
        </Alert>
      )}

      {financialYears.some(year => year.isActive && year.status === 'draft') && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            يوجد {financialYears.filter(year => year.isActive && year.status === 'draft').length} سنة مالية نشطة تحتاج إلى حساب توزيع الأرباح
          </Typography>
        </Alert>
      )}

      {financialYears.some(year => {
        if (!year.rolloverSettings?.autoRollover || !year.rolloverSettings?.autoRolloverDate) return false;
        const autoDate = new Date(year.rolloverSettings.autoRolloverDate);
        const now = new Date();
        return now >= autoDate && ['distributed'].includes(year.status);
      }) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">
            تحذير: يوجد سنوات مالية تحتاج تدوير تلقائي للأرباح
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body1">{error}</Typography>
          <Button onClick={fetchFinancialYears} sx={{ mt: 1 }}>
            إعادة المحاولة
          </Button>
        </Alert>
      )}

      <Paper 
        sx={{ 
          height: {
            xs: 'calc(100vh - 250px)',
            sm: 'calc(100vh - 220px)',
            md: 'calc(100vh - 200px)'
          },
          display: 'flex', 
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 3
        }}
      >
        <Spin spinning={loading}>
          <TableComponent
            title="السنوات المالية"
            data={financialYears.map(year => ({
              ...year,
              id: year._id || year.id || Math.random().toString(36), 
              className: year.isExpired ? 'financial-year-expired' : 
                        year.isActive ? 'financial-year-active' : 
                        year.isPending ? 'financial-year-pending' : ''
            }))}
            columns={columns.map(col => ({
              ...col,
              width: isSidebarOpen ? col.width : Math.max(col.width * 1.2, 120)
            }))}
            onAdd={isAdmin ? () => setAddModalOpen(true) : null}
            addButtonText={isAdmin ? "إضافة سنة مالية" : null}
            searchPlaceholder="البحث في السنوات المالية..."
            getRowClassName={(params) => 
              params.row?.isExpired ? 'financial-year-expired' : 
              params.row?.isActive ? 'financial-year-active' : 
              params.row?.isPending ? 'financial-year-pending' : ''
            }
            additionalActions={
              <Button
                variant="outlined"
                onClick={fetchFinancialYears}
                startIcon={loading ? <QuickLoader size={16} /> : <SettingsIcon />}
                disabled={loading}
                sx={{ ml: 1 }}
              >
                {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
              </Button>
            }
          />
        </Spin>
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {selectedYear && canExport(selectedYear) && [
          <MenuItem key="reports" onClick={() => {
            handleExportReports();
            setMenuAnchor(null);
          }}>
            📊 مركز التقارير
          </MenuItem>,
          <Divider key="divider" />
        ]}
        <MenuItem onClick={() => {
          setEditModalOpen(true);
          setMenuAnchor(null);
        }}>
          تعديل السنة المالية
        </MenuItem>
        {selectedYear?.isExpired && (
          <MenuItem 
            onClick={() => {
              handleCloseFinancialYear(selectedYear._id);
              setMenuAnchor(null);
            }}
            sx={{ color: 'error.main' }}
          >
            إغلاق السنة المالية
          </MenuItem>
        )}
        <Divider />
        <MenuItem 
          onClick={() => {
            handleDeleteFinancialYear(selectedYear._id);
            setMenuAnchor(null);
          }}
          sx={{ 
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <DeleteIcon fontSize="small" />
          حذف السنة المالية
        </MenuItem>
      </Menu>

      <Dialog 
        open={rolloverDialogOpen} 
        onClose={() => setRolloverDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RolloverIcon color="warning" />
            تدوير الأرباح - السنة المالية {selectedYear?.year}
            <Chip label="تدوير يدوي" color="warning" size="small" variant="outlined" />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              إجمالي الأرباح المحسوبة: {new Intl.NumberFormat('ar-EG').format(rolloverAmounts.totalProfit)} {selectedYear?.currency}
            </Typography>
            <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2">
                <strong>تدوير يدوي:</strong> تم إنشاء هذه السنة المالية بدون تحديد نسبة تدوير مسبقة. 
                حدد النسبة المطلوبة للتدوير وسيتم إعادة توزيع الأرباح تلقائياً.
              </Typography>
            </Alert>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="نسبة التدوير (%)"
            type="number"
            fullWidth
            variant="outlined"
            value={rolloverSettings.percentage}
            onChange={(e) => setRolloverSettings({
              ...rolloverSettings,
              percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
            })}
            inputProps={{ min: 0, max: 100 }}
            sx={{ mb: 2 }}
            helperText="أدخل النسبة المطلوبة للتدوير (0-100%)"
          />
          <Alert severity="info" sx={{ mb: 2 }}>
            سيتم تدوير {rolloverSettings.percentage}% من الأرباح ({new Intl.NumberFormat('ar-EG').format(rolloverAmounts.rolloverAmount)} {selectedYear?.currency}) إلى رأس المال كإيداعات جديدة
          </Alert>
          {rolloverSettings.percentage < 100 && (
            <Alert severity="warning">
              المبلغ المتبقي ({new Intl.NumberFormat('ar-EG').format(rolloverAmounts.remainingAmount)} {selectedYear?.currency}) سيتم توزيعه على المساهمين
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRolloverDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={() => handleRolloverProfits(selectedYear?._id, rolloverSettings)}
            variant="contained"
            color="warning"
            startIcon={<RolloverIcon />}
          >
            تنفيذ التدوير اليدوي
          </Button>
        </DialogActions>
      </Dialog>

      <AddFinancialYearModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchFinancialYears}
      />

      <EditFinancialYearModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchFinancialYears}
        financialYear={selectedYear}
      />

      <ProfitDistributionsModal
        open={distributionsModalOpen}
        onClose={() => setDistributionsModalOpen(false)}
        financialYear={selectedYear}
      />
    </Container>
    </>
  );
};

export default FinancialYears; 